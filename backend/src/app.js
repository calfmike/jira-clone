const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const apiRoutes = require("./routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "API running"
  });
});

app.use("/api", apiRoutes);

module.exports = app;