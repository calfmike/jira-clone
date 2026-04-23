import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkItemById,
  updateWorkItemStatus,
  assignWorkItem,
  getCommentsByWorkItem,
  createComment,
  getHistoryByWorkItem,
  getUsers,
} from "../api";
import { queryKeys } from "../api/queryKeys";
import { useAppStore } from "../store";
import {
  WORK_ITEM_TYPE_COLORS,
  WORK_ITEM_TYPE_LABELS,
  WORK_ITEM_STATUS_COLORS,
  WORK_ITEM_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  formatDate,
  formatRelativeTime,
  getUserInitials,
  getUserFullName,
} from "../lib/utils";

const STATUSES = [
  "TODO", "OPEN", "IN_PROGRESS", "IN_REVIEW",
  "QA", "BLOCKED", "REOPENED", "DONE", "CLOSED", "REJECTED", "CANCELLED"
];

export function WorkItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);

  const [activeTab, setActiveTab] = useState("comments");
  const [commentText, setCommentText] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState(currentUser?.id ?? "");
  

  const { data: item, isLoading } = useQuery({
    queryKey: queryKeys.workItems.detail(id),
    queryFn: () => getWorkItemById(id),
  });

  const { data: comments = [] } = useQuery({
    queryKey: queryKeys.workItems.comments(id),
    queryFn: () => getCommentsByWorkItem(id),
  });

  const { data: history = [] } = useQuery({
    queryKey: queryKeys.workItems.history(id),
    queryFn: () => getHistoryByWorkItem(id),
  });

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: getUsers,
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateWorkItemStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workItems.detail(id) }),
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeId) => assignWorkItem(id, assigneeId || null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workItems.detail(id) }),
  });

  const commentMutation = useMutation({
    mutationFn: (payload) => createComment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workItems.comments(id) });
      setCommentText("");
    },
  });


useEffect(() => {
  if (!selectedAuthorId && users.length > 0) {
    setSelectedAuthorId(users[0].id);
  }
}, [users]);

  function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim() || !selectedAuthorId) return;
    commentMutation.mutate({ content: commentText, authorId: selectedAuthorId });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Loading...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
        <p>Work item not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-400 text-sm hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <button onClick={() => navigate(-1)} className="hover:text-slate-300 transition-colors">
            ← Back
          </button>
          <span>/</span>
          <span>{item.project?.name}</span>
          <span>/</span>
          <span className="font-mono">{item.code}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-white mb-6">{item.title}</h1>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Description
          </h3>
          {item.description ? (
            <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
          ) : (
            <p className="text-sm text-slate-600 italic">No description provided</p>
          )}
        </div>

        {/* Defect-specific fields */}
        {item.type === "DEFECT" && (
          <div className="space-y-4 mb-6">
            {item.stepsToReproduce && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Steps to Reproduce
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.stepsToReproduce}
                </p>
              </div>
            )}
            {item.expectedResult && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Expected Result
                </h3>
                <p className="text-sm text-slate-300">{item.expectedResult}</p>
              </div>
            )}
            {item.actualResult && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Actual Result
                </h3>
                <p className="text-sm text-slate-300">{item.actualResult}</p>
              </div>
            )}
          </div>
        )}

        {/* Story-specific fields */}
        {item.type === "STORY" && item.acceptanceCriteria && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Acceptance Criteria
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {item.acceptanceCriteria}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-800 mb-4">
          <div className="flex gap-4">
            {["comments", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab}
                <span className="ml-1.5 text-xs">
                  {tab === "comments" ? comments.length : history.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Comments tab */}
        {activeTab === "comments" && (
          <div className="space-y-4">
            {/* Add comment */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <select
                  value={selectedAuthorId}
                  onChange={(e) => setSelectedAuthorId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-300 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Comment as...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!commentText.trim() || !selectedAuthorId || commentMutation.isPending}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                >
                  {commentMutation.isPending ? "Saving..." : "Comment"}
                </button>
              </div>
            </form>

            {/* Comment list */}
            {comments.length === 0 ? (
              <p className="text-slate-600 text-sm">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-bold shrink-0 mt-0.5">
                    {comment.author
                      ? getUserInitials(comment.author.firstName, comment.author.lastName)
                      : "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white">
                        {getUserFullName(comment.author)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-slate-600 text-sm">No history yet</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-2 shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-400">
                      <span className="text-white font-medium">
                        {getUserFullName(entry.changedBy)}
                      </span>{" "}
                      {entry.actionType === "STATUS_CHANGED" && (
                        <>changed status from{" "}
                          <span className="text-slate-300">{WORK_ITEM_STATUS_LABELS[entry.oldValue] ?? entry.oldValue}</span>
                          {" "}to{" "}
                          <span className="text-slate-300">{WORK_ITEM_STATUS_LABELS[entry.newValue] ?? entry.newValue}</span>
                        </>
                      )}
                      {entry.actionType === "CREATED" && "created this item"}
                      {entry.actionType === "ASSIGNED" && "assigned this item"}
                      {entry.actionType === "UNASSIGNED" && "unassigned this item"}
                      {entry.actionType === "COMMENT_ADDED" && "added a comment"}
                      {!["STATUS_CHANGED","CREATED","ASSIGNED","UNASSIGNED","COMMENT_ADDED"].includes(entry.actionType) && entry.actionType}
                    </span>
                    <span className="text-slate-600 text-xs ml-2">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-64 shrink-0 border-l border-slate-800 p-5 overflow-y-auto space-y-5">
        {/* Status */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
            Status
          </label>
          <select
            value={item.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{WORK_ITEM_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Assignee */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
            Assignee
          </label>
          <select
            value={item.assigneeId ?? ""}
            onChange={(e) => assignMutation.mutate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            Details
          </label>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Type</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${WORK_ITEM_TYPE_COLORS[item.type]}`}>
              {WORK_ITEM_TYPE_LABELS[item.type]}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Priority</span>
            <span className={`text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
              {PRIORITY_LABELS[item.priority]}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Reporter</span>
            <span className="text-xs text-slate-300">{getUserFullName(item.reporter)}</span>
          </div>

          {item.storyPoints != null && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Story Points</span>
              <span className="text-xs text-slate-300">{item.storyPoints}</span>
            </div>
          )}

          {item.sprint && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Sprint</span>
              <span className="text-xs text-slate-300">{item.sprint.name}</span>
            </div>
          )}

          {item.parent && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Parent</span>
              <span className="text-xs text-blue-400 font-mono">{item.parent.code}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Created</span>
            <span className="text-xs text-slate-300">{formatDate(item.createdAt)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Updated</span>
            <span className="text-xs text-slate-300">{formatRelativeTime(item.updatedAt)}</span>
          </div>
        </div>

        {/* Children */}
        {item.children?.length > 0 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Child Items ({item.children.length})
            </label>
            <div className="space-y-1.5">
              {item.children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                  onClick={() => navigate(`/work-items/${child.id}`)}
                >
                  <span className={`text-[9px] px-1 py-0.5 rounded font-semibold ${WORK_ITEM_TYPE_COLORS[child.type]}`}>
                    {child.type[0]}
                  </span>
                  <span className="font-mono text-slate-500">{child.code}</span>
                  <span className="truncate">{child.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}