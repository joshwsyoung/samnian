import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Lazily constructed so `next build` never needs a live DATABASE_URL at
// import time — every page that touches the database also reads the
// session cookie, which already opts it into dynamic (request-time)
// rendering, so this only ever runs when a real request comes in.
let _client: postgres.Sql | undefined;

function client() {
  if (!_client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Supabase Postgres connection string."
      );
    }
    _client = postgres(url, { prepare: false });
  }
  return _client;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function db() {
  if (!_db) {
    _db = drizzle(client(), { schema });
  }
  return _db;
}
