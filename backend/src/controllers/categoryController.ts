// src/controllers/categoryController.ts
import { Request, Response } from "express";
import { db } from "../database/db";
import { productCategories } from "../models/product-categories";
import { products } from "../models/products";
import { eq } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await db.select().from(productCategories);
    return res.status(200).json(ok(categories, 'Categories fetched successfully', 200));
  } catch (err) {
    console.error("getCategories error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await db.select().from(productCategories).where(eq(productCategories.id, id)).limit(1);
    
    if (category.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Category not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    return res.status(200).json(ok(category[0], 'Category fetched successfully', 200));
  } catch (err) {
    console.error("getCategory error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      const err = makeApiError('BAD_REQUEST', 'Category name is required', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // Check if category with same name exists
    const existing = await db.select().from(productCategories).where(eq(productCategories.name, name)).limit(1);
    if (existing.length > 0) {
      const err = makeApiError('CONFLICT', 'Category with this name already exists', { status: 409 });
      return res.status(409).json(fail(err));
    }

    const inserted = await db.insert(productCategories).values({
      name,
      description: description || null,
    }).returning();

    return res.status(201).json(ok(inserted[0], 'Category created successfully', 201));
  } catch (err) {
    console.error("createCategory error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if category exists
    const existing = await db.select().from(productCategories).where(eq(productCategories.id, id)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Category not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    // If name is being updated, check for duplicates
    if (name && name !== existing[0].name) {
      const duplicate = await db.select().from(productCategories).where(eq(productCategories.name, name)).limit(1);
      if (duplicate.length > 0) {
        const err = makeApiError('CONFLICT', 'Category with this name already exists', { status: 409 });
        return res.status(409).json(fail(err));
      }
    }

    const updated = await db.update(productCategories)
      .set({
        name: name || existing[0].name,
        description: description !== undefined ? description : existing[0].description,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, id))
      .returning();

    return res.status(200).json(ok(updated[0], 'Category updated successfully', 200));
  } catch (err) {
    console.error("updateCategory error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existing = await db.select().from(productCategories).where(eq(productCategories.id, id)).limit(1);
    if (existing.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Category not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    // Check if category has products
    const categoryProducts = await db.select().from(products).where(eq(products.categoryId, id)).limit(1);
    if (categoryProducts.length > 0) {
      const err = makeApiError('BAD_REQUEST', 'Cannot delete category with existing products', { status: 400 });
      return res.status(400).json(fail(err));
    }

    await db.delete(productCategories).where(eq(productCategories.id, id));

    return res.status(200).json(ok(null, 'Category deleted successfully', 200));
  } catch (err) {
    console.error("deleteCategory error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const getCategoryProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await db.select().from(productCategories).where(eq(productCategories.id, id)).limit(1);
    if (category.length === 0) {
      const err = makeApiError('NOT_FOUND', 'Category not found', { status: 404 });
      return res.status(404).json(fail(err));
    }

    // Get products for this category
    const categoryProducts = await db.select().from(products).where(eq(products.categoryId, id));

    return res.status(200).json(ok(categoryProducts, 'Products fetched successfully', 200));
  } catch (err) {
    console.error("getCategoryProducts error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

