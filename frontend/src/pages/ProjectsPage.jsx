import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getProjects, createProject, getUsers } from "../api";
import { queryKeys } from "../api/queryKeys";
import { useAppStore } from "../store";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, formatDate } from "../lib/utils";

export function ProjectsPage() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setActiveProject = useAppStore((s) => s.setActiveProject);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: getProjects,
  });

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: getUsers,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      setShowModal(false);
    },
  });

  function handleOpenProject(project) {
    setActiveProject(project);
    navigate(`/projects/${project.id}/board`);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">{projects.length} projects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleOpenProject(project)}
              className="flex items-center justify-between p-4 bg-card border border-slate-800 rounded-lg cursor-pointer hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-md bg-blue-500/20 text-blue-300 font-bold text-sm">
                  {project.key.slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-medium">{project.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {project.key} · {project.owner?.firstName} {project.owner?.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-500 text-xs">{formatDate(project.createdAt)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROJECT_STATUS_COLORS[project.status]}`}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateProjectModal
          users={users}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ users, onClose, onSubmit, isLoading, error }) {
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    ownerId: "",
    status: "ACTIVE",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && {
        key: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
      }),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-slate-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-white font-semibold">New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Project Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="My Project"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Project Key *</label>
            <input
              name="key"
              value={form.key}
              onChange={handleChange}
              required
              placeholder="MYPROJ"
              maxLength={6}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="What is this project about?"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Owner *</label>
            <select
              name="ownerId"
              value={form.ownerId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select owner...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
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
              {isLoading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}