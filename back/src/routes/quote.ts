import { Router } from "express";
import { getQuote } from "../controllers/quoteController";

const router = Router();

// Register the route for quote lookup
router.get("/:symbol", getQuote);

export default router;