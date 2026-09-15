import { useState } from "react";
import { addReview } from "../../lib/reviews";

interface Props {
  productId: string;
  onSuccess: () => void;
}

export function ReviewForm({
  productId,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [review, setReview] = useState({
    reviewer_name: "",
    rating: 5,
    title: "",
    comment: "",
  });

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      await addReview({
        product_id: productId,
        reviewer_name: review.reviewer_name,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        is_verified_purchase: false,
      });

      setReview({
        reviewer_name: "",
        rating: 5,
        title: "",
        comment: "",
      });

      onSuccess();

      alert("Review submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Unable to submit review.");
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow p-6 space-y-4"
    >
      <h2 className="text-2xl font-bold">
        Write a Review
      </h2>

      <input
        required
        placeholder="Your Name"
        value={review.reviewer_name}
        onChange={(e) =>
          setReview({
            ...review,
            reviewer_name: e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      />

      <input
        required
        placeholder="Review Title"
        value={review.title}
        onChange={(e) =>
          setReview({
            ...review,
            title: e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      />

      <textarea
        required
        rows={5}
        placeholder="Write your review..."
        value={review.comment}
        onChange={(e) =>
          setReview({
            ...review,
            comment: e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      />

      <div>
        <label className="font-semibold">
          Rating
        </label>

        <select
          value={review.rating}
          onChange={(e) =>
            setReview({
              ...review,
              rating: Number(e.target.value),
            })
          }
          className="w-full mt-2 border rounded-lg p-3"
        >
          <option value={5}>★★★★★ (5)</option>
          <option value={4}>★★★★☆ (4)</option>
          <option value={3}>★★★☆☆ (3)</option>
          <option value={2}>★★☆☆☆ (2)</option>
          <option value={1}>★☆☆☆☆ (1)</option>
        </select>
      </div>

      <button
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}