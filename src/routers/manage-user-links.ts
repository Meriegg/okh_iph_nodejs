import { Router } from "express";
import z from "zod";
import db from "../db";

export const manageUserLinksRouter = Router();

manageUserLinksRouter.get("/get-user-links", (_, res) => {
  const links = db.prepare("SELECT * FROM user_links").all();

  return res.status(200).json({
    links
  });
});

manageUserLinksRouter.get("/available-matches", (_, res) => {
  const matches = db.prepare("SELECT * FROM matches").all();

  return res.status(200).json({
    matches
  });
});

manageUserLinksRouter.post("/delete-link", async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.body);

  db.prepare("DELETE FROM user_links WHERE id = ?").run(id);

  return res.status(200).json({
    message: "Link deleted successfully. (admin)"
  })
});

manageUserLinksRouter.post("/delete-links", async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);

  const trx = db.transaction(() => {
    for (const id of ids) {
      db.prepare("DELETE FROM user_links WHERE id = ?").run(id);
    }
  });

  trx();

  return res.status(200).json({
    message: "Links deleted successfully. (admin)"
  });
});
