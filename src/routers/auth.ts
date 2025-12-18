import { Router } from "express";
import * as argon2 from 'argon2';
import z from 'zod';
import db from "../db";
import { randomUUID } from "crypto";
import { TUser } from "../types";
import { createSession } from "../utils/auth/create-session";

export const authRouter = Router();

authRouter.post("/sign-up", async (req, res) => {
  try {
    const { username, email, password } = z.object({
      username: z.string().min(3),
      email: z.email(),
      password: z.string().min(6),
    }).parse(req.body);

    const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    };

    const stmt = db.prepare("INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)");

    const hashedPassword = await argon2.hash(password, {
      secret: Buffer.from(process.env.AUTH_SECRET!, 'base64'),
      salt: Buffer.from(randomUUID().replace(/-/g, ''), 'hex'),
    });
    const userId = randomUUID();
    stmt.run(userId, username, email, hashedPassword);

    const session = await createSession({ userId: userId });

    res.cookie("session_token", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000 * 24 * 30,
    });

    return res.status(201).json({ message: "User created successfully, you can log in now." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.issues.map(e => `${e.path}: ${e.message}`).join(", "),
        formErrors: error.issues.map(e => ({
          field: e.path?.[0],
          message: e.message
        })),
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({ message: error?.message ?? "Unable to sign up, please try again later." });
    }

    return res.status(500).json({ message: "Unable to sign up, please try again later." });
  }
});

authRouter.post("/log-in", async (req, res) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }).parse(req.body);

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as TUser;
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!!user.banned) {
      return res.status(401).json({
        message: "You are banned."
      });
    }

    const validPassword = await argon2.verify(user.password, password, {
      secret: Buffer.from(process.env.AUTH_SECRET!, 'base64'),
    });
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const session = await createSession({ userId: user.id });

    res.cookie("session_token", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000 * 24 * 30,
    });

    return res.status(200).json({
      message: "Logged in successfully.",
      token: session.sessionToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.issues.map(e => `${e.path}: ${e.message}`).join(", "),
        formErrors: error.issues.map(e => ({
          field: e.path?.[0],
          message: e.message
        })),
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({ message: error?.message ?? "Unable to log in, please try again later." });
    }

    return res.status(500).json({ message: "Unable to log in, please try again later." });
  }
});


