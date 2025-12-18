import { Router } from "express";
import db from "../db";
import z from "zod";
import * as argon2 from 'argon2';
import { randomUUID } from "node:crypto";

export const userRouter = Router();

userRouter.get("/me", (_, res) => {
  return res.json({ session: res.locals.session, user: res.locals.user });
});

userRouter.post("/log-out", async (_, res) => {
  db.prepare("DELETE FROM user_sessions WHERE id = ?").run(res.locals.session?.id);

  res.clearCookie("session_token");

  return res.status(200).json({ message: "Logged out successfully." });
});

userRouter.post("/change-password", async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = z.object({
      oldPassword: z.string(),
      newPassword: z.string().min(6),
      confirmNewPassword: z.string().min(6)
    }).parse(req.body);

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: "Passwords do not match."
      })
    }

    if (newPassword === oldPassword) {
      return res.status(400).json({
        message: "New password must not be equal to the old password."
      })
    }

    const isOldPasswordCorrect = await argon2.verify(res.locals.user.password, oldPassword, {
      secret: Buffer.from(process.env.AUTH_SECRET!, 'base64'),
    });
    if (!isOldPasswordCorrect) {
      return res.status(401).json({
        message: "Old password is incorrect.",
        formErrors: [
          {
            field: "oldPassword",
            message: "Old password is incorrect.",
          }
        ]
      })
    }

    const hashedNewPassword = await argon2.hash(newPassword, {
      secret: Buffer.from(process.env.AUTH_SECRET!, 'base64'),
      salt: Buffer.from(randomUUID().replace(/-/g, ''), 'hex'),
    });

    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedNewPassword, res.locals.user.id);

    return res.status(200).json({
      message: "Password changed successfully."
    })
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
})

