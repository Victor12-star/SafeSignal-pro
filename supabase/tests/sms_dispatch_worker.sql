\set ON_ERROR_STOP on

-- App users must not be able to call server-only worker functions.
do $$
declare
  can_claim boolean;
  can_complete boolean;
  can_fail boolean;
  can_callback boolean;
begin
  select has_function_privilege(
    'authenticated',
    'public.claim_emergency_sms_batch(integer)',
    'EXECUTE'
  ) into can_claim;

  select has_function_privilege(
    'authenticated',
    'public.complete_emergency_sms_attempt(uuid,uuid,text)',
    'EXECUTE'
  ) into can_complete;

  select has_function_privilege(
    'authenticated',
    'public.fail_emergency_sms_attempt(uuid,uuid,text,integer)',
    'EXECUTE'
  ) into can_fail;

  select has_function_privilege(
    'authenticated',
    'public.apply_twilio_status_callback(text,text,text)',
    'EXECUTE'
  ) into can_callback;

  if can_claim or can_complete or can_fail or can_callback then
    raise exception 'Authenticated client can execute server-only SMS worker functions';
  end if;
end
$$;

create temporary table claimed_sms as
select * from public.claim_emergency_sms_batch(10);

do $$
declare
  claimed_count integer;
  sending_count integer;
begin
  select count(*) into claimed_count from claimed_sms;

  if claimed_count <> 3 then
    raise exception 'Expected three claimed SMS rows, got %', claimed_count;
  end if;

  select count(*) into sending_count
  from public.emergency_recipients r
  join claimed_sms c on c.recipient_id = r.id
  where r.delivery_status = 'SENDING'
    and r.attempt_count = 1
    and r.lease_token is not null
    and r.lease_expires_at > now();

  if sending_count <> 3 then
    raise exception 'SMS claim did not create valid sending leases';
  end if;
end
$$;

-- An active lease prevents a second worker from claiming the same rows.
do $$
declare
  duplicate_claims integer;
begin
  select count(*) into duplicate_claims
  from public.claim_emergency_sms_batch(10);

  if duplicate_claims <> 0 then
    raise exception 'Second worker reclaimed active SMS leases';
  end if;
end
$$;

-- Provider acceptance is SMS_SENT, not DELIVERED.
do $$
declare
  v_id uuid;
  v_lease uuid;
  completed boolean;
  current_status text;
begin
  select recipient_id, lease_token
  into v_id, v_lease
  from claimed_sms
  order by phone_e164
  limit 1;

  select public.complete_emergency_sms_attempt(
    v_id,
    v_lease,
    'SM_TEST_001'
  ) into completed;

  if not completed then
    raise exception 'Valid SMS completion was rejected';
  end if;

  select delivery_status into current_status
  from public.emergency_recipients
  where id = v_id;

  if current_status <> 'SMS_SENT' then
    raise exception 'Provider acceptance was incorrectly recorded as %', current_status;
  end if;
end
$$;

-- A bad lease cannot mutate provider truth.
do $$
declare
  v_id uuid;
  changed boolean;
begin
  select recipient_id
  into v_id
  from claimed_sms
  order by phone_e164 desc
  limit 1;

  select public.complete_emergency_sms_attempt(
    v_id,
    gen_random_uuid(),
    'SM_BAD_LEASE'
  ) into changed;

  if changed then
    raise exception 'Invalid lease unexpectedly completed an SMS attempt';
  end if;
end
$$;

-- A provider failure becomes RETRYING with bounded retry metadata.
do $$
declare
  v_id uuid;
  v_lease uuid;
  failed boolean;
  current_status text;
  next_attempt timestamptz;
begin
  select recipient_id, lease_token
  into v_id, v_lease
  from claimed_sms
  order by phone_e164 desc
  limit 1;

  select public.fail_emergency_sms_attempt(
    v_id,
    v_lease,
    'provider_503',
    60
  ) into failed;

  if not failed then
    raise exception 'Valid provider failure was not recorded';
  end if;

  select delivery_status, next_attempt_at
  into current_status, next_attempt
  from public.emergency_recipients
  where id = v_id;

  if current_status <> 'RETRYING' or next_attempt <= now() then
    raise exception 'SMS retry metadata was not scheduled correctly';
  end if;
end
$$;

-- Only an authenticated provider callback may later promote SMS_SENT to DELIVERED.
do $$
declare
  applied boolean;
  recipient_status text;
  incident_status text;
begin
  select public.apply_twilio_status_callback(
    'SM_TEST_001',
    'delivered',
    null
  ) into applied;

  if not applied then
    raise exception 'Twilio delivery callback was not applied';
  end if;

  select delivery_status into recipient_status
  from public.emergency_recipients
  where provider_message_id = 'SM_TEST_001';

  if recipient_status <> 'DELIVERED' then
    raise exception 'Twilio delivered callback did not set DELIVERED';
  end if;

  select status into incident_status
  from public.emergency_incidents
  where id = '10000000-0000-0000-0000-000000000001';

  if incident_status <> 'PARTIALLY_DELIVERED' then
    raise exception 'Incident aggregate status expected PARTIALLY_DELIVERED, got %', incident_status;
  end if;
end
$$;
