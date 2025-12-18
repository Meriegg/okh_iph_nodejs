import { NextFunction, Request, Response } from "express";
import db from "../db";
import { verifySessionToken } from "../utils/auth/verify-session-token";
import { TUser } from "../types";
import { UserRoles } from "../constants";

export const userMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sessionToken = req.cookies['session_token'];
  if (!sessionToken) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const session = await verifySessionToken(sessionToken);
  if (session.error || !session?.session) {
    return res.status(401).json({ message: session?.message ?? "Unauthorized." });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.session.user_id) as TUser;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!!user.banned) {
    return res.status(401).json({
      message: "You are banned."
    })
  }

  res.locals.session = session.session;
  res.locals.user = user;

  return next();
}

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sessionToken = req.cookies['session_token'];
  if (!sessionToken) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const session = await verifySessionToken(sessionToken);
  if (session.error || !session?.session) {
    return res.status(401).json({ message: session?.message ?? "Unauthorized." });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.session.user_id) as TUser;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!!user.banned) {
    return res.status(401).json({
      message: "You are banned."
    })
  }

  if (user?.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden." });
  }

  res.locals.session = session.session;
  res.locals.user = user;

  return next();
}

export const moderatorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sessionToken = req.cookies['session_token'];
  if (!sessionToken) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const session = await verifySessionToken(sessionToken);
  if (session.error || !session?.session) {
    return res.status(401).json({ message: session?.message ?? "Unauthorized." });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.session.user_id) as TUser;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  if (!!user.banned) {
    return res.status(401).json({
      message: "You are banned."
    })
  }

  if (UserRoles.indexOf(user.role) < UserRoles.indexOf("moderator")) {
    return res.status(403).json({ message: "Forbidden." });
  }

  res.locals.session = session.session;
  res.locals.user = user;

  return next();
}