// src/routes/customerRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "../controllers/customerController";
import customerTransactionRoutes from "./customerTransactionRoutes";

const router = express.Router();

router.get("/", authenticate, getCustomers);
router.get("/:id", authenticate, getCustomer);
router.post("/", authenticate, createCustomer);
router.put("/:id", authenticate, updateCustomer);
router.delete("/:id", authenticate, deleteCustomer);

router.use("/:customerId/transactions", customerTransactionRoutes);

export default router;
