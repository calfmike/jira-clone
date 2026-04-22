const express = require("express");
const commentController = require("../controllers/comment.controller");

const router = express.Router();

router.post("/work-items/:id/comments", commentController.createComment);
router.get("/work-items/:id/comments", commentController.getCommentsByWorkItem);

module.exports = router;