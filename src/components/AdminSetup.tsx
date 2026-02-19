import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Copy, Check } from "lucide-react";

/**
 * Admin Setup Utility - Only visible to authenticated users
 * Allows the first user to promote themselves to admin
 * This is a one-time setup component shown on the auth page after login
 */
const AdminSetup = () => {
  const { user, role } = useAuth();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || role === "admin") return null;

  const promoteToAdmin = async () => {
    setLoading(true);
    // Remove existing role and insert admin role
    await supabase.from("user_roles").delete().eq("user_id", user.id);
    const { error } = await supabase.from("user_roles").insert({
      user_id: user.id,
      role: "admin",
    });
    if (!error) {
      setDone(true);
      // Reload to pick up new role
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="mt-4 p-4 bg-card border border-border rounded-2xl">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">First Time Setup</p>
          <p className="text-xs text-muted-foreground mt-0.5">Make yourself an admin to access the admin dashboard.</p>
          <button
            onClick={promoteToAdmin}
            disabled={loading || done}
            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {done ? "✓ Promoted! Reloading..." : loading ? "Promoting..." : "Make Me Admin"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
