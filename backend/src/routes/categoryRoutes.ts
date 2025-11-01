// src/routes/categoryRoutes.ts
import express from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts,
} from "../controllers/categoryController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authenticate, getCategories);
router.get("/:id", authenticate, getCategory);
router.post("/", authenticate, createCategory);
router.put("/:id", authenticate, updateCategory);
router.delete("/:id", authenticate, deleteCategory);
router.get("/:id/products", authenticate, getCategoryProducts);

export default router;

