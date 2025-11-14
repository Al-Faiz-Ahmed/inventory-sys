// src/routes/salesRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { getSales, getSale, createSale, updateSale, deleteSale } from "../controllers/salesController";
import saleItemRoutes from "./saleItemRoutes";

const router = express.Router();

router.get("/", authenticate, getSales);
router.get("/:id", authenticate, getSale);
router.post("/", authenticate, createSale);
router.put("/:id", authenticate, updateSale);
router.delete("/:id", authenticate, deleteSale);

// nested routes for items
router.use("/:saleId/items", saleItemRoutes);

export default router;
