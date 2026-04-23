import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectWorkItems, getSprintsByProject, createWorkItem, createSprint } from "../api";
import { queryKeys } from "../api/queryKeys";
import { useAppStore } from "../store";
import {
  WORK_ITEM_TYPE_COLORS,
  WORK_ITEM_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_STATUS_COLORS,
  SPRINT_STATUS_COLORS,
  SPRINT_STATUS_LABELS,
  formatDate,
  getUserInitials,
} from "../lib/utils";
import { getUsers } from "../api";
import { useState } from "react";

export function BacklogPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const activeProject = useAppStore((s) => s.activeProject);
  const currentUser = useAppStore((s) => s.currentUser);

  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: workItems = [], isLoading: loadingItems } = useQuery({
    queryKey: queryKeys.projects.workItems(projectId),
    queryFn: () => getProjectWorkItems(projectId),
  });

  const { data: sprints = [], isLoading: loadingSprints } = useQuery({
    queryKey: queryKeys.sprints.byProject(projectId),
    queryFn: () => getSprintsByProject(projectId),
  });

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: getUsers,
  });

  const createItemMutation = useMutation({
    mutationFn: createWorkItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.workItems(projectId) });
      setShowCreateItem(false);
    },
  });

  const createSprintMutation = useMutation({
    mutationFn: createSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byProject(projectId) });
      setShowCreateSprint(false);
    },
  });

  const filtered = workItems.filter((item) => {
    if (filterType && item.type !== filterType) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const backlogItems = filtered.filter((item) => !item.sprintId);
  const sprintItemsMap = sprints.reduce((acc, sprint) => {
    acc[sprint.id] = filtered.filter((item) => item.sprintId === sprint.id);
    return acc;
  }, {});

  if (loadingItems || loadingSprints) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Loading backlog...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white">
            {activeProject?.name ?? "Backlog"}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {workItems.length} total items
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
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="QA">QA</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </select>
          <button
            onClick={() => setShowCreateSprint(true)}
            className="px-4 py-1.5 border border-slate-700 text-slate-300 text-sm rounded-md hover:bg-slate-800 transition-colors"
          >
            + Sprint
          </button>
          <button
            onClick={() => setShowCreateItem(true)}
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
          >
            + Create
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Sprints */}
        {sprints.map((sprint) => (
          <SprintSection
            key={sprint.id}
            sprint={sprint}
            items={sprintItemsMap[sprint.id] ?? []}
          />
        ))}

        {/* Backlog */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-slate-300">Backlog</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
              {backlogItems.length}
            </span>
          </div>
          {backlogItems.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-800 rounded-lg">
              No items in backlog
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              {backlogItems.map((item, i) => (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  isLast={i === backlogItems.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateItem && (
        <CreateWorkItemModal
          projectId={projectId}
          users={users}
          sprints={sprints}
          currentUser={currentUser}
          onClose={() => setShowCreateItem(false)}
          onSubmit={(data) => createItemMutation.mutate(data)}
          isLoading={createItemMutation.isPending}
          error={createItemMutation.error?.message}
        />
      )}

      {showCreateSprint && (
        <CreateSprintModal
          projectId={projectId}
          onClose={() => setShowCreateSprint(false)}
          onSubmit={(data) => createSprintMutation.mutate(data)}
          isLoading={createSprintMutation.isPending}
          error={createSprintMutation.error?.message}
        />
      )}
    </div>
  );
}

function SprintSection({ sprint, items }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <span className="text-slate-400 text-xs">{collapsed ? "▶" : "▼"}</span>
          <span className="text-sm font-semibold text-slate-300">{sprint.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${SPRINT_STATUS_COLORS[sprint.status]}`}>
            {SPRINT_STATUS_LABELS[sprint.status]}
          </span>
          {sprint.startDate && (
            <span className="text-xs text-slate-500 shrink-0">
              {formatDate(sprint.startDate)} → {sprint.endDate ? formatDate(sprint.endDate) : "?"}
            </span>
          )}
          <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full ml-auto shrink-0">
            {items.length}
          </span>
        </button>
        <button
          onClick={() => navigate(`/projects/${sprint.projectId}/board?sprintId=${sprint.id}`)}
          className="text-xs text-slate-500 hover:text-blue-400 border border-slate-700 hover:border-blue-500/50 px-2 py-1 rounded transition-colors shrink-0"
        >
          View Board
        </button>
      </div>

      {!collapsed && (
        items.length === 0 ? (
          <div className="text-center py-6 text-slate-600 text-sm border border-dashed border-slate-800 rounded-lg">
            No items in this sprint
          </div>
        ) : (
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            {items.map((item, i) => (
              <WorkItemRow
                key={item.id}
                item={item}
                isLast={i === items.length - 1}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function WorkItemRow({ item, isLast }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/work-items/${item.id}`)}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${!isLast ? "border-b border-slate-800" : ""}`}
    >
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${WORK_ITEM_TYPE_COLORS[item.type]}`}>
        {WORK_ITEM_TYPE_LABELS[item.type]}
      </span>
      <span className="text-sm text-white flex-1 truncate">{item.title}</span>
      <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.code}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${WORK_ITEM_STATUS_COLORS[item.status]}`}>
        {WORK_ITEM_STATUS_LABELS[item.status]}
      </span>
      <span className={`text-xs shrink-0 ${PRIORITY_COLORS[item.priority]}`}>
        {PRIORITY_LABELS[item.priority]}
      </span>
      {item.assignee ? (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/30 text-blue-300 text-[9px] font-bold shrink-0">
          {getUserInitials(item.assignee.firstName, item.assignee.lastName)}
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border border-dashed border-slate-700 shrink-0" />
      )}
    </div>
  );
}

function CreateWorkItemModal({ projectId, users, sprints, currentUser, onClose, onSubmit, isLoading, error }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "TASK",
    priority: "MEDIUM",
    status: "TODO",
    projectId,
    reporterId: currentUser?.id ?? "",
    assigneeId: "",
    sprintId: "",
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
      sprintId: form.sprintId || undefined,
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
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Sprint</label>
            <select name="sprintId" value={form.sprintId} onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">Backlog (no sprint)</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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

function CreateSprintModal({ projectId, onClose, onSubmit, isLoading, error }) {
  const [form, setForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    projectId,
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-slate-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-white font-semibold">New Sprint</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Sprint Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder="Sprint 1"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Goal</label>
            <textarea name="goal" value={form.goal} onChange={handleChange} rows={2}
              placeholder="What do we want to achieve?"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Start Date</label>
              <input name="startDate" value={form.startDate} onChange={handleChange} type="date"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">End Date</label>
              <input name="endDate" value={form.endDate} onChange={handleChange} type="date"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 text-sm rounded-md hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors">
              {isLoading ? "Creating..." : "Create Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}