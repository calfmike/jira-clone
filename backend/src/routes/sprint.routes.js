const express = require("express");
const sprintController = require("../controllers/sprint.controller");

const router = express.Router();

router.post("/", sprintController.createSprint);
router.get("/project/:projectId", sprintController.getSprintsByProject);

module.exports = router;