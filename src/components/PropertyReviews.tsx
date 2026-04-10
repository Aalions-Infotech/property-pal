import { useState, useEffect } from "react";
import { Star, ThumbsUp, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  propertyId: string;
}

const PropertyReviews = ({ propertyId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("property_reviews")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  const submitReview = async () => {
    if (!user) { toast({ title: "Please log in to leave a review", variant: "destructive" }); return; }
    if (!reviewText.trim()) { toast({ title: "Please write a review", variant: "destructive" }); return; }
    setSubmitting(true);

    // Get user profile for name
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();

    const { error } = await supabase.from("property_reviews").insert({
      user_id: user.id,
      property_id: propertyId,
      rating,
      review_text: reviewText.trim(),
      reviewer_name: profile?.full_name || user.email?.split("@")[0] || "Anonymous",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted! ✓" });
      setReviewText("");
      setRating(5);
      setShowForm(false);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "0";

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg">Ratings & Reviews</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                ))}
              </div>
              <span className="text-sm font-bold">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:opacity-90">
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-muted/30 rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center gap-1 mb-4">
            <span className="text-sm font-medium mr-2">Your Rating:</span>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}>
                <Star className={`w-6 h-6 transition-colors ${s <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-accent mb-3" />
          <div className="flex gap-2">
            <button onClick={submitReview} disabled={submitting} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit Review
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{r.reviewer_name}</span>
                      {r.is_verified && <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600">Verified</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  {r.review_text && <p className="text-sm text-muted-foreground mt-1">{r.review_text}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyReviews;
