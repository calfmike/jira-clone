const prisma = require("../config/prisma");

const createSprint = async (req, res) => {
  try {
    const { name, goal, startDate, endDate, status, projectId } = req.body;

    if (!name || !projectId) {
      return res.status(400).json({
        ok: false,
        message: "name and projectId are required"
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

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || "PLANNED",
        projectId
      }
    });

    return res.status(201).json({
      ok: true,
      message: "Sprint created successfully",
      data: sprint
    });
  } catch (error) {
    console.error("Error creating sprint:", error);

    return res.status(500).json({
      ok: false,
      message: "Error creating sprint",
      error: error.message
    });
  }
};

const getSprintsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      ok: true,
      data: sprints
    });
  } catch (error) {
    console.error("Error fetching sprints:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching sprints",
      error: error.message
    });
  }
};

module.exports = {
  createSprint,
  getSprintsByProject
};