const prisma = require("../config/prisma");

const getHistoryByWorkItem = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await prisma.workItemHistory.findMany({
      where: {
        workItemId: id
      },
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
    });

    return res.status(200).json({
      ok: true,
      data: history
    });
  } catch (error) {
    console.error("Error fetching history:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching history",
      error: error.message
    });
  }
};

module.exports = {
  getHistoryByWorkItem
};