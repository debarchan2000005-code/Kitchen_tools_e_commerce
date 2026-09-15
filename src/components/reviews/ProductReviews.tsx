import { useEffect, useState } from "react";
import { getProductReviews } from "../../lib/reviews";
import { ReviewForm } from "./ReviewForm";

interface Props {
  productId: string;
}

export function ProductReviews({
  productId,
}: Props) {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function loadReviews() {
    const data = await getProductReviews(productId);
    setReviews(data || []);
  }

  return (
    <div className="space-y-8 mt-12">

      <div>
        <h2 className="text-3xl font-bold mb-6">
          Customer Reviews
        </h2>

        {reviews.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-gray-500">
            No reviews yet.
            <br />
            Be the first customer to review this product.
          </div>
        ) : (
          <div className="space-y-5">

            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow p-6"
              >
                <div className="flex justify-between items-center">

                  <h3 className="font-bold text-lg">
                    {review.title}
                  </h3>

                  <span className="text-yellow-500 text-lg">
                    {"⭐".repeat(review.rating)}
                  </span>

                </div>

                <p className="text-gray-600 mt-3">
                  {review.comment}
                </p>

                <div className="mt-4 flex justify-between items-center">

                  <span className="font-medium">
                    {review.reviewer_name}
                  </span>

                  {review.is_verified_purchase && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      ✔ Verified Purchase
                    </span>
                  )}

                </div>

                <p className="text-gray-400 text-sm mt-2">
                  {new Date(
                    review.created_at
                  ).toLocaleDateString()}
                </p>

              </div>
            ))}

          </div>
        )}
      </div>

      <ReviewForm
        productId={productId}
        onSuccess={loadReviews}
      />

    </div>
  );
}