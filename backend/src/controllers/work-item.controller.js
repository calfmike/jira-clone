const prisma = require("../config/prisma");
const { createHistoryEntry } = require("../utils/history");

const generateWorkItemCode = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { key: true }
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const count = await prisma.workItem.count({
    where: { projectId }
  });

  return `${project.key}-${count + 1}`;
};

const createWorkItem = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      status,
      priority,
      projectId,
      sprintId,
      assigneeId,
      reporterId,
      parentId,
      storyPoints,
      estimateHours,
      severity,
      acceptanceCriteria,
      stepsToReproduce,
      expectedResult,
      actualResult
    } = req.body;

    if (!title || !type || !projectId || !reporterId) {
      return res.status(400).json({
        ok: false,
        message: "title, type, projectId and reporterId are required"
      });
    }

    const validTypes = ["EPIC", "STORY", "TASK", "DEFECT"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid work item type"
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        ok: false,
        message: "Project not found"
      });
    }

    const reporter = await prisma.user.findUnique({
      where: { id: reporterId }
    });

    if (!reporter) {
      return res.status(404).json({
        ok: false,
        message: "Reporter not found"
      });
    }

    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        return res.status(404).json({
          ok: false,
          message: "Assignee not found"
        });
      }
    }

    if (sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId }
      });

      if (!sprint) {
        return res.status(404).json({
          ok: false,
          message: "Sprint not found"
        });
      }
    }

    if (parentId) {
      const parent = await prisma.workItem.findUnique({
        where: { id: parentId }
      });

      if (!parent) {
        return res.status(404).json({
          ok: false,
          message: "Parent work item not found"
        });
      }
    }

    const code = await generateWorkItemCode(projectId);

    const workItem = await prisma.workItem.create({
      data: {
        code,
        title,
        description,
        type,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        projectId,
        sprintId: sprintId || null,
        assigneeId: assigneeId || null,
        reporterId,
        parentId: parentId || null,
        storyPoints: storyPoints ?? null,
        estimateHours: estimateHours ?? null,
        severity: severity || null,
        acceptanceCriteria: acceptanceCriteria || null,
        stepsToReproduce: stepsToReproduce || null,
        expectedResult: expectedResult || null,
        actualResult: actualResult || null
      },
      include: {
        project: true,
        sprint: true,
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
        parent: true
      }
    });

    await createHistoryEntry({
      workItemId: workItem.id,
      actionType: "CREATED",
      field: "workItem",
      newValue: `${workItem.code} created`,
      changedById: reporterId
    });

    return res.status(201).json({
      ok: true,
      message: "Work item created successfully",
      data: workItem
    });
  } catch (error) {
    console.error("Error creating work item:", error);

    return res.status(500).json({
      ok: false,
      message: "Error creating work item",
      error: error.message
    });
  }
};

const getWorkItemsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const workItems = await prisma.workItem.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        sprint: true,
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
      }
    });

    return res.status(200).json({
      ok: true,
      data: workItems
    });
  } catch (error) {
    console.error("Error fetching work items:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching work items",
      error: error.message
    });
  }
};

const getWorkItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const workItem = await prisma.workItem.findUnique({
      where: { id },
      include: {
        project: true,
        sprint: true,
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
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        history: {
          include: {
            changedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!workItem) {
      return res.status(404).json({
        ok: false,
        message: "Work item not found"
      });
    }

    return res.status(200).json({
      ok: true,
      data: workItem
    });
  } catch (error) {
    console.error("Error fetching work item:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching work item",
      error: error.message
    });
  }
};

const updateWorkItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        ok: false,
        message: "status is required"
      });
    }

    const existingWorkItem = await prisma.workItem.findUnique({
      where: { id }
    });

    if (!existingWorkItem) {
      return res.status(404).json({
        ok: false,
        message: "Work item not found"
      });
    }

    const updatedWorkItem = await prisma.workItem.update({
      where: { id },
      data: { status },
      include: {
        sprint: true,
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
        }
      }
    });

    await createHistoryEntry({
      workItemId: updatedWorkItem.id,
      actionType: "STATUS_CHANGED",
      field: "status",
      oldValue: existingWorkItem.status,
      newValue: status,
      changedById: null
    });

    return res.status(200).json({
      ok: true,
      message: "Work item status updated successfully",
      data: updatedWorkItem
    });
  } catch (error) {
    console.error("Error updating work item status:", error);

    return res.status(500).json({
      ok: false,
      message: "Error updating work item status",
      error: error.message
    });
  }
};

const assignWorkItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const existingWorkItem = await prisma.workItem.findUnique({
      where: { id }
    });

    if (!existingWorkItem) {
      return res.status(404).json({
        ok: false,
        message: "Work item not found"
      });
    }

    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        return res.status(404).json({
          ok: false,
          message: "Assignee not found"
        });
      }
    }

    const updatedWorkItem = await prisma.workItem.update({
      where: { id },
      data: {
        assigneeId: assigneeId || null
      },
      include: {
        sprint: true,
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
        }
      }
    });

    await createHistoryEntry({
      workItemId: updatedWorkItem.id,
      actionType: assigneeId ? "ASSIGNED" : "UNASSIGNED",
      field: "assigneeId",
      oldValue: existingWorkItem.assigneeId,
      newValue: assigneeId || null,
      changedById: null
    });

    return res.status(200).json({
      ok: true,
      message: "Work item assignee updated successfully",
      data: updatedWorkItem
    });
  } catch (error) {
    console.error("Error assigning work item:", error);

    return res.status(500).json({
      ok: false,
      message: "Error assigning work item",
      error: error.message
    });
  }
};

module.exports = {
  createWorkItem,
  getWorkItemsByProject,
  getWorkItemById,
  updateWorkItemStatus,
  assignWorkItem
};