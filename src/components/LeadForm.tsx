import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, IndianRupee, Calendar, Loader2, CheckCircle, Building2 } from "lucide-react";

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

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    budget: "",
    visit_date: "",
    property_type: "",
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast({ title: "Please fill your name and phone", variant: "destructive" });
      return;
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) {
      toast({ title: "Please enter a valid phone number", variant: "destructive" });
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
        property_type: form.property_type || null,
        otp_verified: false,
        property_id: propertyId || null,
        agent_id: agentId || null,
        status: "new",
      } as any);
      if (error) throw error;

      // Send admin email notification
      try {
        await supabase.functions.invoke("admin-email-notify", {
          body: {
            to: "azmata601010@gmail.com",
            subject: `📩 New Lead: ${form.full_name}`,
            type: "new_lead",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px; border-radius: 12px; margin-bottom: 20px;">
                  <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Ekananda Estate</h1>
                  <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">New Lead Notification</p>
                </div>
                <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 16px 0;">New Enquiry Received</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Name</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${form.full_name}</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${form.phone}</td></tr>
                    ${form.email ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${form.email}</td></tr>` : ""}
                    ${form.budget ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Budget</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${form.budget}</td></tr>` : ""}
                    ${form.visit_date ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Visit Date</td><td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${form.visit_date}</td></tr>` : ""}
                  </table>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">Ekananda Estate · Enterprise Real Estate Platform</p>
              </div>
            `,
          },
        });
      } catch {
        // Email notification failure shouldn't block lead submission
        console.warn("Admin email notification failed");
      }

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
            <input value={form.full_name} onChange={e => update("full_name", e.target.value)} required className={`${fieldClass} pl-9`} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.phone} onChange={e => update("phone", e.target.value)} required className={`${fieldClass} pl-9`} />
          </div>
        </div>

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

        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Submitting..." : "Submit Enquiry"}
        </button>
      </form>
    </div>
  );
};

export default LeadForm;
