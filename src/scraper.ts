import axios from "axios";
import fs from "fs";
import path from "path";
import { sleep } from "./utils/sleep";
import { TMatch } from "./types";
import { randomUUID } from "crypto";
import slugify from "slugify";
import { toZonedTimestamp } from "./utils/generate-zoned-stamp";
import { countryNameToTimezone } from "./utils/country-name-timezone";

const shortUUID = require('short-uuid');

const scraperStatusPath = path.resolve(process.cwd(), "scraping-status.json");
const scraperConfigPath = path.resolve(process.cwd(), "scraping-config.json");
const leagueCountriesPath = path.resolve(process.cwd(), "thesportsdb-league-countries.json");
const scrapingMatchesPath = path.resolve(process.cwd(), "scraping-matches.json");

const main = async () => {
  let isError = false;
  let errorMessage: string | null = null;

  try {
    const scraperConfig = JSON.parse(fs.readFileSync(scraperConfigPath, "utf8"));
    const leagueCountries = JSON.parse(fs.readFileSync(leagueCountriesPath, "utf8"));
    const sports = scraperConfig.sports;
    const allDates = scraperConfig.dates;

    if (!Array.isArray(sports) || !Array.isArray(allDates)) {
      throw new Error("Invalid config.");
    }

    if (!sports?.length || !allDates?.length) {
      throw new Error("No sports or dates selected.");
    }

    const matches: TMatch[] = [];
    const leagueIDsWithoutCountry: string[] = [];

    for (const sport of sports) {
      for (const date of allDates) {
        let done = false;

        while (!done) {
          try {
            const { data } = await axios.get<{
              events: {
                idEvent: string;

                idLeague: string;
                strLeague: string;
                strLeagueBadge: string;

                strEvent: string;

                strHomeTeam: string | null;
                strHomeTeamBadge: string;

                strAwayTeam: string | null;
                strAwayTeamBadge: string;

                dateEvent: string;
                strTime: string;
                strTimeLocal?: string;

                strVenue: string;
                strCountry: string;
              }[]
            }>(
              `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${date}&s=${sport}`
            );

            for (const event of data?.events ?? []) {
              if (!event?.strTime || (!event?.strEvent && !event?.strHomeTeam && !event?.strAwayTeam) || !event?.dateEvent) continue;

              const [year, month, day] = event.dateEvent.split("-").map(Number);

              const timeStr = event.strTime.split("+")?.[0];
              // const timeZone = event.strTime.split("+")?.[1];

              const timeParts = timeStr.split(":").map(Number);
              const [hour, minute, second = 0] = timeParts;

              // const [tzH, tzM, tzS] = !!timeZone ? timeZone?.split(":").map(Number) : null;

              const startTimestamp = Date.UTC(year, month - 1, day, hour, minute, second, 0);

              const leagueCountry = event.strCountry || leagueCountries?.[event.idLeague] || null;
              if (!leagueCountry) {
                leagueIDsWithoutCountry.push(event.idLeague);
              }

              matches.push({
                id: randomUUID(),

                slug: slugify(`${shortUUID.generate()}-${event.strLeague.toLowerCase()}-${event?.strHomeTeam?.toLowerCase() ?? event.strEvent?.toLowerCase()}${!!event?.strAwayTeam ? `-${event.strAwayTeam.toLowerCase()}` : ""}`),

                league: event.strLeague,
                league_slug: slugify(event.strLeague.toLowerCase()),
                league_image: event.strLeagueBadge,
                league_country: leagueCountry,

                league_id: event.idLeague,

                sport,
                sport_slug: slugify(sport.toLowerCase()),

                team1: event?.strHomeTeam ?? event.strEvent,
                team1_image: event.strHomeTeamBadge ?? "",

                team2: event?.strAwayTeam ?? "",
                team2_image: event?.strAwayTeamBadge ?? "",

                venue: event.strVenue,

                timestamp: startTimestamp,

                stTimestamp: startTimestamp,

                timeStr: event.strTime,
                dateStr: event.dateEvent,

                duration: 120,

                external_id: event.idEvent,
              })
            }

            done = true;
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
              const retryAfter =
                Number(error.response.headers["retry-after"]) || 60;

              console.log("Sleeping for " + retryAfter + " seconds...");
              await sleep(retryAfter * 1000);
            } else {
              throw error;
            }
          }
        }
      }
    }

    for (const leagueID of leagueIDsWithoutCountry) {
      let done = false;

      while (!done) {
        try {
          const { data } = await axios.get<{
            leagues: {
              strCountry: string;
            }[]
          }>(
            `https://www.thesportsdb.com/api/v1/json/123/lookupleague.php?id=${leagueID}`
          );

          if (!!data?.leagues?.[0]?.strCountry) {
            leagueCountries[leagueID] = data.leagues[0].strCountry;
          }

          matches.forEach((match, idx) => {
            if (match.league_id === leagueID) {
              matches[idx].league_country = leagueCountries[leagueID];
            }
          })

          done = true;
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 429) {
            const retryAfter =
              Number(error.response.headers["retry-after"]) || 60;

            console.log("Sleeping for " + retryAfter + " seconds...");
            await sleep(retryAfter * 1000);
          } else {
            throw error;
          }
        }
      }
    }

    for (const match of matches) {
      try {
        if (!match?.dateStr || !match?.timeStr || !match?.league_country || !!match?.ltTimestamp) continue;

        const timezone = countryNameToTimezone(match.league_country);
        if (!timezone) continue;

        match.ltTimestamp = toZonedTimestamp(match.dateStr, match.timeStr, timezone);
      } catch (error) {
        console.error(error);
        continue;
      }
    }

    fs.writeFileSync(scrapingMatchesPath, JSON.stringify([...matches], null, 2), "utf8");
    fs.writeFileSync(leagueCountriesPath, JSON.stringify(leagueCountries, null, 2), "utf8");
  } catch (error) {
    console.error(error);
    isError = true;
    if (error instanceof Error) {
      errorMessage = error.message;
    }
  } finally {
    fs.writeFileSync(scraperStatusPath, JSON.stringify({ status: isError ? "errored" : "finished", lastErrorMessage: errorMessage }, null, 2), "utf8");
  }
}

main();

// const cleanup = (code = 0) => {
//   fs.writeFileSync(scraperStatusPath, JSON.stringify({ status: "idle" }, null, 2));
//   process.exit(code);
// };

// process.on("SIGINT", cleanup);
// process.on("SIGTERM", cleanup);
// process.on("uncaughtException", cleanup);