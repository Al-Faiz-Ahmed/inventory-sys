import { Request, Response } from "express";
import { db } from "../database/db";
import { sql } from "drizzle-orm";

export const clearAllData = async (_req: Request, res: Response) => {
  try {
    const tables = [
      "purchase_items",
      "purchases",
      "sale_items",
      "sales",
      "supplier_transactions",
      "suppliers",
      "customer_transactions",
      "customers",
      "expenses",
      "expense_categories",
      "products",
      "product_categories",
      "main_account",
      "main_inventory"
    ];

    const stmt = `TRUNCATE ${tables.map(t => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`;
    await db.execute(sql.raw(stmt));

    return res.status(200).json({ success: true, message: "All non-user data cleared" });
  } catch (err) {
    console.error("clearAllData error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
