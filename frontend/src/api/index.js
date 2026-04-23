import api from "./client";

// ─── Users ───────────────────────────────────────────────────────────────────

export const getUsers = () =>
  api.get("/users").then((r) => r.data.data);

export const createUser = (payload) =>
  api.post("/users", payload).then((r) => r.data.data);

// ─── Projects ────────────────────────────────────────────────────────────────

export const getProjects = () =>
  api.get("/projects").then((r) => r.data.data);

export const createProject = (payload) =>
  api.post("/projects", payload).then((r) => r.data.data);

export const getProjectWorkItems = (projectId) =>
  api.get(`/projects/${projectId}/work-items`).then((r) => r.data.data);

// ─── Sprints ─────────────────────────────────────────────────────────────────

export const getSprintsByProject = (projectId) =>
  api.get(`/sprints/project/${projectId}`).then((r) => r.data.data);

export const createSprint = (payload) =>
  api.post("/sprints", payload).then((r) => r.data.data);

// ─── Work Items ───────────────────────────────────────────────────────────────

export const getWorkItemById = (id) =>
  api.get(`/work-items/${id}`).then((r) => r.data.data);

export const createWorkItem = (payload) =>
  api.post("/work-items", payload).then((r) => r.data.data);

export const updateWorkItemStatus = (id, status) =>
  api.patch(`/work-items/${id}/status`, { status }).then((r) => r.data.data);

export const assignWorkItem = (id, assigneeId) =>
  api.patch(`/work-items/${id}/assign`, { assigneeId }).then((r) => r.data.data);

// ─── Board ───────────────────────────────────────────────────────────────────

export const getProjectBoard = (projectId, filters) =>
  api.get(`/boards/project/${projectId}`, { params: filters }).then((r) => r.data.data);

export const getSprintBoard = (sprintId, filters) =>
  api.get(`/boards/sprint/${sprintId}`, { params: filters }).then((r) => r.data.data);

export const moveBoardItem = (id, status) =>
  api.patch(`/boards/work-items/${id}/move`, { status }).then((r) => r.data.data);

// ─── Comments ────────────────────────────────────────────────────────────────

export const getCommentsByWorkItem = (workItemId) =>
  api.get(`/work-items/${workItemId}/comments`).then((r) => r.data.data);

export const createComment = (workItemId, payload) =>
  api.post(`/work-items/${workItemId}/comments`, payload).then((r) => r.data.data);

// ─── History ─────────────────────────────────────────────────────────────────

export const getHistoryByWorkItem = (workItemId) =>
  api.get(`/work-items/${workItemId}/history`).then((r) => r.data.data);