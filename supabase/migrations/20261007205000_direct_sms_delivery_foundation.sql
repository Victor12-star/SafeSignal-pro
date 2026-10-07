-- SafeSignal direct SMS delivery foundation
-- SMS is queued server-side to the trusted contact's saved E.164 phone number.
-- Provider credentials never belong in the mobile client.

alter table public.emergency_recipients
  add column if not exists attempt_count smallint not null default 0
    check (attempt_count between 0 and 20),
  add column if not exists last_attempt_at timestamptz,
  add column if not exists next_attempt_at timestamptz;

create index if not exists emergency_recipients_sms_queue_idx
  on public.emergency_recipients(next_attempt_at, queued_at)
  where delivery_channel = 'SMS'
    and delivery_status in ('QUEUED', 'RETRYING');

create or replace function public.queue_emergency_sms(
  p_incident_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $func$
declare
  v_owner_id uuid;
  v_inserted integer := 0;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  select i.user_id
  into v_owner_id
  from public.emergency_incidents i
  where i.id = p_incident_id;

  if v_owner_id is null or v_owner_id <> auth.uid() then
    raise insufficient_privilege using message = 'Incident access denied';
  end if;

  insert into public.emergency_recipients(
    incident_id,
    contact_id,
    contact_name,
    phone_e164,
    delivery_channel,
    delivery_status,
    queued_at,
    next_attempt_at
  )
  select
    p_incident_id,
    c.id,
    c.contact_name,
    c.phone_e164,
    'SMS',
    'QUEUED',
    now(),
    now()
  from public.trusted_contacts c
  where c.user_id = v_owner_id
    and c.is_active = true
    and c.acceptance_status not in ('DECLINED', 'BLOCKED')
  on conflict (incident_id, phone_e164, delivery_channel)
  do nothing;

  get diagnostics v_inserted = row_count;

  update public.emergency_incidents
  set status = 'PENDING_DELIVERY'
  where id = p_incident_id
    and status in (
      'CREATED',
      'PENDING_LOCATION',
      'PENDING_DELIVERY',
      'CONNECTION_LOST'
    );

  return v_inserted;
end;
$func$;

revoke all on function public.queue_emergency_sms(uuid) from public, anon;
grant execute on function public.queue_emergency_sms(uuid) to authenticated;

comment on function public.queue_emergency_sms(uuid) is
  'Queues one direct SMS delivery row per eligible trusted-contact phone number. Idempotent per incident, phone number and SMS channel.';
