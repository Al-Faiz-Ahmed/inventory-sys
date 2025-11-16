// src/routes/mainInventoryRoutes.ts
import { Router } from "express";
import {
  getMainInventoryTransactions,
  getMainInventoryTransaction,
  getMainInventoryTransactionsByProduct,
  exportMainInventoryPDF,
} from "../controllers/mainInventoryController";

const router = Router();

// GET /api/main-inventory - Get all main inventory transactions with filters
router.get("/", getMainInventoryTransactions);

// GET /api/main-inventory/:id - Get a specific main inventory transaction
router.get("/:id", getMainInventoryTransaction);

// GET /api/main-inventory/product/:productId - Get all transactions for a specific product
router.get("/product/:productId", getMainInventoryTransactionsByProduct);

// POST /api/main-inventory/reports/main-inventory/pdf - Export main inventory transactions to PDF
router.post("/reports/main-inventory/pdf", exportMainInventoryPDF);

export default router;
