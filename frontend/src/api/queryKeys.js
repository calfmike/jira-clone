export const queryKeys = {
  users: {
    all: ["users"],
  },
  projects: {
    all: ["projects"],
    workItems: (projectId) => ["projects", projectId, "work-items"],
    board: (projectId, filters) => ["boards", "project", projectId, filters],
  },
  sprints: {
    byProject: (projectId) => ["sprints", "project", projectId],
    board: (sprintId, filters) => ["boards", "sprint", sprintId, filters],
  },
  workItems: {
    detail: (id) => ["work-items", id],
    comments: (id) => ["work-items", id, "comments"],
    history: (id) => ["work-items", id, "history"],
  },
};