const express = require("express");
const projectController = require("../controllers/project.controller");
const workItemController = require("../controllers/work-item.controller");

const router = express.Router();

router.get("/", projectController.getProjects);
router.post("/", projectController.createProject);
router.get("/:projectId/work-items", workItemController.getWorkItemsByProject);

module.exports = router;