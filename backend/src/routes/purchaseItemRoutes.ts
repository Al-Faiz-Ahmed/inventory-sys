// src/routes/purchaseItemRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { listPurchaseItems, createPurchaseItem, updatePurchaseItem, deletePurchaseItem } from "../controllers/purchaseItemController";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, listPurchaseItems);
router.post("/", authenticate, createPurchaseItem);
router.put("/:itemId", authenticate, updatePurchaseItem);
router.delete("/:itemId", authenticate, deletePurchaseItem);

export default router;
