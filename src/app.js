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

// Import rate limiter

// ---------------------------------------------
// API Routes (Protected by global rate limiter)
// ---------------------------------------------
app.use("/api/v1", router);

// ---------------------------------------------
// Global Error Handler
// ---------------------------------------------
app.use(globalErrorHandler);

export default app;
