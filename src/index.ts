import express from 'express'
import bodyParser from 'body-parser'
import './db/migrate';
import cors from 'cors'
import fs from 'fs';
import db from './db/index'
import cookieParser from 'cookie-parser';
import { config } from 'dotenv'
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { adminMiddleware, moderatorMiddleware, userMiddleware } from './middlewares/auth';
import multer from 'multer';
import path from 'path';
import { manageUsersRouter } from './routers/manage-users';
import { manageWebsiteRouter } from './routers/manage-website';
import { liveTvRouter } from './routers/manage-livetv';
import z from 'zod';
import { randomUUID } from 'crypto';
import { scrapingRouter } from './routers/scraping';
import { isProcessAlive } from './utils/is-process-alive';
import { manageScheduleRouter } from './routers/manage-schedule';
import { TMatch } from './types';
import { toUtcTimestamp } from './utils/generate-utc-timestamp';
import slugify from 'slugify';
import { submitLinksRouter } from './routers/submit-links';
import { manageUserLinksRouter } from './routers/manage-user-links';
const shortUUID = require('short-uuid');
config();

const scraperStatusPath = path.resolve(process.cwd(), "scraping-status.json");

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

app.get("/api/admin-notice", (_, res) => {
  const websiteConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'website-config.json'), "utf8"))

  res.json({ notice: websiteConfig.adminNotice ?? "" });
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

    const { channelName, language, linksJson, id } = z.object({
      channelName: z.string().min(1),
      language: z.string().min(1),
      linksJson: z.string().min(1),
      id: z.string().min(1),
    }).parse(req.body);

    if (!!req?.file) {
      db.prepare("UPDATE livetv_channels SET channel_name = ?, language = ?, links_json = ?, channel_image = ? WHERE id = ? AND user_id = ?").run(
        channelName,
        language,
        linksJson,
        req.file.filename,
        id,
        res.locals.user.id
      );
    } else {
      db.prepare("UPDATE livetv_channels SET channel_name = ?, language = ?, links_json = ? WHERE id = ? AND user_id = ?").run(
        channelName,
        language,
        linksJson,
        id,
        res.locals.user.id
      );
    }

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
}); // works

app.post("/api/manage-livetv/admin/edit-channel", adminMiddleware, upload.single("image"), (req, res) => {
  try {
    const { channelName, language, linksJson, id } = z.object({
      channelName: z.string().min(1),
      language: z.string().min(1),
      linksJson: z.string().min(1),
      id: z.string().min(1),
    }).parse(req.body);

    if (!!req?.file) {
      db.prepare("UPDATE livetv_channels SET channel_name = ?, language = ?, links_json = ?, channel_image = ? WHERE id = ?").run(
        channelName,
        language,
        linksJson,
        req.file.filename,
        id,
      );
    } else {
      db.prepare("UPDATE livetv_channels SET channel_name = ?, language = ?, links_json = ? WHERE id = ?").run(
        channelName,
        language,
        linksJson,
        id,
      );
    }

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
}); // works

app.post("/api/manage-schedule/create-match", adminMiddleware, upload.fields([
  { name: "league_image", maxCount: 1 },
  { name: "team1_image", maxCount: 1 },
  { name: "team2_image", maxCount: 1 },
]), (req, res) => {
  try {
    const { league, league_country, sport, team1, team2, venue, date, time, localTimezoneOffset, external_id, duration: bodyDuration } = z.object({
      sport: z.string().min(1),
      league: z.string().min(1),
      league_country: z.string().min(1),
      team1: z.string().min(1),
      team2: z.string().optional().nullish(),
      venue: z.string().optional().nullish(),
      date: z.string().min(1),
      time: z.string().min(1),
      localTimezoneOffset: z.string(),
      external_id: z.string().optional().nullish(),
      duration: z.string(),
    }).parse(req.body);

    const tzOffset = Number(localTimezoneOffset);
    const duration = Number(bodyDuration);

    const files = req.files as { [field: string]: Express.Multer.File[] };
    const leagueImage = files?.['league_image']?.[0];
    const team1Image = files?.['team1_image']?.[0];
    const team2Image = files?.['team2_image']?.[0];

    if (!leagueImage || !team1Image) {
      return res.status(400).json({
        message: "You need to upload a picture."
      });
    }

    const timestamp = toUtcTimestamp(date, time, tzOffset);

    const slug = slugify(`${shortUUID.generate()}-${league}-${team1}${!!team2 ? `-${team2}` : ""}`)
    const leagueSlug = slugify(league.toLowerCase());
    const sportSlug = slugify(sport.toLowerCase());

    db.prepare("INSERT INTO matches (id, slug, league, league_slug, league_image, league_country, league_id, sport, sport_slug, team1, team1_image, team2, team2_image, venue, timestamp, duration, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      randomUUID(),
      slug,
      league,
      leagueSlug,
      leagueImage.filename,
      league_country,
      null,
      sport,
      sportSlug,
      team1,
      team1Image.filename,
      team2 || "",
      team2Image?.filename || "",
      venue,
      timestamp,
      duration,
      external_id
    );

    return res.status(200).json({
      message: "Match added successfully."
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

app.post("/api/manage-schedule/edit-match", adminMiddleware, upload.fields([
  { name: "league_image", maxCount: 1 },
  { name: "team1_image", maxCount: 1 },
  { name: "team2_image", maxCount: 1 },
]), (req, res) => {
  try {
    const { id, league, league_country, sport, team1, team2, venue, date, time, localTimezoneOffset, external_id, duration: bodyDuration } = z.object({
      sport: z.string().min(1),
      league: z.string().min(1),
      league_country: z.string().min(1),
      team1: z.string().min(1),
      team2: z.string().optional().nullish(),
      venue: z.string().optional().nullish(),
      date: z.string().min(1),
      time: z.string().min(1),
      localTimezoneOffset: z.string(),
      external_id: z.string().optional().nullish(),
      duration: z.string(),
      id: z.string().min(1)
    }).parse(req.body);

    const tzOffset = Number(localTimezoneOffset);
    const duration = Number(bodyDuration);

    const files = req.files as { [field: string]: Express.Multer.File[] };
    const leagueImage = files?.['league_image']?.[0];
    const team1Image = files?.['team1_image']?.[0];
    const team2Image = files?.['team2_image']?.[0];

    const timestamp = toUtcTimestamp(date, time, tzOffset);

    const dbMatch = db.prepare("SELECT * FROM matches WHERE id = ?").get(id) as TMatch;
    console.log(id)
    console.log(dbMatch)
    if (!dbMatch) return res.status(404).json({ message: "Match not found." });

    let slug = dbMatch.slug;
    if (dbMatch.team1 !== team1 || dbMatch.team2 !== team2 || dbMatch.league !== league) {
      slug = slugify(`${shortUUID.generate()}-${league}-${team1}${!!team2 ? `-${team2}` : ""}`)
    }

    const leagueSlug = slugify(league.toLowerCase());
    const sportSlug = slugify(sport.toLowerCase());

    db.prepare("UPDATE matches SET slug = ?, league = ?, league_slug = ?, league_image = ?, league_country = ?, league_id = ?, sport = ?, sport_slug = ?, team1 = ?, team1_image = ?, team2 = ?, team2_image = ?, venue = ?, timestamp = ?, duration = ?, external_id = ? WHERE id = ?").run(
      slug,
      league,
      leagueSlug,
      !!leagueImage ? leagueImage.filename : dbMatch.league_image,
      league_country,
      null,
      sport,
      sportSlug,
      team1,
      !!team1Image ? team1Image.filename : dbMatch.team1_image,
      team2 || "",
      !!team2Image ? team2Image.filename : dbMatch.team2_image,
      venue,
      timestamp,
      duration,
      external_id,
      id
    );

    return res.status(200).json({
      message: "Match edited successfully."
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

app.use("/api/user", userMiddleware, userRouter);
app.use("/api/admin", adminMiddleware, userRouter);
app.use("/api/auth", authRouter);

app.use('/api/submit-links', userMiddleware, submitLinksRouter);

// management
app.use("/api/manage-users", manageUsersRouter);
app.use("/api/manage-website", adminMiddleware, manageWebsiteRouter)
app.use("/api/manage-livetv", liveTvRouter);
app.use("/api/scraping", adminMiddleware, scrapingRouter);
app.use("/api/manage-schedule", adminMiddleware, manageScheduleRouter);
app.use("/api/manage-user-links", moderatorMiddleware, manageUserLinksRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} | dev: http://localhost:${PORT}`);

  console.log("Starting scraper status checker, checking every 15 seconds...")
  setInterval(() => {
    const scraperStatus = JSON.parse(fs.readFileSync(scraperStatusPath, "utf8"));
    // console.log(scraperStatus)
    if (scraperStatus?.status !== "running") return;

    console.log("checking scraper status...");

    if (scraperStatus?.pid && isProcessAlive(scraperStatus?.pid)) {
      console.log("Scraper is still alive.");
    } else {
      console.log("Scraper is dead. Updating status...");
      fs.writeFileSync(scraperStatusPath, JSON.stringify({ ...scraperStatus, status: "idle" }, null, 2));
    }
  }, 1000 * 5);

  console.log("Starting matches runtime checker, checking every 5 minutes.")
  setInterval(() => {
    const dbMatches = db.prepare("SELECT * FROM matches").all() as TMatch[];

    for (const match of dbMatches) {
      if (new Date().getTime() > match.timestamp + (match.duration * 1000 * 60)) {
        console.log(`${match.id} - ${match.league}: ${match.team1} ${!!match?.team2 ? `vs ${match.team2}` : ""} - Match is over, deleting...`);
        db.prepare("DELETE FROM matches WHERE id = ?").run(match.id);
        db.prepare("DELETE FROM user_links WHERE match_id = ?").run(match.id);
      }
    }
  }, 1000 * 60 * 5);
})
