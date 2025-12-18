import { generateSecureRandomString } from "./secure-random-string";
import { hashString } from "./hash-string";
import db from "../../db";
import { randomUUID } from "crypto";

export const createSession = async ({ userId }: { userId: string }) => {
  const now = new Date()
  const expiration = new Date(now.getTime() + (1000 * 60 * 60 * 24 * 2));

  const baseHash = generateSecureRandomString();
  const sessionHash = await hashString(baseHash);

  const sessionId = randomUUID();

  const stmt = db.prepare("INSERT INTO user_sessions (id, user_id, sessionHash, expires_at) VALUES (?, ?, ?, ?)");
  stmt.run(sessionId, userId, sessionHash.toString(), expiration.getTime());

  const sessionToken = `${sessionId}.${baseHash}`;

  return {
    sessionToken,
    id: sessionId
  }
}
