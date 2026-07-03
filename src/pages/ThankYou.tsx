import { Link } from "react-router-dom";
import { CheckCircle2, Home, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ThankYou = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
        <div className="max-w-xl w-full text-center bg-card rounded-3xl border border-border p-10 shadow-card">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h1 className="font-display font-bold text-3xl mb-3">Thank You!</h1>
          <p className="text-muted-foreground mb-2">
            Your enquiry has been submitted successfully.
          </p>
          <p className="text-muted-foreground mb-8">
            Our Lucknow property expert will reach out to you within the next few hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm">
              <Home className="w-4 h-4" /> Back to Home
            </Link>
            <a href="tel:+919369556641" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border font-medium text-sm hover:bg-muted">
              <Phone className="w-4 h-4" /> Call Us
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;