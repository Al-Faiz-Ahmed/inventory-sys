import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import supplierRoutes from "./routes/supplierRoutes";
import purchaseRoutes from "./routes/purchaseRoutes";
import mainAccountRoutes from "./routes/mainAccountRoutes";
import { authenticate } from "./middleware/authMiddleware";
import expenseCategoryRoutes from "./routes/expenseCategoryRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import customerRoutes from "./routes/customerRoutes";
import salesRoutes from "./routes/salesRoutes";
import maintenanceRoutes from "./routes/maintenanceRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/main-account", mainAccountRoutes);
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// Basic root route
app.get("/", (_req, res) => {
  res.status(200).json({ message: "Inventory API is running" });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;
