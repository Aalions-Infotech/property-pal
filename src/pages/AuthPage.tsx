import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminSetup from "@/components/AdminSetup";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  // Redirect authenticated users based on role
  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === "admin" || role === "moderator") {
        navigate("/admin", { replace: true });
      } else if (role === "agent") {
        navigate("/agent-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You have been logged in." });
      } else if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.fullName }, emailRedirectTo: window.location.origin },
        });
        if (signupError) throw signupError;
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        toast({ title: "Email sent!", description: "Check your inbox for the password reset link." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-navy p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
            <Building2 className="w-6 h-6 text-navy" />
          </div>
          <span className="text-2xl font-display font-bold text-white">PropEstate</span>
        </Link>
        <div className="relative z-10">
          <h1 className="text-4xl font-display font-bold text-white mb-4 leading-tight">
            India's Most Trusted<br /><span className="text-gold">Real Estate Platform</span>
          </h1>
          <p className="text-white/60 text-lg mb-8">List properties, track approvals, and manage sponsorships — all in one place.</p>
          <div className="grid grid-cols-2 gap-4">
            {[["5L+", "Properties Listed"], ["18K+", "Verified Agents"], ["50+", "Cities"], ["4.8★", "Average Rating"]].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold text-gold">{v}</p>
                <p className="text-sm text-white/60">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-sm relative z-10">© 2026 PropEstate. All rights reserved.</p>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold mb-2">
              {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {mode === "login" ? "Sign in to your PropEstate account" : mode === "signup" ? "Join India's biggest real estate platform" : "Enter your email and we'll send a reset link"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => update("fullName", e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update("email", e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={e => update("password", e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setMode("forgot")} className="text-accent text-sm hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-gold font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-accent font-medium hover:underline">Sign up for free</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-accent font-medium hover:underline">Sign in</button>
              </>
            )}
          </div>
          <AdminSetup />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
