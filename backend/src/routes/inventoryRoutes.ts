// src/routes/inventoryRoutes.ts
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/inventoryController";

const router = express.Router();

router.get("/", authenticate, getProducts);
router.get("/:id", authenticate, getProduct);
router.post("/", authenticate, createProduct);
router.put("/:id", authenticate, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

export default router;
