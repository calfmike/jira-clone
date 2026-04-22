const express = require("express");

const userRoutes = require("./user.routes");
const projectRoutes = require("./project.routes");
const sprintRoutes = require("./sprint.routes");
const workItemRoutes = require("./work-item.routes");
const boardRoutes = require("./board.routes");
const commentRoutes = require("./comment.routes");
const historyRoutes = require("./history.routes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/sprints", sprintRoutes);
router.use("/work-items", workItemRoutes);
router.use("/boards", boardRoutes);
router.use("/", commentRoutes);
router.use("/", historyRoutes);

module.exports = router;