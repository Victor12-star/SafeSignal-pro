-- SafeSignal backend security foundation
-- Production intent: owner-isolated data, server-side SMS orchestration, no raw public access tokens.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  phone_e164 text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  home_country_code char(2) not null default 'SE',
  preferred_language varchar(10) not null default 'en',
  current_safety_region char(2) not null default 'SE',
  low_data_mode_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_name text not null check (char_length(trim(contact_name)) between 1 and 120),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  relationship_tag text not null default 'Family',
  contact_group text not null default 'Family',
  acceptance_status text not null default 'PENDING'
    check (acceptance_status in ('PENDING','ACCEPTED','DECLINED','BLOCKED')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, phone_e164)
);

create index trusted_contacts_user_id_idx on public.trusted_contacts(user_id);

create trigger trusted_contacts_set_updated_at
before update on public.trusted_contacts
for each row execute function public.set_updated_at();

create or replace function public.protect_trusted_contact_acceptance()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' and new.acceptance_status <> 'PENDING' then
      raise exception 'Trusted-contact acceptance is server controlled';
    end if;

    if tg_op = 'UPDATE' and new.acceptance_status is distinct from old.acceptance_status then
      raise exception 'Trusted-contact acceptance is server controlled';
    end if;
  end if;

  return new;
end;
$;

create trigger trusted_contacts_protect_acceptance
before insert or update on public.trusted_contacts
for each row execute function public.protect_trusted_contact_acceptance();

create table public.emergency_incidents (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  country_code char(2) not null,
  emergency_type text not null
    check (emergency_type in (
      'PERSONAL_DANGER','MEDICAL','ACCIDENT','THREAT_ROBBERY',
      'UNSAFE_JOURNEY','LOST_STRANDED','OTHER'
    )),
  status text not null default 'CREATED'
    check (status in (
      'CREATED','PENDING_LOCATION','PENDING_DELIVERY','ACTIVE',
      'PARTIALLY_DELIVERED','DELIVERED','ACKNOWLEDGED',
      'CONNECTION_LOST','RESOLVED','CANCELLED','FAILED','EXPIRED'
    )),
  is_silent boolean not null default true,
  custom_message text check (custom_message is null or char_length(custom_message) <= 500),
  battery_level smallint check (battery_level is null or battery_level between 0 and 100),
  client_created_at timestamptz not null,
  server_received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  expires_at timestamptz
);

create index emergency_incidents_user_id_idx on public.emergency_incidents(user_id);
create index emergency_incidents_status_idx on public.emergency_incidents(status);

create trigger emergency_incidents_set_updated_at
before update on public.emergency_incidents
for each row execute function public.set_updated_at();

create or replace function public.protect_incident_delivery_status()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $
begin
  if auth.uid() is not null and new.status not in (
    'CREATED',
    'PENDING_LOCATION',
    'PENDING_DELIVERY',
    'CONNECTION_LOST',
    'RESOLVED',
    'CANCELLED'
  ) then
    raise exception 'Delivery-derived emergency status is server controlled';
  end if;

  return new;
end;
$;

create trigger emergency_incidents_protect_delivery_status
before insert or update on public.emergency_incidents
for each row execute function public.protect_incident_delivery_status();

create table public.emergency_locations (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.emergency_incidents(id) on delete cascade,
  sequence_number bigint not null check (sequence_number >= 0),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_meters real check (accuracy_meters is null or accuracy_meters >= 0),
  is_last_known boolean not null default false,
  captured_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (incident_id, sequence_number)
);

create index emergency_locations_incident_id_idx on public.emergency_locations(incident_id);

create table public.emergency_recipients (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.emergency_incidents(id) on delete cascade,
  contact_id uuid references public.trusted_contacts(id) on delete set null,
  contact_name text not null check (char_length(trim(contact_name)) between 1 and 120),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  delivery_channel text not null default 'SMS'
    check (delivery_channel in ('SMS','PUSH')),
  delivery_status text not null default 'QUEUED'
    check (delivery_status in (
      'QUEUED','SENDING','PUSH_SENT','SMS_SENT','DELIVERED',
      'ACKNOWLEDGED','RETRYING','FAILED','UNAVAILABLE'
    )),
  provider_name text,
  provider_message_id text,
  provider_error_code text,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (incident_id, phone_e164, delivery_channel)
);

create index emergency_recipients_incident_id_idx on public.emergency_recipients(incident_id);
create index emergency_recipients_provider_message_id_idx
  on public.emergency_recipients(provider_message_id)
  where provider_message_id is not null;

create trigger emergency_recipients_set_updated_at
before update on public.emergency_recipients
for each row execute function public.set_updated_at();

create table public.emergency_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.emergency_incidents(id) on delete cascade,
  recipient_id uuid not null references public.emergency_recipients(id) on delete cascade,
  message text not null default 'I am responding.'
    check (char_length(message) between 1 and 240),
  acknowledged_at timestamptz not null default now(),
  unique (incident_id, recipient_id)
);

create table public.emergency_access_tokens (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.emergency_incidents(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (char_length(token_hash) >= 43)
);

create index emergency_access_tokens_incident_id_idx
  on public.emergency_access_tokens(incident_id);

alter table public.profiles enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.emergency_incidents enable row level security;
alter table public.emergency_locations enable row level security;
alter table public.emergency_recipients enable row level security;
alter table public.emergency_acknowledgements enable row level security;
alter table public.emergency_access_tokens enable row level security;

create policy profiles_owner_all
on public.profiles for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy trusted_contacts_owner_all
on public.trusted_contacts for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy emergency_incidents_owner_all
on public.emergency_incidents for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy emergency_locations_owner_all
on public.emergency_locations for all
to authenticated
using (
  exists (
    select 1
    from public.emergency_incidents i
    where i.id = emergency_locations.incident_id
      and i.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.emergency_incidents i
    where i.id = emergency_locations.incident_id
      and i.user_id = auth.uid()
  )
);

create policy emergency_recipients_owner_all
on public.emergency_recipients for all
to authenticated
using (
  exists (
    select 1
    from public.emergency_incidents i
    where i.id = emergency_recipients.incident_id
      and i.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.emergency_incidents i
    where i.id = emergency_recipients.incident_id
      and i.user_id = auth.uid()
  )
);

create policy emergency_acknowledgements_owner_select
on public.emergency_acknowledgements for select
to authenticated
using (
  exists (
    select 1
    from public.emergency_incidents i
    where i.id = emergency_acknowledgements.incident_id
      and i.user_id = auth.uid()
  )
);

-- Emergency access tokens are server-only. The mobile client never receives
-- database access to token hashes and can never create or mutate bearer tokens.

revoke all on public.profiles from anon;
revoke all on public.trusted_contacts from anon;
revoke all on public.emergency_incidents from anon;
revoke all on public.emergency_locations from anon;
revoke all on public.emergency_recipients from anon;
revoke all on public.emergency_acknowledgements from anon;
revoke all on public.emergency_access_tokens from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.trusted_contacts to authenticated;
grant select, insert, update, delete on public.emergency_incidents to authenticated;
grant select, insert, update, delete on public.emergency_locations to authenticated;
grant select on public.emergency_recipients to authenticated;
grant select on public.emergency_acknowledgements to authenticated;

revoke insert, update, delete on public.emergency_recipients from authenticated;
revoke all on public.emergency_access_tokens from authenticated;

comment on table public.emergency_access_tokens is
  'Stores only hashes of bearer tokens. Raw emergency-view tokens must never be persisted.';
comment on table public.emergency_recipients is
  'Per-recipient delivery truth. SMS_SENT means accepted by the provider; DELIVERED requires provider delivery confirmation.';
