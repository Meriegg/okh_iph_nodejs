import axios from "axios";
import fs from 'fs';
import { Router } from "express";
import { generateDateRange } from "../utils/generate-date-range";
import z from "zod";
import path from "path";
import { exec } from 'child_process';
import { TMatch } from "../types";
import db from "../db";

const scraperConfigPath = path.resolve(__dirname, "../../scraping-config.json");
const scrapingStatusPath = path.resolve(__dirname, "../../scraping-status.json");
const scrapingMatchesPath = path.resolve(__dirname, "../../scraping-matches.json");

export const scrapingRouter = Router();

scrapingRouter.get("/sports", async (_, res) => {
  const { data } = await axios.get<{ sports: { strSport: string; }[] }>("https://www.thesportsdb.com/api/v1/json/123/all_sports.php");

  return res.status(200).json({
    sports: [...(data?.sports ?? []), ...["Basketball", "Rugby", "Volleyball"].map((strSport) => ({ strSport }))]
  });
}); // works

scrapingRouter.get("/get-prev-config", async (_, res) => {
  return res.status(200).json({
    config: JSON.parse(fs.readFileSync(scraperConfigPath, "utf8"))
  });
}); // works

scrapingRouter.get("/get-scraped-matches", async (_, res) => {
  return res.status(200).json({
    matches: JSON.parse(fs.readFileSync(scrapingMatchesPath, "utf8"))
  });
}); // works

scrapingRouter.post("/scrape", async (req, res) => {
  try {
    const { sports, dates } = z.object({
      sports: z.array(z.string()),
      dates: z.array(z.object({
        type: z.enum(["interval", "single"]),
        date: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional()
      }))
    }).parse(req.body);

    if (!sports?.length) {
      return res.status(400).json({ error: "No sports selected." });
    }

    if (!dates?.length || !dates.every(date => date.type === "interval" ? !!date.start && !!date.end : !!date.date)) {
      return res.status(400).json({ error: "Invalid dates." });
    }

    let allDates: string[] = [];

    dates.forEach(date => {
      if (date.type === "interval") {
        allDates.push(...generateDateRange(date.start!, date.end!));
      } else {
        allDates.push(date.date!);
      }
    });

    allDates = Array.from(new Set(allDates));

    fs.writeFileSync(scraperConfigPath, JSON.stringify({
      sports,
      dates: allDates
    }, null, 2), "utf8");

    const status = JSON.parse(fs.readFileSync(scrapingStatusPath, "utf8"));
    // if it's running not for more than 10 minutes
    if (status?.status === "running" && (status.lastRanAt + 60 * 1000 * 10) > new Date().getTime()) {
      return res.status(400).json({ error: "Scraper is already running." });
    }

    const scraperProcess = exec(`node ${path.resolve(process.cwd(), "dist/scraper.js")}`);

    status.status = "running";
    status.pid = scraperProcess.pid;
    status.lastRanAt = new Date().getTime();
    fs.writeFileSync(scrapingStatusPath, JSON.stringify(status, null, 2), {
      encoding: "utf8",
    });

    scraperProcess.unref();

    return res.status(200).json({
      message: "Scraping started successfully."
    });
  } catch (error) {
    console.error(error);
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

scrapingRouter.post("/pool", async (req, res) => {
  const status = JSON.parse(fs.readFileSync(scrapingStatusPath, "utf8"));
  const matches = JSON.parse(fs.readFileSync(scrapingMatchesPath, "utf8"));

  return res.status(200).json({
    statusData: status,
    matches: matches
  });
}); // works

scrapingRouter.post("/accept-matches", async (req, res) => {
  try {
    const {
      selectedLeagueIDs,
      selectedMatchIDs,
      selectedMatchStampTypes,
      selectedMatchCountries
    } = z.object({
      selectedLeagueIDs: z.array(z.string()),
      selectedMatchIDs: z.array(z.string()),
      selectedMatchStampTypes: z.record(z.string(), z.enum(["lt", "st"])),
      selectedMatchCountries: z.record(z.string(), z.boolean())
    }).parse(req.body);

    const matches: TMatch[] = JSON.parse(fs.readFileSync(scrapingMatchesPath, "utf8"));

    const dbMatches = db.prepare("SELECT * FROM matches").all() as TMatch[];

    let acceptedMatches: TMatch[] = matches
      .filter((match) =>
        selectedMatchCountries?.[match.league_country] === false ? false : true
      )
      .filter(
        (match) =>
          selectedLeagueIDs.includes(match?.league_id ?? "") &&
          selectedMatchIDs.includes(match.id)
      );

    // remove duplicates
    acceptedMatches = acceptedMatches.filter((match) => {
      const existingMatch = dbMatches.find(m => m.external_id === match.external_id || (m.team1 === match.team1 && m.team2 === match.team2 && match.league === m.league));

      return !existingMatch;
    }).filter((match) => {
      return new Date().getTime() < match.timestamp + (match.duration * 1000 * 60);
    });

    const commitMatchesTRX = db.transaction(() => {
      acceptedMatches.forEach(match => {
        const timestamp = !match?.stTimestamp && !match?.ltTimestamp
          ? match.timestamp
          : selectedMatchStampTypes[match.id] === "lt"
            ? match.ltTimestamp!
            : match.stTimestamp!

        db.prepare("INSERT INTO matches (id, slug, league, league_slug, league_image, league_country, league_id, sport, sport_slug, team1, team1_image, team2, team2_image, venue, timestamp, duration, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          match.id,
          match.slug,
          match.league,
          match.league_slug,
          match.league_image,
          match.league_country,
          match.league_id,
          match.sport,
          match.sport_slug,
          match.team1,
          match.team1_image,
          match.team2,
          match.team2_image,
          match.venue,
          timestamp,
          match.duration,
          match.external_id
        );
      });
    });

    commitMatchesTRX();

    fs.writeFileSync(scrapingMatchesPath, JSON.stringify([], null, 2), "utf8");

    return res.status(200).json({
      message: "Matches inserted successfully into DB."
    });
  } catch (error) {
    console.error(error);
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
}) // works