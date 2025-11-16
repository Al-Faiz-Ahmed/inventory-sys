// src/routes/supplierTransactionRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { listSupplierTransactions, createSupplierTransaction, updateSupplierTransaction, deleteSupplierTransaction, exportSupplierTransactionsCSV, exportSupplierTransactionsPDF } from "../controllers/supplierTransactionController";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, listSupplierTransactions);
router.post("/", authenticate, createSupplierTransaction);
router.put("/:transactionId", authenticate, updateSupplierTransaction);
router.delete("/:transactionId", authenticate, deleteSupplierTransaction);
router.get("/export/csv", authenticate, exportSupplierTransactionsCSV);
router.get("/export/pdf", authenticate, exportSupplierTransactionsPDF);

export default router;
