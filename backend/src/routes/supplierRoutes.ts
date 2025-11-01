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

const router = express.Router();

router.get("/", authenticate, getSuppliers);
router.get("/:id", authenticate, getSupplier);
router.post("/", authenticate, createSupplier);
router.put("/:id", authenticate, updateSupplier);
router.delete("/:id", authenticate, deleteSupplier);

export default router;

