import { Router } from "express";
import db from "../db";
import z from "zod";

export const manageScheduleRouter = Router();

manageScheduleRouter.get("/get-schedule", (_, res) => {
  const matches = db.prepare("SELECT * FROM matches").all();

  return res.status(200).json({
    matches
  });
}); // works

manageScheduleRouter.post("/delete-match", async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.body);

  db.prepare("DELETE FROM matches WHERE id = ?").run(id);

  return res.status(200).json({
    message: "Match deleted successfully."
  });
}); // works

manageScheduleRouter.post("/delete-matches", async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string().min(1)) }).parse(req.body);

  const trx = db.transaction(() => {
    for (const id of ids) {
      db.prepare("DELETE FROM matches WHERE id = ?").run(id);
    }
  });

  trx();

  return res.status(200).json({
    message: "Matches deleted successfully."
  });
}); // works

