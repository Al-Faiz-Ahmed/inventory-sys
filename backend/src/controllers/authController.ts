// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../database/db";
import { users } from "../models/user";
import { eq } from "drizzle-orm";

const JWT_SECRET: string = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    // check existing user
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) return res.status(409).json({ message: "Email already in use" });

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // insert user and return inserted row (id, email, name)
    const inserted = await db.insert(users).values({
      name: name ?? "",
      email,
      password: hashed,
    }).returning();

    const created = inserted[0];

    return res.status(201).json({
      message: "User created",
      user: { id: created.id, email: created.email, name: created.name },
    });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    // fetch user
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // sign JWT
    const payload = { sub: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
