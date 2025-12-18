import { Router } from "express";
import db from "../db";
import { adminMiddleware, userMiddleware } from "../middlewares/auth";
import z from "zod";

export const liveTvRouter = Router();

liveTvRouter.get("/get-channels", userMiddleware, (_, res) => {
  const channels = db.prepare("SELECT * FROM livetv_channels WHERE user_id = ?").all(res.locals.user.id);

  return res.status(200).json({
    channels
  });
}); // works

liveTvRouter.get("/admin/get-channels", adminMiddleware, (_, res) => {
  const channels = db.prepare("SELECT * FROM livetv_channels").all();

  return res.status(200).json({
    channels
  });
}); // works

liveTvRouter.post("/delete-channel", userMiddleware, (req, res) => {
  const { id } = z.object({
    id: z.string().min(1),
  }).parse(req.body);

  db.prepare("DELETE FROM livetv_channels WHERE id = ? AND user_id = ?").run(id, res.locals.user.id);

  return res.status(200).json({
    message: "Channel deleted successfully."
  });
}); // works

liveTvRouter.post("/admin/delete-channel", adminMiddleware, (req, res) => {
  const { id } = z.object({
    id: z.string().min(1),
  }).parse(req.body);

  db.prepare("DELETE FROM livetv_channels WHERE id = ?").run(id);

  return res.status(200).json({
    message: "Channel deleted successfully."
  });
}); // works
