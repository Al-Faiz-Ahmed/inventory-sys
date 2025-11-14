// src/routes/customerTransactionRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { listCustomerTransactions, createCustomerTransaction, updateCustomerTransaction, deleteCustomerTransaction } from "../controllers/customerTransactionController";

const router = express.Router({ mergeParams: true });

router.get("/", authenticate, listCustomerTransactions);
router.post("/", authenticate, createCustomerTransaction);
router.put("/:transactionId", authenticate, updateCustomerTransaction);
router.delete("/:transactionId", authenticate, deleteCustomerTransaction);

export default router;
