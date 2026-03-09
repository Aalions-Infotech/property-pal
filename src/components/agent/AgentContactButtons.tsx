import { Phone, Mail, MessageSquare, MessageCircle, ExternalLink } from "lucide-react";

interface AgentContactButtonsProps {
  phone?: string | null;
  email?: string | null;
  onEnquiryToggle: () => void;
}

const AgentContactButtons = ({ phone, email, onEnquiryToggle }: AgentContactButtonsProps) => {
  const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';

  return (
    <div className="flex gap-2 mt-4 flex-wrap">
      {phone && (
        <a href={`tel:${phone}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
          <Phone className="w-4 h-4" /> Call
        </a>
      )}
      {phone && (
        <a href={`sms:${phone}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors">
          <MessageCircle className="w-4 h-4" /> SMS
        </a>
      )}
      {phone && (
        <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </a>
      )}
      {email && (
        <a href={`mailto:${encodeURIComponent(email)}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
          <Mail className="w-4 h-4" /> Email
        </a>
      )}
      <button onClick={onEnquiryToggle} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/20">
        <ExternalLink className="w-4 h-4" /> Send Enquiry
      </button>
    </div>
  );
};

export default AgentContactButtons;
