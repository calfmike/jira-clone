import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser } from "../api";
import { queryKeys } from "../api/queryKeys";
import { USER_ROLE_LABELS, formatDate } from "../lib/utils";
import { useAppStore } from "../store";

const ROLES = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "QA", "VIEWER"];

export function SettingsPage() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: getUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setShowModal(false);
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage users and team members</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          + New User
        </button>
      </div>

      {/* Active user selector */}
      <div className="bg-card border border-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Active User</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simula quien está logueado — se usa como reporter y autor de comentarios
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                  {currentUser.firstName[0]}{currentUser.lastName[0]}
                </div>
                <span className="text-sm text-white">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <RoleBadge role={currentUser.role} />
              </div>
            )}
            <select
              value={currentUser?.id ?? ""}
              onChange={(e) => {
                const selected = users.find((u) => u.id === e.target.value);
                setCurrentUser(selected ?? null);
              }}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-card border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">
            Users <span className="text-slate-500 font-normal ml-1">({users.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No users yet</div>
        ) : (
          <div>
            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Joined</span>
            </div>
            {users.map((user, i) => (
              <div
                key={user.id}
                className={`grid grid-cols-4 gap-4 px-4 py-3 items-center hover:bg-slate-800/40 transition-colors ${
                  i < users.length - 1 ? "border-b border-slate-800" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold shrink-0">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="text-sm text-white truncate">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <span className="text-sm text-slate-400 truncate">{user.email}</span>
                <span><RoleBadge role={user.role} /></span>
                <span className="text-xs text-slate-500">{formatDate(user.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = {
    ADMIN: "bg-red-500/20 text-red-300",
    PROJECT_MANAGER: "bg-purple-500/20 text-purple-300",
    DEVELOPER: "bg-blue-500/20 text-blue-300",
    QA: "bg-cyan-500/20 text-cyan-300",
    VIEWER: "bg-slate-500/20 text-slate-400",
  };

  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors[role]}`}>
      {USER_ROLE_LABELS[role]}
    </span>
  );
}

function CreateUserModal({ onClose, onSubmit, isLoading, error }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "DEVELOPER",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-slate-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-white font-semibold">New User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">First Name *</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="John"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Last Name *</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Email *</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              type="email"
              placeholder="john@example.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Password *</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 text-sm rounded-md hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              {isLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}