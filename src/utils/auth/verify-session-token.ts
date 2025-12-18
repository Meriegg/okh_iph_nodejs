import { TUserSession } from "src/types";
import db from "../../db";
import { hashString } from "./hash-string";

export const verifySessionToken = async (sessionToken: string, allowDisabled = false) => {
  const [dbId, sessionId] = sessionToken.split(".");
  if (!dbId || !sessionId) {
    return {
      error: true,
      message: "Token invalid."
    }
  }

  const dbSession = db.prepare("SELECT * FROM user_sessions WHERE id = ?").get(dbId) as TUserSession | undefined;
  if (!dbSession) {
    return {
      error: true,
      message: "Invalid token."
    }
  }

  if (new Date(dbSession.expires_at).getTime() < new Date().getTime()) {
    db.prepare("DELETE FROM user_sessions WHERE id = ?").run(dbId);

    return {
      error: true,
      message: "Session expired."
    }
  }

  if (!!dbSession.disabled && allowDisabled === false) {
    return {
      error: true,
      message: "Sesiunea este dezactivata."
    }
  }

  const sessionIdHash = await hashString(sessionId);
  if (dbSession.sessionHash !== sessionIdHash.toString()) {
    return {
      error: true,
      message: "Token invalid. (2)"
    }
  }

  const now = new Date();
  const expiration = new Date(now.getTime() + (1000 * 60 * 60 * 24 * 2));

  db.prepare("UPDATE user_sessions SET expires_at = ? WHERE id = ?").run(expiration.getTime(), dbId);

  return {
    error: false,
    session: dbSession
  }
}