import express from "express";
import cors from "cors";
import quoteRouter from "./src/routes/quote";
import sp500Router from "./src/routes/sp500";

/**
 * The main entry point of the backend application.
 *
 * Sets up middleware and registers route handlers. All business logic
 * is encapsulated in controller and service modules under src/ so
 * that this file remains concise and focused on wiring. To change
 * behaviour, modify the corresponding controller or service.
 */
const app = express();
app.use(cors());

// Mount API routes. Each router handles its own path prefix.
app.use("/api/quote", quoteRouter);
app.use("/api/sp500-data", sp500Router);

// Start the server on the specified port (default 4000)
const PORT = process.env.PORT || 4000;
app.listen(Number(PORT), () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
