import express from "express";
import morgan from "morgan";
import router from "./routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";

const app = express();

// ---------------------------------------------
// CORS
// ---------------------------------------------
// ---------------------------------------------
// CORS
// ---------------------------------------------
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
    credentials: true,
  }),
);

// ---------------------------------------------
// Middleware
// ---------------------------------------------
app.use(express.json({ limit: "20mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  }),
);

app.use(cookieParser());
app.use(morgan("dev"));

// ---------------------------------------------
// Test Route
// ---------------------------------------------
app.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is working successfully 🚀",
    timestamp: new Date(),
  });
});

// ---------------------------------------------
// API Routes
// ---------------------------------------------
app.use("/api/v1", router);

// ---------------------------------------------
// Global Error Handler
// ---------------------------------------------
app.use(globalErrorHandler);

export default app;
