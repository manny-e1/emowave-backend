import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import { sql } from "drizzle-orm";

// import { logger } from '../logger.js';

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
	max: process.env.NODE_ENV === "production" ? 100 : 20,
	idleTimeoutMillis: 60000,
	connectionTimeoutMillis: 10000,
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false }
			: false,
	statement_timeout: 30000,
	query_timeout: 30000,
	keepAlive: true,
	keepAliveInitialDelayMillis: 5000,
});

pool.on("error", (err) => {
	console.error("Unexpected error on idle client", err);
	process.exit(-1);
});

const db = drizzle(pool, { schema, casing: "snake_case" });

await db.execute(sql`
  CREATE OR REPLACE FUNCTION sort_text_array(text[]) RETURNS text[] AS $$
    SELECT array_agg(elem ORDER BY elem)
    FROM unnest($1) elem;
  $$ LANGUAGE SQL IMMUTABLE;
`);
export default db;
