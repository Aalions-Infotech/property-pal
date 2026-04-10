import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  propertyId: string;
  className?: string;
  size?: "sm" | "md";
}

const SavePropertyButton = ({ propertyId, className = "", size = "md" }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && propertyId) checkSaved();
  }, [user, propertyId]);

  const checkSaved = async () => {
    const { data } = await supabase
      .from("saved_properties")
      .select("id")
      .eq("user_id", user!.id)
      .eq("property_id", propertyId)
      .maybeSingle();
    setSaved(!!data);
  };

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please log in to save properties", variant: "destructive" });
      return;
    }
    setLoading(true);
    if (saved) {
      await supabase.from("saved_properties").delete().eq("user_id", user.id).eq("property_id", propertyId);
      setSaved(false);
      toast({ title: "Removed from saved" });
    } else {
      await supabase.from("saved_properties").insert({ user_id: user.id, property_id: propertyId });
      setSaved(true);
      toast({ title: "Property saved! ❤️" });
    }
    setLoading(false);
  };

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full flex items-center justify-center shadow transition-colors ${saved ? "text-red-500" : "text-muted-foreground hover:text-red-500"} ${className}`}
      title={saved ? "Remove from saved" : "Save property"}
    >
      <Heart className={`${iconSize} ${saved ? "fill-red-500" : ""}`} />
    </button>
  );
};

export default SavePropertyButton;
