// src/routes/supplierRoutes.ts
import express from "express";
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController";
import { authenticate } from "../middleware/authMiddleware";
import supplierTransactionRoutes from "./supplierTransactionRoutes";

const router = express.Router();

router.get("/", authenticate, getSuppliers);
router.get("/:id", authenticate, getSupplier);
router.post("/", authenticate, createSupplier);
router.put("/:id", authenticate, updateSupplier);
router.delete("/:id", authenticate, deleteSupplier);

// nested routes for supplier transactions
router.use("/:supplierId/transactions", supplierTransactionRoutes);

export default router;

