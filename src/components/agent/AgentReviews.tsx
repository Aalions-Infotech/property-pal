import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AgentReviewsProps {
  agentUserId: string;
  agentName: string;
}

const AgentReviews = ({ agentUserId, agentName }: AgentReviewsProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ rating: 5, review_text: "", reviewer_name: "" });

  useEffect(() => {
    fetchReviews();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, [agentUserId]);

  const fetchReviews = async () => {
    const { data } = await (supabase.from("agent_reviews") as any)
      .select("*")
      .eq("agent_user_id", agentUserId)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.reviewer_name.trim() || form.reviewer_name.length > 100) {
      toast({ title: "Please enter a valid name (max 100 chars)", variant: "destructive" });
      return;
    }
    if (form.review_text.length > 1000) {
      toast({ title: "Review text must be under 1000 characters", variant: "destructive" });
      return;
    }
    if (!currentUserId) {
      toast({ title: "Please log in to submit a review", variant: "destructive" });
      return;
    }
    if (currentUserId === agentUserId) {
      toast({ title: "You cannot review yourself", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase.from("agent_reviews") as any).insert({
      agent_user_id: agentUserId,
      reviewer_user_id: currentUserId,
      rating: form.rating,
      review_text: form.review_text.trim() || null,
      reviewer_name: form.reviewer_name.trim(),
    });

    if (error) {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted successfully!" });
      setForm({ rating: 5, review_text: "", reviewer_name: "" });
      setShowForm(false);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Reviews ({reviews.length})
          {avgRating && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground ml-2">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {avgRating}
            </span>
          )}
        </h3>
        {currentUserId && currentUserId !== agentUserId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl text-sm font-medium btn-gold"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-accent/30 p-6 mb-6">
          <h4 className="font-semibold mb-4">Review {agentName}</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Your Name *</label>
              <input
                value={form.reviewer_name}
                onChange={e => setForm(f => ({ ...f, reviewer_name: e.target.value }))}
                placeholder="Enter your name"
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setForm(f => ({ ...f, rating: star }))}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${star <= form.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Your Review (optional)</label>
              <textarea
                value={form.review_text}
                onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))}
                placeholder="Share your experience..."
                maxLength={1000}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{form.review_text.length}/1000</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.reviewer_name.trim()}
              className="px-6 py-2.5 rounded-xl btn-gold text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Star className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-bold">{(review.reviewer_name || "U")[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.reviewer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
              </div>
              {review.review_text && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentReviews;
