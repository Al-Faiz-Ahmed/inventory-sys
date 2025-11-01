// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../database/db";
import { users } from "../models/user";
import { eq } from "drizzle-orm";
import { ok, fail, makeApiError } from "../../../shared/error";

const JWT_SECRET: string = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      const err = makeApiError('BAD_REQUEST', 'email and password are required', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // check existing user
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      const err = makeApiError('CONFLICT', 'Email already in use', { status: 409 });
      return res.status(409).json(fail(err));
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // insert user and return inserted row (id, email, name)
    const inserted = await db.insert(users).values({
      name: name ?? "",
      email,
      password: hashed,
    }).returning();

    const created = inserted[0];

    const payload = { id: created.id, email: created.email, name: created.name };
    return res.status(201).json(ok(payload, 'User created', 201));
  } catch (err) {
    console.error("signup error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = makeApiError('BAD_REQUEST', 'email and password are required', { status: 400 });
      return res.status(400).json(fail(err));
    }

    // fetch user
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user) {
      const err = makeApiError('UNAUTHORIZED', 'Invalid credentials', { status: 401 });
      return res.status(401).json(fail(err));
    }

    // check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const err = makeApiError('UNAUTHORIZED', 'Invalid credentials', { status: 401 });
      return res.status(401).json(fail(err));
    }

    // sign JWT
    const jwtPayload = { sub: user.id, email: user.email };
    const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    const responsePayload = {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
    return res.status(200).json(ok(responsePayload, 'Login successful', 200));
  } catch (err) {
    console.error("login error:", err);
    const apiErr = makeApiError('INTERNAL_SERVER_ERROR', 'Server error', { status: 500 });
    return res.status(500).json(fail(apiErr));
  }
};
