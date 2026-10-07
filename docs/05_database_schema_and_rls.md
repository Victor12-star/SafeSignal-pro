# SafeSignal — Database Schema & Row Level Security (RLS)

## 1. Relational Schema Architecture (PostgreSQL / Supabase)

SafeSignal uses a unified multi-tenant relational schema optimized for high concurrency, zero-leak multi-tenancy, and idempotent emergency synchronization.

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_e164 TEXT NOT NULL UNIQUE,
    home_country_code VARCHAR(2) NOT NULL DEFAULT 'SE', -- 'SE', 'NG', etc.
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'en', -- 'en', 'sv', etc.
    current_safety_region VARCHAR(2) NOT NULL DEFAULT 'SE',
    low_data_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trusted Contacts Table
CREATE TABLE public.trusted_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    phone_e164 TEXT NOT NULL,
    relationship_tag TEXT NOT NULL DEFAULT 'Family', -- 'Family', 'Partner', 'Friend', 'Neighbour', 'Medical'
    contact_group TEXT NOT NULL DEFAULT 'Primary',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contacts_user_id ON public.trusted_contacts(user_id);

-- 3. Emergency Incidents Table
CREATE TABLE public.emergency_incidents (
    id UUID PRIMARY KEY, -- Client-generated UUID for offline idempotency
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL, -- 'SE' or 'NG'
    emergency_type TEXT NOT NULL, -- 'Personal Danger', 'Medical', 'Accident', 'Unsafe Journey', 'Threat'
    is_silent BOOLEAN NOT NULL DEFAULT false,
    custom_message TEXT,
    battery_level INTEGER, -- 0 to 100
    status TEXT NOT NULL DEFAULT 'CREATED', -- CREATED, ACTIVE, PARTIALLY_DELIVERED, DELIVERED, ACKNOWLEDGED, RESOLVED, CANCELLED
    created_at TIMESTAMPTZ NOT NULL, -- Client timestamp
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_incidents_user_id ON public.emergency_incidents(user_id);
CREATE INDEX idx_incidents_status ON public.emergency_incidents(status);

-- 4. Emergency Locations (Live Trail & Breadcrumbs)
CREATE TABLE public.emergency_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy_meters REAL,
    is_last_known BOOLEAN NOT NULL DEFAULT false,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_incident_sequence UNIQUE (incident_id, sequence_number)
);
CREATE INDEX idx_locations_incident_id ON public.emergency_locations(incident_id);

-- 5. Emergency Recipients & Delivery Status
CREATE TABLE public.emergency_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.trusted_contacts(id) ON DELETE SET NULL,
    contact_name TEXT NOT NULL,
    phone_e164 TEXT NOT NULL,
    delivery_channel TEXT NOT NULL, -- 'PUSH', 'WEB_LINK', 'SMS'
    delivery_status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, SENT, DELIVERED, FAILED
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Emergency Acknowledgements
CREATE TABLE public.emergency_acknowledgements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
    recipient_identifier TEXT NOT NULL, -- Name or Phone
    message TEXT NOT NULL DEFAULT 'I am responding.',
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Public Web Access Tokens
CREATE TABLE public.emergency_access_tokens (
    token TEXT PRIMARY KEY, -- 32-character random token
    incident_id UUID NOT NULL REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. Row Level Security (RLS) Policies

All tables have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` enabled.

```sql
-- Profiles: Users can only read & write their own profile
CREATE POLICY "Users can manage own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id);

-- Trusted Contacts: Users can only manage their own contacts
CREATE POLICY "Users can manage own contacts"
ON public.trusted_contacts FOR ALL
USING (auth.uid() = user_id);

-- Incidents: Owners can manage their incidents
CREATE POLICY "Owners can manage incidents"
ON public.emergency_incidents FOR ALL
USING (auth.uid() = user_id);

-- Locations: Owners can insert and view their incident locations
CREATE POLICY "Owners can manage incident locations"
ON public.emergency_locations FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.emergency_incidents i
    WHERE i.id = incident_id AND i.user_id = auth.uid()
));

-- Public Web Tokens: Public read-only access strictly if valid token exists and not expired
CREATE POLICY "Public token access for emergency view"
ON public.emergency_incidents FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.emergency_access_tokens t
    WHERE t.incident_id = id 
      AND t.is_revoked = false 
      AND t.expires_at > NOW()
));
```
