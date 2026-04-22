const prisma = require("../config/prisma");
const { createHistoryEntry } = require("../utils/history");

const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, authorId } = req.body;

    if (!content || !authorId) {
      return res.status(400).json({
        ok: false,
        message: "content and authorId are required"
      });
    }

    const workItem = await prisma.workItem.findUnique({
      where: { id }
    });

    if (!workItem) {
      return res.status(404).json({
        ok: false,
        message: "Work item not found"
      });
    }

    const author = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      return res.status(404).json({
        ok: false,
        message: "Author not found"
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        workItemId: id
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    await createHistoryEntry({
      workItemId: id,
      actionType: "COMMENT_ADDED",
      field: "comment",
      newValue: content,
      changedById: authorId
    });

    return res.status(201).json({
      ok: true,
      message: "Comment created successfully",
      data: comment
    });
  } catch (error) {
    console.error("Error creating comment:", error);

    return res.status(500).json({
      ok: false,
      message: "Error creating comment",
      error: error.message
    });
  }
};

const getCommentsByWorkItem = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        workItemId: id
      },
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
    });

    return res.status(200).json({
      ok: true,
      data: comments
    });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return res.status(500).json({
      ok: false,
      message: "Error fetching comments",
      error: error.message
    });
  }
};

module.exports = {
  createComment,
  getCommentsByWorkItem
};