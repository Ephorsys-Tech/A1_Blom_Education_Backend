import express from "express";
import morgan from "morgan";
import router from "./routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// ---------------------------------------------
// CORS (OPEN FOR ANY CLIENT: Web + App + Postman)
// ---------------------------------------------
app.use(
  cors({
    origin: true, // 🔥 allows all origins dynamically
    credentials: true, // cookies + auth support
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
// Routes
// ---------------------------------------------
app.use("/api/v1", router);

// ---------------------------------------------
// Export app
// ---------------------------------------------
export default app;
