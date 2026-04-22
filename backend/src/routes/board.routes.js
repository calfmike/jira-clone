const express = require("express");
const boardController = require("../controllers/board.controller");

const router = express.Router();

router.get("/project/:projectId", boardController.getProjectBoard);
router.get("/sprint/:sprintId", boardController.getSprintBoard);
router.patch("/work-items/:id/move", boardController.moveBoardItem);

module.exports = router;