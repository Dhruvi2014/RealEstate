import { useState, useEffect } from "react";
import { Trash2, Search, Users as UsersIcon, RefreshCw, Mail, Phone, Calendar } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { backendurl } from "../config/constants";
import { cn } from "../lib/utils";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterRole, setFilterRole] = useState("all");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendurl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    toast.success("Users refreshed!");
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Remove user "${userName}"? This will also delete any properties and appointments tied to them and cannot be undone.`)) return;
    try {
      const response = await axios.delete(`${backendurl}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.data.success) {
        toast.success("User removed successfully");
        await fetchUsers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user");
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchTerm || [u.name, u.email].some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#FAF8F4]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#D4755B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5A5856] font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#FAF8F4]">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1C1B1A] mb-1">Users</h1>
            <p className="text-[#5A5856] text-sm">
              <span className="font-semibold text-[#D4755B]">{filteredUsers.length}</span> users found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button onClick={handleRefresh} disabled={refreshing}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E6D5C3] text-[#1C1B1A] rounded-xl text-sm font-medium hover:border-[#D4755B] hover:text-[#D4755B] transition-all shadow-card disabled:opacity-60">
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 border border-[#E6D5C3] shadow-card mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input type="text" placeholder="Search by name or email..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F4] border border-[#E6D5C3] rounded-xl text-sm text-[#1C1B1A] placeholder-[#9CA3AF] outline-none focus:border-[#D4755B] focus:ring-2 focus:ring-[#D4755B]/15 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-[#FAF8F4] rounded-xl p-1 flex-shrink-0">
               {["all", "buyer", "agent", "admin"].map((roleOption) => (
                <button key={roleOption} onClick={() => setFilterRole(roleOption)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize",
                    filterRole === roleOption
                      ? "bg-[#1C1B1A] text-[#FAF8F4] shadow-sm"
                      : "text-[#5A5856] hover:text-[#1C1B1A]"
                  )}>
                  {roleOption}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="bg-white rounded-2xl border border-[#E6D5C3] shadow-card overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-[#F5F1E8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-[#E6D5C3]" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1B1A] mb-2">No users found</h3>
              <p className="text-sm text-[#9CA3AF]">Adjust your search or filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#5A5856]">
                <thead className="bg-[#FAF8F4] text-[#1C1B1A] font-semibold text-xs uppercase tracking-wider border-b border-[#E6D5C3]">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F1E8]">
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.tr key={user._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="hover:bg-[#FAF8F4]/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#1C1B1A]">{user.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-semibold rounded-full capitalize",
                            user.role === 'admin' ? "bg-purple-100 text-purple-700" :
                            user.role === 'agent' ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {user.role || 'buyer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleRemoveUser(user._id, user.name)}
                            className="p-2 text-[#5A5856] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete User">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
