// src/routes/saleItemRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { listSaleItems, createSaleItem, updateSaleItem, deleteSaleItem } from "../controllers/saleItemController";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, listSaleItems);
router.post("/", authenticate, createSaleItem);
router.put("/:itemId", authenticate, updateSaleItem);
router.delete("/:itemId", authenticate, deleteSaleItem);

export default router;
