import { Router } from "express";
import { getSP500Data } from "../controllers/sp500Controller";

const router = Router();

// Register the route for S&P500 data
router.get("/", getSP500Data);

export default router;