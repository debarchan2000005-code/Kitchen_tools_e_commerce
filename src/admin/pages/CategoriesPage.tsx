import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

import {
  getCategories,
  deleteCategory,
} from "../../lib/categories";

import { AddCategoryModal } from "../components/AddCategoryModal";

export function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;

    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-8">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold">
            Categories
          </h1>

          <p className="text-gray-500 mt-1">
            Manage all categories
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCategory(null);
            setOpenModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </button>

      </div>

      <input
        type="text"
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 border rounded-lg px-4 py-3"
      />

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[640px]">

          <thead className="bg-gray-100">

            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Description</th>
              <th className="text-center p-4">Actions</th>
            </tr>

          </thead>

          <tbody>

            {filteredCategories.map((category) => (

              <tr
                key={category.id}
                className="border-t hover:bg-gray-50"
              >

                <td className="p-4 font-medium">
                  {category.name}
                </td>

                <td className="p-4">
                  {category.description}
                </td>

                <td className="p-4">

                  <div className="flex justify-center gap-3">

                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setOpenModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil size={20} />
                    </button>

                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <AddCategoryModal
        open={openModal}
        category={selectedCategory}
        onClose={() => {
          setOpenModal(false);
          fetchCategories();
        }}
      />

    </div>
  );
}