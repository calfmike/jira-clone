const express = require("express");
const workItemController = require("../controllers/work-item.controller");

const router = express.Router();

router.post("/", workItemController.createWorkItem);
router.get("/:id", workItemController.getWorkItemById);
router.patch("/:id/status", workItemController.updateWorkItemStatus);
router.patch("/:id/assign", workItemController.assignWorkItem);

module.exports = router;