interface Props {
  open: boolean;
  review: any;
  onClose: () => void;
}

export function ReviewDetailsModal({
  open,
  review,
  onClose,
}: Props) {
  if (!open || !review) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 overflow-y-auto">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto p-5 md:p-8 my-auto">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-3xl font-bold">
            ⭐ Review Details
          </h2>

          <button
            onClick={onClose}
            className="text-2xl"
          >
            ✕
          </button>

        </div>

        <div className="flex gap-5">

          <img
            src={
              review.products?.image ||
              "https://placehold.co/150"
            }
            className="w-36 h-36 rounded-xl object-cover border"
          />

          <div>

            <h3 className="text-2xl font-bold">
              {review.products?.name}
            </h3>

            <p className="mt-2">
              <b>Customer:</b> {review.reviewer_name}
            </p>

            <p className="mt-2">
              <b>Rating:</b>
              <span className="text-yellow-500 ml-2">
                {"⭐".repeat(review.rating)}
              </span>
            </p>

            <p className="mt-2">
              <b>Verified Purchase:</b>{" "}
              {review.is_verified_purchase ? "✔ Yes" : "No"}
            </p>

            <p className="mt-2">
              <b>Date:</b>{" "}
              {new Date(review.created_at).toLocaleDateString()}
            </p>

          </div>

        </div>

        <hr className="my-6" />

        <h3 className="font-bold text-xl">
          {review.title}
        </h3>

        <p className="mt-4 leading-7 text-gray-700">
          {review.comment}
        </p>

      </div>

    </div>
  );
}