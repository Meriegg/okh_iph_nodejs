import express from 'express'
import bodyParser from 'body-parser'
import './db/migrate';
import cors from 'cors'
import db from './db/index'
import cookieParser from 'cookie-parser';
import { config } from 'dotenv'
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { adminMiddleware, userMiddleware } from './middlewares/auth';
import multer from 'multer';
import path from 'path';
import { manageUsersRouter } from './routers/manage-users';
import { manageWebsiteRouter } from './routers/manage-website';
import { liveTvRouter } from './routers/manage-livetv';
import z from 'zod';
import { randomUUID } from 'crypto';
config();

const fileStorage = multer.diskStorage({
  destination: path.resolve("/var/www/okimages"),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${file.fieldname}-${file.originalname.replace(ext, "")}${ext}`;
    cb(null, name);
  }
})

export const upload = multer({ storage: fileStorage });

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_, res) => {
  // const info = db.prepare("DELETE FROM users WHERE email = 'sugguspullus@gmail.com';").run();
  const info = db.prepare("SELECT * FROM users").all();
  // const info = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../website-config.json'), "utf8"))

  res.json({ info });
});

app.post("/api/user/change-profile-picture", userMiddleware, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "You need to upload a picture."
    });
  }

  db.prepare("UPDATE users SET profile_picture = ? WHERE id = ?").run(req.file.filename, res.locals.user.id);

  return res.status(200).json({
    message: "Profile picture changed successfully."
  })
}); // works

app.post("/api/manage-livetv/add-channel", userMiddleware, upload.single("image"), (req, res) => {
  try {
    if (res.locals.user.permission_liveTvSubmission === 0) {
      return res.status(401).json({
        message: "You do not have permission for LiveTV."
      });
    };

    if (!req?.file) {
      return res.status(400).json({
        message: "You need to upload a picture (channel image)."
      });
    }

    const { channelName, language, linksJson } = z.object({
      channelName: z.string().min(1),
      language: z.string().min(1),
      linksJson: z.string().min(1),
    }).parse(req.body);

    db.prepare("INSERT INTO livetv_channels (id, channel_name, language, links_json, channel_image, user_id) VALUES (?, ?, ?, ?, ?, ?)").run(
      randomUUID(),
      channelName,
      language,
      linksJson,
      req.file.filename,
      res.locals.user.id
    );

    return res.status(200).json({
      message: "Channel added successfully."
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
}); // works

app.post("/api/manage-livetv/edit-channel", userMiddleware, upload.single("image"), (req, res) => {
  try {
    if (res.locals.user.permission_liveTvSubmission === 0) {
      return res.status(401).json({
        message: "You do not have permission for LiveTV."
      });
    };

    if (!req?.file) {
      return res.status(400).json({
        message: "You need to upload a picture (channel image)."
      });
    }

    const { channelName, language, linksJson, id } = z.object({
      channelName: z.string().min(1),
      language: z.string().min(1),
      linksJson: z.string().min(1),
      id: z.string().min(1),
    }).parse(req.body);

    db.prepare("UPDATE livetv_channels SET channel_name = ?, language = ?, links_json = ?, channel_image = ? WHERE id = ? AND user_id = ?").run(
      channelName,
      language,
      linksJson,
      req.file.filename,
      id,
      res.locals.user.id
    );

    return res.status(200).json({
      message: "Channel updated successfully."
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

app.use("/api/user", userMiddleware, userRouter);
app.use("/api/admin", adminMiddleware, userRouter);
app.use("/api/auth", authRouter);

// management
app.use("/api/manage-users", manageUsersRouter);
app.use("/api/manage-website", adminMiddleware, manageWebsiteRouter)
app.use("/api/manage-livetv", liveTvRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} | dev: http://localhost:${PORT}`);
})
