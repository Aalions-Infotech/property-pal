import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";
import { BRAND_NAME } from "@/constants/brand";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl">Privacy Policy</h1>
              <p className="text-xs text-muted-foreground">Last updated: 3 July 2026</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="font-display font-bold text-lg mb-2">1. Introduction</h2>
              <p>
                {BRAND_NAME} ("we", "our", "us") is a Lucknow-based real estate marketplace. We are
                committed to protecting the personal information you share with us when you use our
                website, list a property, submit an enquiry, or interact with our agents.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-lg mb-2">2. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contact information you provide in enquiry forms — name, phone, email, budget, preferred visit date.</li>
                <li>Property details you post — location, price, images, description and RERA identifiers.</li>
                <li>Account information such as your email, role and authentication tokens.</li>
                <li>Usage information such as pages visited, saved searches and shortlists.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-lg mb-2">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To connect you with verified agents and property owners in Lucknow.</li>
                <li>To review, approve and publish property listings.</li>
                <li>To send transactional notifications, saved-search digests and enquiry updates.</li>
                <li>To improve our services, prevent fraud and enforce our terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-lg mb-2">4. Sharing of Information</h2>
              <p>
                We share your enquiry details only with the agent or listing owner associated with the
                property you are interested in. We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-lg mb-2">5. Data Security</h2>
              <p>
                We use industry-standard encryption, row-level security policies, and role-based access
                controls to protect your information. Sensitive credentials are never stored in
                plain text.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-lg mb-2">6. Your Rights</h2>
              <p>
                You may request access, correction or deletion of your personal information at any
                time by writing to <a className="text-accent underline" href="mailto:support@ekananda.estate">support@ekananda.estate</a>.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-lg mb-2">7. Cookies</h2>
              <p>
                We use cookies and local storage to keep you signed in and remember your search
                preferences. You may disable cookies in your browser, but some features of the site
                will not function correctly.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-lg mb-2">8. Contact Us</h2>
              <p>
                For any privacy-related questions, please email{" "}
                <a className="text-accent underline" href="mailto:support@ekananda.estate">
                  support@ekananda.estate
                </a>{" "}
                or call our Lucknow office at +91 93695 56641.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;