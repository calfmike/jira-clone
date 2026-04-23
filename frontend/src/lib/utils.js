import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getUserInitials(firstName, lastName) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

export function getUserFullName(user) {
  if (!user) return "Unassigned";
  return `${user.firstName} ${user.lastName}`;
}

// Label maps
export const WORK_ITEM_STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  QA: "QA",
  BLOCKED: "Blocked",
  DONE: "Done",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  OPEN: "Open",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

export const WORK_ITEM_TYPE_LABELS = {
  EPIC: "Epic",
  STORY: "Story",
  TASK: "Task",
  DEFECT: "Defect",
};

export const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const PROJECT_STATUS_LABELS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const SPRINT_STATUS_LABELS = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

// Color maps
export const PRIORITY_COLORS = {
  LOW: "text-slate-400",
  MEDIUM: "text-blue-400",
  HIGH: "text-amber-400",
  CRITICAL: "text-red-400",
};

export const WORK_ITEM_TYPE_COLORS = {
  EPIC: "bg-purple-500/20 text-purple-300",
  STORY: "bg-green-500/20 text-green-300",
  TASK: "bg-blue-500/20 text-blue-300",
  DEFECT: "bg-red-500/20 text-red-300",
};

export const WORK_ITEM_STATUS_COLORS = {
  TODO: "bg-slate-500/20 text-slate-300",
  OPEN: "bg-slate-500/20 text-slate-300",
  IN_PROGRESS: "bg-blue-500/20 text-blue-300",
  IN_REVIEW: "bg-violet-500/20 text-violet-300",
  QA: "bg-cyan-500/20 text-cyan-300",
  BLOCKED: "bg-red-500/20 text-red-300",
  REOPENED: "bg-orange-500/20 text-orange-300",
  DONE: "bg-green-500/20 text-green-300",
  CLOSED: "bg-green-500/20 text-green-300",
  REJECTED: "bg-zinc-500/20 text-zinc-400",
  CANCELLED: "bg-zinc-500/20 text-zinc-400",
};

export const PROJECT_STATUS_COLORS = {
  DRAFT: "bg-zinc-500/20 text-zinc-400",
  ACTIVE: "bg-green-500/20 text-green-300",
  ON_HOLD: "bg-amber-500/20 text-amber-300",
  COMPLETED: "bg-blue-500/20 text-blue-300",
  ARCHIVED: "bg-zinc-700/30 text-zinc-500",
};

export const SPRINT_STATUS_COLORS = {
  PLANNED: "bg-slate-500/20 text-slate-300",
  ACTIVE: "bg-green-500/20 text-green-300",
  CLOSED: "bg-zinc-500/20 text-zinc-400",
  CANCELLED: "bg-red-500/20 text-red-300",
};

export const USER_ROLE_LABELS = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  DEVELOPER: "Developer",
  QA: "QA",
  VIEWER: "Viewer",
};