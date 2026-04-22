const express = require("express");
const historyController = require("../controllers/history.controller");

const router = express.Router();

router.get("/work-items/:id/history", historyController.getHistoryByWorkItem);

module.exports = router;