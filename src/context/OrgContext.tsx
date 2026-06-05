import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type OrgMembership = {
  org_id: string;
  role: "owner" | "admin" | "manager" | "agent";
  branch_id: string | null;
  organization: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    is_verified: boolean;
  };
};

type OrgContextValue = {
  memberships: OrgMembership[];
  currentOrg: OrgMembership | null;
  setCurrentOrgId: (id: string | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue>({
  memberships: [],
  currentOrg: null,
  setCurrentOrgId: () => {},
  loading: true,
  refresh: async () => {},
});

const STORAGE_KEY = "ekananda.current_org_id";

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(
    typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("org_members")
      .select("org_id, role, branch_id, organization:organizations(id, name, slug, logo_url, is_verified)")
      .eq("user_id", user.id)
      .eq("is_active", true);
    const rows = ((data || []) as OrgMembership[]).filter((m) => m.organization);
    setMemberships(rows);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const setCurrentOrgId = (id: string | null) => {
    setCurrentOrgIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const currentOrg =
    memberships.find((m) => m.org_id === currentOrgId) || memberships[0] || null;

  return (
    <OrgContext.Provider
      value={{ memberships, currentOrg, setCurrentOrgId, loading, refresh: load }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);