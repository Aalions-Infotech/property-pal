import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Login = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-gold">
              <Building2 className="w-7 h-7 text-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
            <p className="text-muted-foreground text-sm mt-1">{mode === "login" ? "Login to manage your listings and saved properties" : "Join India's most trusted real estate platform"}</p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <div className="flex mb-6 bg-muted rounded-xl p-1">
              <button onClick={() => setMode("login")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Login</button>
              <button onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "signup" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Sign Up</button>
            </div>

            <div className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input placeholder="Your full name" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPass ? "text" : "password"} placeholder="Enter password" className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <button className="w-full btn-navy py-3 rounded-xl text-sm font-medium mt-2">
                {mode === "login" ? "Login to Ekananda Estate" : "Create Account"}
              </button>
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              {mode === "login" ? (
                <>Don't have an account? <button onClick={() => setMode("signup")} className="text-accent font-medium">Sign Up</button></>
              ) : (
                <>Already have an account? <button onClick={() => setMode("login")} className="text-accent font-medium">Login</button></>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
