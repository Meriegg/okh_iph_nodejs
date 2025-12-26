import { Router } from "express";
import db from "../db";
import z from "zod";
import { randomUUID } from "crypto";

export const submitLinksRouter = Router();

submitLinksRouter.get("/available-matches", (_, res) => {
  if (!res.locals.user?.permission_linkSubmission) {
    return res.status(401).json({
      message: "You do not have permission for link submission."
    });
  }

  const matches = db.prepare("SELECT * FROM matches").all();

  return res.status(200).json({
    matches
  });
}); // works

submitLinksRouter.get("/get-user-links", (_, res) => {
  const links = db.prepare("SELECT * FROM user_links WHERE user_id = ?").all(res.locals.user.id);

  return res.status(200).json({
    links
  });
}); // works

submitLinksRouter.post("/submit-link", async (req, res) => {
  try {
    if (!res.locals.user?.permission_linkSubmission) {
      return res.status(401).json({
        message: "You do not have permission for link submission."
      });
    }

    const { matchId, name, link, type, country, language, adsNumber } = z.object({
      matchId: z.string().min(1),
      name: z.string().min(1),
      link: z.url().min(1),
      type: z.enum(["embed", "popup", "normal"]),
      country: z.string().min(1),
      language: z.string().min(1),
      adsNumber: z.number().optional(),
    }).parse(req.body);

    if (type === "popup" && !res.locals.user?.permission_popupSubmission) {
      return res.status(401).json({
        message: "You do not have permission for popup submission."
      });
    };

    if (type === "embed" && !res.locals.user?.permission_embedSubmission) {
      return res.status(401).json({
        message: "You do not have permission for embed submission."
      });
    };

    db.prepare("INSERT INTO user_links (id, user_id, match_id, name, link, type, country, language, adsNumber, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      randomUUID(),
      res.locals.user.id,
      matchId,
      name,
      link,
      type,
      country,
      language,
      adsNumber,
      new Date().getTime(),
      null
    );

    return res.status(200).json({
      message: "Link submitted successfully."
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
}); // works

submitLinksRouter.post("/update-link", async (req, res) => {
  if (!res.locals.user?.permission_linkSubmission) {
    return res.status(401).json({
      message: "You do not have permission for link submission."
    });
  }

  const { id, name, link, type, country, language, adsNumber, matchId } = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    link: z.string().min(1),
    type: z.enum(["embed", "popup", "normal"]),
    country: z.string().min(1),
    language: z.string().min(1),
    adsNumber: z.number().optional(),
    matchId: z.string().min(1),
  }).parse(req.body);

  if (type === "popup" && !res.locals.user?.permission_popupSubmission) {
    return res.status(401).json({
      message: "You do not have permission for popup submission."
    });
  };

  if (type === "embed" && !res.locals.user?.permission_embedSubmission) {
    return res.status(401).json({
      message: "You do not have permission for embed submission."
    });
  };

  db.prepare("UPDATE user_links SET match_id = ?, name = ?, link = ?, type = ?, country = ?, language = ?, adsNumber = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(
    matchId,
    name,
    link,
    type,
    country,
    language,
    adsNumber,
    new Date().getTime(),
    id,
    res.locals.user.id
  );

  return res.status(200).json({
    message: "Link updated successfully."
  })
}); // works

submitLinksRouter.post("/delete-link", async (req, res) => {
  if (!res.locals.user?.permission_linkSubmission) {
    return res.status(401).json({
      message: "You do not have permission for link submission."
    });
  }

  const { id } = z.object({ id: z.string().min(1) }).parse(req.body);

  db.prepare("DELETE FROM user_links WHERE id = ? AND user_id = ?").run(id, res.locals.user.id);

  return res.status(200).json({
    message: "Link deleted successfully."
  })
}); // works

submitLinksRouter.post("/delete-links", async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string().min(1)) }).parse(req.body);

  const trx = db.transaction(() => {
    for (const id of ids) {
      db.prepare("DELETE FROM user_links WHERE id = ? AND user_id = ?").run(id, res.locals.user.id);
    }
  });

  trx();

  return res.status(200).json({
    message: "Links deleted successfully."
  })
}); // works
