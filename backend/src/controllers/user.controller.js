const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(200).json({
      ok: true,
      data: users
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching users"
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "firstName, lastName, email and password are required"
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: "Email already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: role || "DEVELOPER"
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      ok: true,
      message: "User created successfully",
      data: user
    });
  } catch (error) {
    console.error("Error creating user:", error);

    return res.status(500).json({
      ok: false,
      message: "Error creating user"
    });
  }
};

module.exports = {
  getUsers,
  createUser
};