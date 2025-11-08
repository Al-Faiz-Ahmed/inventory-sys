// src/routes/supplierTransactionRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { listSupplierTransactions, createSupplierTransaction, updateSupplierTransaction, deleteSupplierTransaction } from "../controllers/supplierTransactionController";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, listSupplierTransactions);
router.post("/", authenticate, createSupplierTransaction);
router.put("/:transactionId", authenticate, updateSupplierTransaction);
router.delete("/:transactionId", authenticate, deleteSupplierTransaction);

export default router;
