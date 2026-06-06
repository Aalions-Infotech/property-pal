
-- Pipeline columns on leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS deal_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_close_date date,
  ADD COLUMN IF NOT EXISTS stage_updated_at timestamptz DEFAULT now();

-- Backfill stage from status
UPDATE public.leads SET stage = CASE
  WHEN status = 'converted' THEN 'won'
  WHEN status = 'closed' THEN 'lost'
  WHEN status = 'contacted' THEN 'contacted'
  ELSE 'new'
END WHERE stage = 'new';

-- Lead tasks (follow-ups)
CREATE TABLE IF NOT EXISTS public.lead_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  org_id uuid,
  title text NOT NULL,
  notes text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_tasks TO authenticated;
GRANT ALL ON public.lead_tasks TO service_role;
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage own tasks" ON public.lead_tasks
  FOR ALL TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Org members view org tasks" ON public.lead_tasks
  FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_member(org_id, auth.uid()));
CREATE POLICY "Org managers manage org tasks" ON public.lead_tasks
  FOR ALL TO authenticated
  USING (org_id IS NOT NULL AND public.has_org_role(org_id, auth.uid(), ARRAY['owner'::org_member_role,'admin'::org_member_role,'manager'::org_member_role]))
  WITH CHECK (org_id IS NOT NULL AND public.has_org_role(org_id, auth.uid(), ARRAY['owner'::org_member_role,'admin'::org_member_role,'manager'::org_member_role]));
CREATE POLICY "Admins view tasks" ON public.lead_tasks FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_lead_tasks_updated BEFORE UPDATE ON public.lead_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Buyer shortlists (folders)
CREATE TABLE IF NOT EXISTS public.buyer_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_shortlists TO authenticated;
GRANT ALL ON public.buyer_shortlists TO service_role;
ALTER TABLE public.buyer_shortlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shortlists" ON public.buyer_shortlists
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_buyer_shortlists_updated BEFORE UPDATE ON public.buyer_shortlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.buyer_shortlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id uuid NOT NULL REFERENCES public.buyer_shortlists(id) ON DELETE CASCADE,
  property_id uuid NOT NULL,
  notes text,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shortlist_id, property_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_shortlist_items TO authenticated;
GRANT ALL ON public.buyer_shortlist_items TO service_role;
ALTER TABLE public.buyer_shortlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shortlist items" ON public.buyer_shortlist_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.buyer_shortlists s WHERE s.id = shortlist_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.buyer_shortlists s WHERE s.id = shortlist_id AND s.user_id = auth.uid()));
