\set ON_ERROR_STOP on

-- Structural assertions.
do $$
declare
  missing_count integer;
begin
  select count(*) into missing_count
  from (values
    ('profiles'),
    ('trusted_contacts'),
    ('emergency_incidents'),
    ('emergency_locations'),
    ('emergency_recipients'),
    ('emergency_acknowledgements'),
    ('emergency_access_tokens')
  ) expected(table_name)
  where not exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = expected.table_name
  );

  if missing_count <> 0 then
    raise exception 'Required SafeSignal tables are missing';
  end if;
end
$$;

-- Every sensitive table must have RLS enabled.
do $$
declare
  insecure_count integer;
begin
  select count(*) into insecure_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'profiles','trusted_contacts','emergency_incidents',
      'emergency_locations','emergency_recipients',
      'emergency_acknowledgements','emergency_access_tokens'
    )
    and not c.relrowsecurity;

  if insecure_count <> 0 then
    raise exception 'One or more sensitive tables do not have RLS enabled';
  end if;
end
$$;

-- Raw emergency-view bearer tokens must never be a column.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'emergency_access_tokens'
      and column_name = 'token'
  ) then
    raise exception 'Raw access-token column must not exist';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'emergency_access_tokens'
      and column_name = 'token_hash'
  ) then
    raise exception 'Hashed access-token column is missing';
  end if;
end
$$;

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

insert into public.profiles(
  id, full_name, phone_e164, home_country_code, current_safety_region
) values (
  '00000000-0000-0000-0000-000000000001',
  'Owner One',
  '+46701234567',
  'SE',
  'SE'
);

insert into public.trusted_contacts(
  user_id, contact_name, phone_e164, relationship_tag, contact_group
) values (
  '00000000-0000-0000-0000-000000000001',
  'Trusted Person',
  '+2348031234567',
  'Family',
  'Family'
);

insert into public.emergency_incidents(
  id, user_id, country_code, emergency_type, status, client_created_at
) values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'SE',
  'PERSONAL_DANGER',
  'CREATED',
  now()
);

-- Cross-user writes must be blocked by RLS.
do $$
begin
  begin
    insert into public.profiles(id, full_name, phone_e164)
    values (
      '00000000-0000-0000-0000-000000000002',
      'Other User',
      '+46707654321'
    );
    raise exception 'RLS unexpectedly allowed a cross-user profile insert';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;

-- Owner can see exactly one profile and one incident.
do $$
declare
  profile_count integer;
  incident_count integer;
begin
  select count(*) into profile_count from public.profiles;
  select count(*) into incident_count from public.emergency_incidents;

  if profile_count <> 1 then
    raise exception 'Profile RLS isolation failed';
  end if;

  if incident_count <> 1 then
    raise exception 'Incident RLS isolation failed';
  end if;
end
$$;

reset role;
