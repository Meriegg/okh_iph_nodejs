import { Router } from "express";
import { adminMiddleware, moderatorMiddleware } from "../middlewares/auth";
import z from "zod";
import db from "../db";
import { TUser } from "../types";

export const manageUsersRouter = Router();

manageUsersRouter.get("/get-users", moderatorMiddleware, (_, res) => {
  const users = db.prepare("SELECT * FROM users").all();

  return res.status(200).json({
    users
  });
}); // works

manageUsersRouter.post("/delete-user", adminMiddleware, (req, res) => {
  const { userId } = z.object({
    userId: z.string(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(userId);

  return res.status(200).json({
    message: "User deleted successfully."
  });
}); // works

manageUsersRouter.post("/set-role", adminMiddleware, (req, res) => {
  const { userId, role } = z.object({
    userId: z.string(),
    role: z.enum(['admin', 'moderator', 'user']),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);

  return res.status(200).json({
    message: "Role set successfully."
  })
}); // works

manageUsersRouter.post("/set-label", moderatorMiddleware, (req, res) => {
  const { userId, label } = z.object({
    userId: z.string(),
    label: z.enum(['diamond', 'gold', 'silver', '-no_label-']),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  db.prepare("UPDATE users SET label = ? WHERE id = ?").run(label === '-no_label-' ? null : label, userId);

  return res.status(200).json({
    message: "Role set successfully."
  })
}); // works

manageUsersRouter.post("/set-link-order", moderatorMiddleware, (req, res) => {
  const { userId, order } = z.object({
    userId: z.string(),
    order: z.number(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  const prevOrderUser = db.prepare("SELECT * FROM users WHERE linkOrder = ?").get(order) as TUser;
  const currUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as TUser;

  if (!!prevOrderUser) {
    db.prepare("UPDATE users SET linkOrder = ? WHERE id = ?").run(currUser.linkOrder, prevOrderUser.id);
  }

  db.prepare("UPDATE users SET linkOrder = ? WHERE id = ?").run(order, userId);

  return res.status(200).json({
    message: "Role set successfully."
  })
}); // works

manageUsersRouter.post("/set-embed-order", moderatorMiddleware, (req, res) => {
  const { userId, order } = z.object({
    userId: z.string(),
    order: z.number(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  const prevOrderUser = db.prepare("SELECT * FROM users WHERE embedOrder = ?").get(order) as TUser;
  const currUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as TUser;

  if (!!prevOrderUser) {
    db.prepare("UPDATE users SET embedOrder = ? WHERE id = ?").run(currUser.embedOrder, prevOrderUser.id);
  }

  db.prepare("UPDATE users SET embedOrder = ? WHERE id = ?").run(order, userId);

  return res.status(200).json({
    message: "Role set successfully."
  })
}); // works

manageUsersRouter.post("/toggle-verified", adminMiddleware, (req, res) => {
  const { userId } = z.object({
    userId: z.string(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as TUser;
  if (!dbUser) {
    return res.status(404).json({
      message: "This user does not exist anymore."
    })
  }

  db.prepare("UPDATE users SET verified = ? WHERE id = ?").run(!(!!dbUser.verified) ? 1 : 0, userId);

  return res.status(200).json({
    message: "Verified status changed successfully."
  })
}); // works

manageUsersRouter.post("/toggle-post-permission", adminMiddleware, (req, res) => {
  const { userId } = z.object({
    userId: z.string(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as TUser;
  if (!dbUser) {
    return res.status(404).json({
      message: "This user does not exist anymore."
    })
  }

  db.prepare("UPDATE users SET permission_linkSubmission = ? WHERE id = ?").run(!(!!dbUser.permission_linkSubmission) ? 1 : 0, userId);

  return res.status(200).json({
    message: "Post permission changed successfully."
  });
}); // works

manageUsersRouter.post("/toggle-embed-submission", adminMiddleware, (req, res) => {
  const { userId } = z.object({
    userId: z.string(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as TUser;
  if (!dbUser) {
    return res.status(404).json({
      message: "This user does not exist anymore."
    })
  }

  if (!(!!dbUser.permission_linkSubmission)) {
    return res.status(400).json({
      message: "Enable base link submission permission for this user first."
    })
  }

  db.prepare("UPDATE users SET permission_embedSubmission = ? WHERE id = ?").run(!(!!dbUser.permission_embedSubmission) ? 1 : 0, userId);

  return res.status(200).json({
    message: "Post embed permission changed successfully."
  });
}); // works

manageUsersRouter.post("/toggle-popup-submission", adminMiddleware, (req, res) => {
  const { userId } = z.object({
    userId: z.string(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as TUser;
  if (!dbUser) {
    return res.status(404).json({
      message: "This user does not exist anymore."
    })
  }

  if (!(!!dbUser.permission_linkSubmission)) {
    return res.status(400).json({
      message: "Enable base link submission permission for this user first."
    })
  }

  db.prepare("UPDATE users SET permission_popupSubmission = ? WHERE id = ?").run(!(!!dbUser.permission_popupSubmission) ? 1 : 0, userId);

  return res.status(200).json({
    message: "Post popup permission changed successfully."
  });
}); // works

manageUsersRouter.post("/toggle-banned", moderatorMiddleware, (req, res) => {
  const { userId } = z.object({
    userId: z.string(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as TUser;
  if (dbUser.role === 'admin' && res.locals.user.role === 'moderator') {
    return res.status(401).json({
      message: "Unable to ban an admin if you are a moderator."
    });
  }

  if (!dbUser) {
    return res.status(404).json({
      message: "This user does not exist anymore."
    })
  }

  db.prepare("UPDATE users SET banned = ? WHERE id = ?").run(!(!!dbUser.banned) ? 1 : 0, userId);

  return res.status(200).json({
    message: "Ban status changed successfully."
  });
}); // works

manageUsersRouter.post("/toggle-livetv-submission", adminMiddleware, (req, res) => {
  const { userId } = z.object({
    userId: z.string(),
  }).parse(req.body);
  if (userId === res.locals.user.id) {
    return res.status(400).json({
      message: "Unable to change your own data."
    })
  }

  const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as TUser;
  if (!dbUser) {
    return res.status(404).json({
      message: "This user does not exist anymore."
    })
  }

  db.prepare("UPDATE users SET permission_liveTvSubmission = ? WHERE id = ?").run(!(!!dbUser.permission_liveTvSubmission) ? 1 : 0, userId);

  return res.status(200).json({
    message: "LiveTV permission changed successfully."
  });
});
