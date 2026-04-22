const prisma = require("../config/prisma");

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      ok: true,
      data: projects
    });
  } catch (error) {
    console.error("Error fetching projects:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching projects"
    });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, key, description, ownerId, status } = req.body;

    if (!name || !key || !ownerId) {
      return res.status(400).json({
        ok: false,
        message: "name, key and ownerId are required"
      });
    }

    const existingProject = await prisma.project.findUnique({
      where: { key }
    });

    if (existingProject) {
      return res.status(409).json({
        ok: false,
        message: "Project key already exists"
      });
    }

    const owner = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!owner) {
      return res.status(404).json({
        ok: false,
        message: "Owner user not found"
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        key: key.toUpperCase(),
        description,
        ownerId,
        status: status || "DRAFT",
        members: {
          create: {
            userId: ownerId,
            role: "PROJECT_MANAGER"
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    return res.status(201).json({
      ok: true,
      message: "Project created successfully",
      data: project
    });
  } catch (error) {
    console.error("Error creating project:", error);

    return res.status(500).json({
      ok: false,
      message: "Error creating project"
    });
  }
};

module.exports = {
  getProjects,
  createProject
};