import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addCategory,
  updateCategory,
} from "../../lib/categories";

interface Props {
  open: boolean;
  onClose: () => void;
  category?: any;
}

export function AddCategoryModal({
  open,
  onClose,
  category,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [category, open]);

  async function handleSave() {
    try {
      const categoryData = {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description,
        image_url: "",
      };

      if (category) {
        await updateCategory(category.id, categoryData);
        alert("Category updated successfully!");
      } else {
        await addCategory(categoryData);
        alert("Category added successfully!");
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      alert(JSON.stringify(err, null, 2));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-5 md:p-8 shadow-xl my-auto">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {category ? "Edit Category" : "Add Category"}
          </h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <input
          className="border rounded-lg p-3 w-full mb-5"
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="border rounded-lg p-3 w-full"
          rows={5}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="border px-5 py-3 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            {category ? "Update Category" : "Save Category"}
          </button>
        </div>

      </div>
    </div>
  );
}