import { useEffect, useState } from "react";
import { getUsers } from "../../lib/customers";

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
  try {
    const data = await getUsers();

    console.log("Users fetched:", data);

    setUsers(data || []);
  } catch (err) {
    console.error("Users fetch error:", err);
  }
}

  const filteredUsers = users.filter(
    (user) =>
      (user.full_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (user.email || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Users</h1>
        <p className="text-gray-600 mt-2">
          Registered users
        </p>
      </div>

      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-lg p-3"
      />

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Joined</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-4 font-medium">
                  {user.full_name}
                </td>

                <td className="p-4">
                  {user.email}
                </td>

                <td className="p-4">
                  {user.phone || "-"}
                </td>

                <td className="p-4">
                  {new Date(
                    user.created_at
                  ).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}