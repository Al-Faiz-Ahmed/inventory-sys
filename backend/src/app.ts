import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Basic root route
app.get("/", (_req, res) => {
	res.status(200).json({ message: "Inventory API is running" });
});

// Health check route
app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;
