
-- Org role enum
DO $$ BEGIN
  CREATE TYPE public.org_member_role AS ENUM ('owner','admin','manager','agent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  website text,
  contact_email text,
  contact_phone text,
  city text DEFAULT 'Lucknow',
  address text,
  rera_id text,
  gst_number text,
  description text,
  owner_id uuid NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. org_branches
CREATE TABLE IF NOT EXISTS public.org_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text DEFAULT 'Lucknow',
  locality text,
  address text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_branches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_branches TO authenticated;
GRANT ALL ON public.org_branches TO service_role;
ALTER TABLE public.org_branches ENABLE ROW LEVEL SECURITY;

-- 3. org_members
CREATE TABLE IF NOT EXISTS public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.org_member_role NOT NULL DEFAULT 'agent',
  branch_id uuid REFERENCES public.org_branches(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_members TO authenticated;
GRANT ALL ON public.org_members TO service_role;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- 4. org_invites
CREATE TABLE IF NOT EXISTS public.org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_member_role NOT NULL DEFAULT 'agent',
  branch_id uuid REFERENCES public.org_branches(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked | expired
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_invites TO authenticated;
GRANT ALL ON public.org_invites TO service_role;
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- 5. Extend domain tables (additive, nullable)
ALTER TABLE public.property_listings ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.property_listings ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.org_branches(id) ON DELETE SET NULL;
ALTER TABLE public.leads             ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.leads             ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.org_branches(id) ON DELETE SET NULL;
ALTER TABLE public.agent_clients     ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.agent_clients     ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.org_branches(id) ON DELETE SET NULL;
ALTER TABLE public.sponsorships      ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.admin_activity_log ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pl_org ON public.property_listings(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(org_id);
CREATE INDEX IF NOT EXISTS idx_ac_org ON public.agent_clients(org_id);
CREATE INDEX IF NOT EXISTS idx_om_user ON public.org_members(user_id);

-- 6. Helper functions (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = _org_id AND user_id = _user_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.org_role_of(_org_id uuid, _user_id uuid)
RETURNS public.org_member_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.org_members
  WHERE org_id = _org_id AND user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org_id uuid, _user_id uuid, _roles public.org_member_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = _org_id AND user_id = _user_id AND is_active = true AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.org_members
  WHERE user_id = auth.uid() AND is_active = true;
$$;

-- 7. RLS for orgs/branches/members/invites
-- organizations
CREATE POLICY "Members can view their organization"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Public can view active organizations"
  ON public.organizations FOR SELECT TO anon
  USING (is_active = true);
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Org owners/admins can update org"
  ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_org_role(id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[]) OR public.is_admin(auth.uid()));
CREATE POLICY "Org owner can delete org"
  ON public.organizations FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- org_branches
CREATE POLICY "Members can view branches"
  ON public.org_branches FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Public can view branches of active orgs"
  ON public.org_branches FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id AND o.is_active = true));
CREATE POLICY "Org admins manage branches"
  ON public.org_branches FOR ALL TO authenticated
  USING (public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[]) OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[]) OR public.is_admin(auth.uid()));

-- org_members
CREATE POLICY "Members view their org members"
  ON public.org_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_member(org_id, auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Org admins add members"
  ON public.org_members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[])
    OR public.is_admin(auth.uid())
    OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id AND o.owner_id = auth.uid()))
  );
CREATE POLICY "Org admins update members"
  ON public.org_members FOR UPDATE TO authenticated
  USING (public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[]) OR public.is_admin(auth.uid()));
CREATE POLICY "Org admins or self remove member"
  ON public.org_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[])
    OR public.is_admin(auth.uid())
  );

-- org_invites
CREATE POLICY "Org admins view invites"
  ON public.org_invites FOR SELECT TO authenticated
  USING (public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[]) OR public.is_admin(auth.uid()));
CREATE POLICY "Invitees can view their pending invite by email"
  ON public.org_invites FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));
CREATE POLICY "Org admins create invites"
  ON public.org_invites FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[])
    AND invited_by = auth.uid()
  );
CREATE POLICY "Org admins update/revoke invites"
  ON public.org_invites FOR UPDATE TO authenticated
  USING (
    public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[])
    OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "Org admins delete invites"
  ON public.org_invites FOR DELETE TO authenticated
  USING (public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[]) OR public.is_admin(auth.uid()));

-- 8. Trigger: when an organization is created, auto-add owner as 'owner' member.
CREATE OR REPLACE FUNCTION public.bootstrap_org_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.org_members (org_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner'::public.org_member_role, NEW.owner_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bootstrap_org_owner ON public.organizations;
CREATE TRIGGER trg_bootstrap_org_owner
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_org_owner();

-- 9. Org-aware additive policies on existing domain tables (do NOT drop existing ones)
-- property_listings
CREATE POLICY "Org members view org listings"
  ON public.property_listings FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_member(org_id, auth.uid()));
CREATE POLICY "Org managers update org listings"
  ON public.property_listings FOR UPDATE TO authenticated
  USING (org_id IS NOT NULL AND public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin','manager']::public.org_member_role[]));
CREATE POLICY "Org admins delete org listings"
  ON public.property_listings FOR DELETE TO authenticated
  USING (org_id IS NOT NULL AND public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin']::public.org_member_role[]));

-- leads
CREATE POLICY "Org members view org leads"
  ON public.leads FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_member(org_id, auth.uid()));
CREATE POLICY "Org managers update org leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (org_id IS NOT NULL AND public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin','manager']::public.org_member_role[]));

-- agent_clients
CREATE POLICY "Org members view org clients"
  ON public.agent_clients FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_member(org_id, auth.uid()));
CREATE POLICY "Org managers manage org clients"
  ON public.agent_clients FOR ALL TO authenticated
  USING (org_id IS NOT NULL AND public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin','manager']::public.org_member_role[]))
  WITH CHECK (org_id IS NOT NULL AND public.has_org_role(org_id, auth.uid(), ARRAY['owner','admin','manager']::public.org_member_role[]));

-- sponsorships
CREATE POLICY "Org members view org sponsorships"
  ON public.sponsorships FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_member(org_id, auth.uid()));

-- 10. RPC: accept invite atomically
CREATE OR REPLACE FUNCTION public.accept_org_invite(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.org_invites%ROWTYPE;
  user_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be signed in to accept invite';
  END IF;

  SELECT * INTO inv FROM public.org_invites WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF inv.status <> 'pending' THEN RAISE EXCEPTION 'Invite is no longer pending'; END IF;
  IF inv.expires_at < now() THEN RAISE EXCEPTION 'Invite has expired'; END IF;
  IF lower(inv.email) <> user_email THEN RAISE EXCEPTION 'Invite is for a different email address'; END IF;

  INSERT INTO public.org_members (org_id, user_id, role, branch_id, invited_by)
  VALUES (inv.org_id, auth.uid(), inv.role, inv.branch_id, inv.invited_by)
  ON CONFLICT (org_id, user_id) DO UPDATE SET is_active = true, role = EXCLUDED.role, branch_id = EXCLUDED.branch_id;

  UPDATE public.org_invites
  SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
  WHERE id = inv.id;

  RETURN jsonb_build_object('success', true, 'org_id', inv.org_id);
END $$;

GRANT EXECUTE ON FUNCTION public.accept_org_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_role_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, uuid, public.org_member_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_org_ids() TO authenticated;

-- updated_at triggers
CREATE TRIGGER trg_orgs_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON public.org_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
