-- CreateEnum
CREATE TYPE "HistoryActionType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'MOVED_TO_SPRINT', 'REMOVED_FROM_SPRINT', 'UPDATED', 'COMMENT_ADDED');

-- CreateTable
CREATE TABLE "WorkItemHistory" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "actionType" "HistoryActionType" NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkItemHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkItemHistory" ADD CONSTRAINT "WorkItemHistory_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItemHistory" ADD CONSTRAINT "WorkItemHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
