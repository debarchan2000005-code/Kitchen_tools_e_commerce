import { useEffect, useState } from "react";
import { getReviews, deleteReview } from "../../lib/reviews";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { ReviewDetailsModal } from "../components/ReviewDetailsModal";
export function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    const data = await getReviews(supabaseAdmin);
    setReviews(data || []);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;

    await deleteReview(id, supabaseAdmin);
    loadReviews();
  }

  const filtered = reviews.filter((review) =>
    JSON.stringify(review)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-4xl font-bold">
          Reviews
        </h1>

        <p className="text-gray-600 mt-2">
          Manage customer reviews
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search reviews..."
        className="w-full border rounded-xl p-4"
      />

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[640px]">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-4 text-left">Product</th>

              <th className="p-4 text-left">Customer</th>

              <th className="p-4 text-left">Rating</th>

              <th className="p-4 text-left">Title</th>

              <th className="p-4 text-left">Verified</th>

              <th className="p-4 text-left">Date</th>

              <th className="p-4 text-left">Actions</th>

            </tr>

          </thead>

          <tbody>

            {filtered.map((review) => (

              <tr
                key={review.id}
                className="border-t"
              >

                <td className="p-4">

                  <div className="flex items-center gap-3">

                    <img
                      src={
                        review.products?.image ||
                        "https://placehold.co/60x60"
                      }
                      className="w-12 h-12 rounded-lg border object-cover"
                    />

                    <span>
                      {review.products?.name}
                    </span>

                  </div>

                </td>

                <td className="p-4">
                  {review.reviewer_name}
                </td>

                <td className="p-4 text-yellow-500">
                  {"⭐".repeat(review.rating)}
                </td>

                <td className="p-4">
                  {review.title}
                </td>

                <td className="p-4">

                  {review.is_verified_purchase ? (
                    <span className="text-green-600 font-semibold">
                      ✔ Verified
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      No
                    </span>
                  )}

                </td>

                <td className="p-4">
                  {new Date(review.created_at).toLocaleDateString()}
                </td>

                <td className="p-4">

                  <div className="flex gap-3">

                    <button
                    onClick={() => {
                        setSelectedReview(review);
                        setOpenModal(true);
                    }}
                    className="text-blue-600 hover:underline"
                    >
                    View
                    </button>

                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>
                <ReviewDetailsModal
                open={openModal}
                review={selectedReview}
                onClose={() => setOpenModal(false)}
                />
    </div>
  );
}