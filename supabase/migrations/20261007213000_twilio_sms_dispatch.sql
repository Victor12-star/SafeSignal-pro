-- SafeSignal SMS dispatch worker foundation
-- Server-controlled delivery updates need a narrowly scoped bypass for the
-- existing client-protection trigger. The bypass is set only inside
-- security-definer functions that are not executable by app users.
create or replace function public.protect_incident_delivery_status()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $func$
begin
  if coalesce(current_setting('safesignal.server_controlled', true), '') <> '1'
     and auth.uid() is not null
     and new.status not in (
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
$func$;

-- Claims queued SMS rows atomically, records provider acceptance separately from delivery,
-- and keeps all provider-derived truth server-controlled.

alter table public.emergency_recipients
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz;

create index if not exists emergency_recipients_sms_lease_idx
  on public.emergency_recipients(lease_expires_at)
  where delivery_channel = 'SMS'
    and delivery_status in ('SENDING', 'RETRYING', 'QUEUED');

create or replace function public.claim_emergency_sms_batch(
  p_limit integer default 10
)
returns table(
  recipient_id uuid,
  incident_id uuid,
  phone_e164 text,
  contact_name text,
  sender_name text,
  emergency_type text,
  country_code text,
  lease_token uuid,
  attempt_count smallint
)
language plpgsql
security definer
set search_path = public
as $func$
begin
  return query
  with candidates as (
    select r.id
    from public.emergency_recipients r
    where r.delivery_channel = 'SMS'
      and r.delivery_status in ('QUEUED', 'RETRYING')
      and coalesce(r.next_attempt_at, now()) <= now()
      and (r.lease_expires_at is null or r.lease_expires_at <= now())
    order by r.queued_at
    for update skip locked
    limit least(greatest(coalesce(p_limit, 10), 1), 50)
  ),
  claimed as (
    update public.emergency_recipients r
    set
      delivery_status = 'SENDING',
      attempt_count = r.attempt_count + 1,
      last_attempt_at = now(),
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + interval '2 minutes',
      provider_name = 'twilio'
    from candidates c
    where r.id = c.id
    returning r.*
  )
  select
    c.id,
    c.incident_id,
    c.phone_e164,
    c.contact_name,
    p.full_name,
    i.emergency_type,
    i.country_code::text,
    c.lease_token,
    c.attempt_count
  from claimed c
  join public.emergency_incidents i on i.id = c.incident_id
  join public.profiles p on p.id = i.user_id;
end;
$func$;

create or replace function public.complete_emergency_sms_attempt(
  p_recipient_id uuid,
  p_lease_token uuid,
  p_provider_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $func$
declare
  changed integer;
begin
  if p_provider_message_id is null or char_length(trim(p_provider_message_id)) = 0 then
    raise exception 'Provider message id is required';
  end if;

  update public.emergency_recipients
  set
    delivery_status = 'SMS_SENT',
    provider_message_id = left(p_provider_message_id, 128),
    provider_error_code = null,
    sent_at = coalesce(sent_at, now()),
    next_attempt_at = null,
    lease_token = null,
    lease_expires_at = null
  where id = p_recipient_id
    and lease_token = p_lease_token
    and delivery_status = 'SENDING';

  get diagnostics changed = row_count;
  return changed = 1;
end;
$func$;

create or replace function public.fail_emergency_sms_attempt(
  p_recipient_id uuid,
  p_lease_token uuid,
  p_error_code text,
  p_retry_after_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $func$
declare
  changed integer;
begin
  update public.emergency_recipients
  set
    delivery_status = case when attempt_count >= 5 then 'FAILED' else 'RETRYING' end,
    provider_error_code = left(coalesce(p_error_code, 'provider_error'), 128),
    next_attempt_at = case
      when attempt_count >= 5 then null
      else now() + make_interval(
        secs => least(greatest(coalesce(p_retry_after_seconds, 60), 30), 900)
      )
    end,
    lease_token = null,
    lease_expires_at = null
  where id = p_recipient_id
    and lease_token = p_lease_token
    and delivery_status = 'SENDING';

  get diagnostics changed = row_count;
  return changed = 1;
end;
$func$;

create or replace function public.refresh_incident_delivery_status(
  p_incident_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $func$
declare
  total_count integer;
  acknowledged_count integer;
  delivered_count integer;
  sent_count integer;
  failed_count integer;
begin
  perform set_config('safesignal.server_controlled', '1', true);

  select
    count(*),
    count(*) filter (where delivery_status = 'ACKNOWLEDGED'),
    count(*) filter (where delivery_status in ('DELIVERED', 'ACKNOWLEDGED')),
    count(*) filter (where delivery_status in ('SMS_SENT', 'PUSH_SENT', 'DELIVERED', 'ACKNOWLEDGED')),
    count(*) filter (where delivery_status in ('FAILED', 'UNAVAILABLE'))
  into total_count, acknowledged_count, delivered_count, sent_count, failed_count
  from public.emergency_recipients
  where incident_id = p_incident_id;

  if total_count = 0 then
    return;
  end if;

  update public.emergency_incidents
  set status = case
    when acknowledged_count = total_count then 'ACKNOWLEDGED'
    when delivered_count = total_count then 'DELIVERED'
    when delivered_count > 0 then 'PARTIALLY_DELIVERED'
    when failed_count = total_count then 'FAILED'
    when sent_count > 0 then 'ACTIVE'
    else status
  end
  where id = p_incident_id
    and status not in ('RESOLVED', 'CANCELLED', 'EXPIRED');
end;
$func$;

create or replace function public.apply_twilio_status_callback(
  p_message_sid text,
  p_message_status text,
  p_error_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_recipient_id uuid;
  v_incident_id uuid;
  changed integer;
  normalized_status text := lower(coalesce(p_message_status, ''));
begin
  select id, incident_id
  into v_recipient_id, v_incident_id
  from public.emergency_recipients
  where provider_name = 'twilio'
    and provider_message_id = p_message_sid
  limit 1;

  if v_recipient_id is null then
    return false;
  end if;

  if normalized_status = 'delivered' then
    update public.emergency_recipients
    set
      delivery_status = 'DELIVERED',
      delivered_at = coalesce(delivered_at, now()),
      provider_error_code = null
    where id = v_recipient_id
      and delivery_status <> 'ACKNOWLEDGED';

  elsif normalized_status = 'sent' then
    update public.emergency_recipients
    set
      delivery_status = case
        when delivery_status in ('DELIVERED', 'ACKNOWLEDGED') then delivery_status
        else 'SMS_SENT'
      end,
      sent_at = coalesce(sent_at, now()),
      provider_error_code = null
    where id = v_recipient_id;

  elsif normalized_status in ('failed', 'undelivered', 'canceled') then
    update public.emergency_recipients
    set
      delivery_status = case
        when delivery_status in ('DELIVERED', 'ACKNOWLEDGED') then delivery_status
        else 'FAILED'
      end,
      provider_error_code = left(coalesce(p_error_code, normalized_status), 128)
    where id = v_recipient_id;

  else
    return true;
  end if;

  get diagnostics changed = row_count;

  if changed = 1 then
    perform public.refresh_incident_delivery_status(v_incident_id);
  end if;

  return changed = 1;
end;
$func$;

revoke all on function public.claim_emergency_sms_batch(integer) from public, anon, authenticated;
revoke all on function public.complete_emergency_sms_attempt(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.fail_emergency_sms_attempt(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.refresh_incident_delivery_status(uuid) from public, anon, authenticated;
revoke all on function public.apply_twilio_status_callback(text, text, text) from public, anon, authenticated;

do $grant$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.claim_emergency_sms_batch(integer) to service_role;
    grant execute on function public.complete_emergency_sms_attempt(uuid, uuid, text) to service_role;
    grant execute on function public.fail_emergency_sms_attempt(uuid, uuid, text, integer) to service_role;
    grant execute on function public.refresh_incident_delivery_status(uuid) to service_role;
    grant execute on function public.apply_twilio_status_callback(text, text, text) to service_role;
  end if;
end
$grant$;

comment on function public.claim_emergency_sms_batch(integer) is
  'Server-only atomic lease of queued/retrying SMS recipients for provider dispatch.';
comment on function public.apply_twilio_status_callback(text, text, text) is
  'Server-only application of authenticated Twilio delivery callbacks.';
