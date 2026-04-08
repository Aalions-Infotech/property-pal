import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, IndianRupee, Calendar, ShieldCheck, Loader2, CheckCircle } from "lucide-react";

interface LeadFormProps {
  propertyId?: string;
  agentId?: string;
  title?: string;
  onSuccess?: () => void;
}

const LeadForm = ({ propertyId, agentId, title = "Schedule a Visit / Enquiry", onSuccess }: LeadFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [storedOtp, setStoredOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    budget: "",
    visit_date: "",
    otp: "",
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const sendOtp = async () => {
    if (!form.phone || form.phone.length < 10) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: form.phone, action: "send" },
      });
      if (error) throw error;
      setStoredOtp(data.otp_code);
      setOtpSent(true);
      toast({ title: `OTP sent to ${form.phone}`, description: `Demo OTP: ${data.otp_code}` });
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = () => {
    if (form.otp === storedOtp) {
      setOtpVerified(true);
      toast({ title: "✅ Phone verified successfully!" });
    } else {
      toast({ title: "Invalid OTP. Please try again.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    if (!otpVerified) {
      toast({ title: "Please verify your phone number first", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        budget: form.budget || null,
        visit_date: form.visit_date || null,
        otp_verified: true,
        property_id: propertyId || null,
        agent_id: agentId || null,
        status: "new",
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "🎉 Enquiry submitted successfully!" });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-lg mb-1">Thank You!</h3>
        <p className="text-sm text-muted-foreground">Your enquiry has been submitted. We'll get back to you shortly.</p>
      </div>
    );
  }

  const fieldClass = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <h3 className="font-display font-bold text-lg mb-4">{title}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder="Your full name" required className={`${fieldClass} pl-9`} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 98765 43210" required disabled={otpVerified} className={`${fieldClass} pl-9`} />
            </div>
            {!otpVerified && (
              <button type="button" onClick={sendOtp} disabled={sendingOtp} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium whitespace-nowrap disabled:opacity-50 flex items-center gap-1">
                {sendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {otpSent ? "Resend" : "Send OTP"}
              </button>
            )}
            {otpVerified && (
              <div className="flex items-center gap-1 px-3 text-emerald-500">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>
        </div>

        {otpSent && !otpVerified && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Enter OTP</label>
            <div className="flex gap-2">
              <input value={form.otp} onChange={e => update("otp", e.target.value)} placeholder="6-digit OTP" maxLength={6} className={`${fieldClass} flex-1`} />
              <button type="button" onClick={verifyOtp} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-medium">Verify</button>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.email} onChange={e => update("email", e.target.value)} placeholder="your@email.com" type="email" className={`${fieldClass} pl-9`} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Budget</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select value={form.budget} onChange={e => update("budget", e.target.value)} className={`${fieldClass} pl-9`}>
              <option value="">Select budget</option>
              <option value="Under ₹25 Lakh">Under ₹25 Lakh</option>
              <option value="₹25L - ₹50L">₹25L - ₹50L</option>
              <option value="₹50L - ₹1 Cr">₹50L - ₹1 Cr</option>
              <option value="₹1 Cr - ₹2 Cr">₹1 Cr - ₹2 Cr</option>
              <option value="₹2 Cr - ₹5 Cr">₹2 Cr - ₹5 Cr</option>
              <option value="Above ₹5 Cr">Above ₹5 Cr</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Preferred Visit Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="date" value={form.visit_date} onChange={e => update("visit_date", e.target.value)} min={new Date().toISOString().split("T")[0]} className={`${fieldClass} pl-9`} />
          </div>
        </div>

        <button type="submit" disabled={loading || !otpVerified} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Submitting..." : "Submit Enquiry"}
        </button>
      </form>
    </div>
  );
};

export default LeadForm;
