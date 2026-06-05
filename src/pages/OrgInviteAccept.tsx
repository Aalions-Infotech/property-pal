import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/context/OrgContext";
import Navbar from "@/components/Navbar";
import { Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrgInviteAccept() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const { refresh, setCurrentOrgId } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invite, setInvite] = useState<any>(null);
  const [orgName, setOrgName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    if (authLoading) return;
    if (!user) {
      navigate(`/auth?redirect=/org/invite/${token}`, { replace: true });
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error: err } = await (supabase as any)
        .from("org_invites")
        .select("id, email, role, status, expires_at, org_id")
        .eq("token", token)
        .maybeSingle();
      if (err || !data) {
        setError("This invite link is invalid.");
      } else if (data.status !== "pending") {
        setError(`This invite is ${data.status}.`);
      } else if (new Date(data.expires_at) < new Date()) {
        setError("This invite has expired.");
      } else {
        setInvite(data);
        const { data: org } = await (supabase as any).from("organizations").select("name").eq("id", data.org_id).maybeSingle();
        setOrgName(org?.name || "the agency");
      }
      setLoading(false);
    })();
  }, [token, user, authLoading, navigate]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    const { data, error: err } = await (supabase as any).rpc("accept_org_invite", { _token: token });
    setAccepting(false);
    if (err) {
      toast({ title: "Could not accept", description: err.message, variant: "destructive" });
      return;
    }
    await refresh();
    if (data?.org_id) setCurrentOrgId(data.org_id);
    toast({ title: "Welcome aboard", description: `You've joined ${orgName}.` });
    navigate("/org/members");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-md mx-auto pt-32 px-6 text-center">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-accent" />
          </div>
          {loading ? (
            <p className="text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking invite…</p>
          ) : error ? (
            <>
              <h1 className="text-xl font-semibold mb-2">Invite unavailable</h1>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <button onClick={() => navigate("/")} className="px-4 py-2 btn-navy rounded-xl text-sm">Go home</button>
            </>
          ) : invite ? (
            <>
              <h1 className="text-xl font-semibold mb-2">Join {orgName}</h1>
              <p className="text-sm text-muted-foreground mb-1">
                You've been invited as <span className="font-medium capitalize text-foreground">{invite.role}</span>.
              </p>
              <p className="text-xs text-muted-foreground mb-6">For {invite.email}</p>
              <button onClick={accept} disabled={accepting} className="w-full py-3 btn-gold rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {accepting && <Loader2 className="w-4 h-4 animate-spin" />} Accept & join
              </button>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}