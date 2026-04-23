import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectBoard, moveBoardItem, getUsers, createWorkItem, getProjects } from "../api";
import { queryKeys } from "../api/queryKeys";
import { useAppStore } from "../store";
import {
  WORK_ITEM_TYPE_COLORS,
  WORK_ITEM_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  WORK_ITEM_STATUS_LABELS,
  getUserInitials,
} from "../lib/utils";

const BOARD_COLUMNS = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "IN_REVIEW", label: "In Review" },
  { status: "QA", label: "QA" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "DONE", label: "Done" },
];

export function BoardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);
  const setActiveProject = useAppStore((s) => s.setActiveProject);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: getProjects,
  });

  const { data: board, isLoading } = useQuery({
    queryKey: queryKeys.projects.board(projectId, { type: filterType }),
    queryFn: () => getProjectBoard(projectId, filterType ? { type: filterType } : undefined),
    enabled: !!projectId,
  });

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: getUsers,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }) => moveBoardItem(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setSelectedItem(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: createWorkItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setShowCreateModal(false);
    },
  });

  function handleProjectChange(e) {
    const selected = projects.find((p) => p.id === e.target.value);
    if (selected) {
      setActiveProject(selected);
      navigate(`/projects/${selected.id}/board`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Loading board...
      </div>
    );
  }

  const columns = BOARD_COLUMNS.map((col) => ({
    ...col,
    items: board?.columns?.find((c) => c.status === col.status)?.items ?? [],
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">Board</h1>
          <select
            value={projectId}
            onChange={handleProjectChange}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 text-sm focus:outline-none focus:border-blue-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-slate-400 text-xs">
            {board?.totalItems ?? 0} items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">All types</option>
            <option value="EPIC">Epic</option>
            <option value="STORY">Story</option>
            <option value="TASK">Task</option>
            <option value="DEFECT">Defect</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
          >
            + Create
          </button>
        </div>
      </div>

      {/* Board columns */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((col) => (
            <div key={col.status} className="flex flex-col w-64 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {col.label}
                </span>
                <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                  {col.items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {col.items.map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Move item modal */}
      {selectedItem && (
        <MoveItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onMove={(status) => moveMutation.mutate({ id: selectedItem.id, status })}
          isLoading={moveMutation.isPending}
        />
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateWorkItemModal
          projectId={projectId}
          users={users}
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}
    </div>
  );
}

function WorkItemCard({ item, onClick }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-card border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${WORK_ITEM_TYPE_COLORS[item.type]}`}>
          {WORK_ITEM_TYPE_LABELS[item.type]}
        </span>
        <span className={`text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
          {PRIORITY_LABELS[item.priority]}
        </span>
      </div>
      <p
        onClick={() => navigate(`/work-items/${item.id}`)}
        className="text-sm text-white leading-snug mb-3 hover:text-blue-400 transition-colors"
      >
        {item.title}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono">{item.code}</span>
        <div className="flex items-center gap-2">
          {item.assignee ? (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/30 text-blue-300 text-[9px] font-bold">
              {getUserInitials(item.assignee.firstName, item.assignee.lastName)}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-slate-700" />
          )}
          <button
            onClick={onClick}
            className="text-[10px] text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 px-1.5 py-0.5 rounded transition-colors"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}

function MoveItemModal({ item, onClose, onMove, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-slate-800 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-white font-semibold text-sm">Move Item</h2>
            <p className="text-slate-400 text-xs mt-0.5">{item.code} · {item.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-xs text-slate-400 mb-3">Select new status:</p>
          {BOARD_COLUMNS.map((col) => (
            <button
              key={col.status}
              disabled={item.status === col.status || isLoading}
              onClick={() => onMove(col.status)}
              className={`w-full text-left px-4 py-2.5 rounded-md text-sm transition-colors ${
                item.status === col.status
                  ? "bg-blue-500/20 text-blue-300 cursor-default"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.status === col.status && <span className="mr-2">✓</span>}
              {col.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateWorkItemModal({ projectId, users, currentUser, onClose, onSubmit, isLoading, error }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "TASK",
    priority: "MEDIUM",
    status: "TODO",
    projectId,
    reporterId: currentUser?.id ?? "",
    assigneeId: "",
    storyPoints: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      storyPoints: form.storyPoints ? parseInt(form.storyPoints) : undefined,
      assigneeId: form.assigneeId || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-white font-semibold">Create Work Item</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Type *</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="TASK">Task</option>
                <option value="STORY">Story</option>
                <option value="EPIC">Epic</option>
                <option value="DEFECT">Defect</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              placeholder="Add more details..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Assignee</label>
              <select name="assigneeId" value={form.assigneeId} onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Reporter *</label>
              <select name="reporterId" value={form.reporterId} onChange={handleChange} required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select reporter...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Story Points</label>
            <input name="storyPoints" value={form.storyPoints} onChange={handleChange}
              type="number" min="0" max="100" placeholder="0"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 text-sm rounded-md hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors">
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}