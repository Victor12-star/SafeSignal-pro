\set ON_ERROR_STOP on

-- Seed two eligible contacts and one opted-out contact as the database owner.
insert into public.trusted_contacts(
  user_id, contact_name, phone_e164, relationship_tag, contact_group, acceptance_status
) values
  (
    '00000000-0000-0000-0000-000000000001',
    'Accepted Contact',
    '+46701111111',
    'Family',
    'Family',
    'ACCEPTED'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Pending Contact',
    '+46702222222',
    'Friend',
    'Friends',
    'PENDING'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Blocked Contact',
    '+46703333333',
    'Other',
    'Custom',
    'BLOCKED'
  );

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  false
);

do $func$
declare
  queued_count integer;
  sms_count integer;
  blocked_count integer;
begin
  select public.queue_emergency_sms(
    '10000000-0000-0000-0000-000000000001'
  ) into queued_count;

  if queued_count <> 3 then
    raise exception 'Expected three eligible SMS rows including the existing pending trusted contact, got %', queued_count;
  end if;

  select count(*) into sms_count
  from public.emergency_recipients
  where incident_id = '10000000-0000-0000-0000-000000000001'
    and delivery_channel = 'SMS'
    and delivery_status = 'QUEUED';

  if sms_count <> 3 then
    raise exception 'Expected three queued SMS recipients, got %', sms_count;
  end if;

  select count(*) into blocked_count
  from public.emergency_recipients
  where phone_e164 = '+46703333333';

  if blocked_count <> 0 then
    raise exception 'Blocked contact was unexpectedly queued for SMS';
  end if;
end
$func$;

-- Queueing the same incident again must be idempotent.
do $func$
declare
  queued_again integer;
begin
  select public.queue_emergency_sms(
    '10000000-0000-0000-0000-000000000001'
  ) into queued_again;

  if queued_again <> 0 then
    raise exception 'Duplicate SMS queue rows were created';
  end if;
end
$func$;

-- Owner can read the queue snapshot but cannot directly change provider truth.
do $func$
begin
  begin
    update public.emergency_recipients
    set delivery_status = 'DELIVERED'
    where incident_id = '10000000-0000-0000-0000-000000000001';

    raise exception 'Client unexpectedly mutated SMS delivery truth';
  exception
    when insufficient_privilege then
      null;
  end;
end
$func$;

-- A different authenticated user must not be able to queue the owner's incident.
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  false
);

do $func$
begin
  begin
    perform public.queue_emergency_sms(
      '10000000-0000-0000-0000-000000000001'
    );
    raise exception 'Cross-user SMS queueing unexpectedly succeeded';
  exception
    when insufficient_privilege then
      null;
  end;
end
$func$;

reset role;
