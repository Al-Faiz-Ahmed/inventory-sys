import express from "express";
import { clearAllData } from "../controllers/maintenanceController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/clear", authenticate, clearAllData);

export default router;
