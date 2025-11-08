// src/routes/purchaseRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { getPurchases, getPurchase, createPurchase, updatePurchase, deletePurchase } from "../controllers/purchaseController";
import purchaseItemRoutes from "./purchaseItemRoutes";

const router = express.Router();

router.get("/", authenticate, getPurchases);
router.get("/:id", authenticate, getPurchase);
router.post("/", authenticate, createPurchase);
router.put("/:id", authenticate, updatePurchase);
router.delete("/:id", authenticate, deletePurchase);

// nested routes for items
router.use("/:purchaseId/items", purchaseItemRoutes);

export default router;
