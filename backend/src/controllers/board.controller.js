const prisma = require("../config/prisma");
const { createHistoryEntry } = require("../utils/history");

const BOARD_COLUMNS = [
  { status: "TODO", label: "To Do" },
  { status: "OPEN", label: "Open" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "IN_REVIEW", label: "In Review" },
  { status: "QA", label: "QA" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "REOPENED", label: "Reopened" },
  { status: "DONE", label: "Done" },
  { status: "CLOSED", label: "Closed" },
  { status: "REJECTED", label: "Rejected" },
  { status: "CANCELLED", label: "Cancelled" }
];

const ALLOWED_BOARD_STATUSES = BOARD_COLUMNS.map((column) => column.status);

const buildBoardColumns = (items) => {
  const columnsMap = new Map();

  for (const column of BOARD_COLUMNS) {
    columnsMap.set(column.status, {
      status: column.status,
      label: column.label,
      items: []
    });
  }

  for (const item of items) {
    if (!columnsMap.has(item.status)) {
      columnsMap.set(item.status, {
        status: item.status,
        label: item.status,
        items: []
      });
    }

    columnsMap.get(item.status).items.push(item);
  }

  return Array.from(columnsMap.values());
};

const getBaseInclude = () => ({
  sprint: {
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true
    }
  },
  project: {
    select: {
      id: true,
      name: true,
      key: true,
      status: true
    }
  },
  assignee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  },
  reporter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  },
  parent: {
    select: {
      id: true,
      code: true,
      title: true,
      type: true,
      status: true
    }
  },
  children: {
    select: {
      id: true,
      code: true,
      title: true,
      type: true,
      status: true
    }
  }
});

const buildBoardWhereClause = ({ projectId, sprintId, type, assigneeId }) => {
  const where = {};

  if (projectId) where.projectId = projectId;
  if (sprintId) where.sprintId = sprintId;
  if (type) where.type = type;
  if (assigneeId) where.assigneeId = assigneeId;

  return where;
};

const getProjectBoard = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, assigneeId } = req.query;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        key: true,
        status: true
      }
    });

    if (!project) {
      return res.status(404).json({
        ok: false,
        message: "Project not found"
      });
    }

    const items = await prisma.workItem.findMany({
      where: buildBoardWhereClause({ projectId, type, assigneeId }),
      orderBy: [{ createdAt: "desc" }],
      include: getBaseInclude()
    });

    const columns = buildBoardColumns(items);

    return res.status(200).json({
      ok: true,
      data: {
        scope: "project",
        filters: {
          type: type || null,
          assigneeId: assigneeId || null
        },
        project,
        totalItems: items.length,
        columns
      }
    });
  } catch (error) {
    console.error("Error fetching project board:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching project board",
      error: error.message
    });
  }
};

const getSprintBoard = async (req, res) => {
  try {
    const { sprintId } = req.params;
    const { type, assigneeId } = req.query;

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            status: true
          }
        }
      }
    });

    if (!sprint) {
      return res.status(404).json({
        ok: false,
        message: "Sprint not found"
      });
    }

    const items = await prisma.workItem.findMany({
      where: buildBoardWhereClause({ sprintId, type, assigneeId }),
      orderBy: [{ createdAt: "desc" }],
      include: getBaseInclude()
    });

    const columns = buildBoardColumns(items);

    return res.status(200).json({
      ok: true,
      data: {
        scope: "sprint",
        filters: {
          type: type || null,
          assigneeId: assigneeId || null
        },
        sprint,
        totalItems: items.length,
        columns
      }
    });
  } catch (error) {
    console.error("Error fetching sprint board:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching sprint board",
      error: error.message
    });
  }
};

const moveBoardItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        ok: false,
        message: "status is required"
      });
    }

    if (!ALLOWED_BOARD_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid board status"
      });
    }

    const existingItem = await prisma.workItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return res.status(404).json({
        ok: false,
        message: "Work item not found"
      });
    }

    const updatedItem = await prisma.workItem.update({
      where: { id },
      data: { status },
      include: getBaseInclude()
    });

    await createHistoryEntry({
      workItemId: updatedItem.id,
      actionType: "STATUS_CHANGED",
      field: "status",
      oldValue: existingItem.status,
      newValue: status,
      changedById: null
    });

    return res.status(200).json({
      ok: true,
      message: "Board item moved successfully",
      data: updatedItem
    });
  } catch (error) {
    console.error("Error moving board item:", error);

    return res.status(500).json({
      ok: false,
      message: "Error moving board item",
      error: error.message
    });
  }
};

module.exports = {
  getProjectBoard,
  getSprintBoard,
  moveBoardItem
};