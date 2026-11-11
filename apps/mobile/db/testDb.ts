import initSqlJs, { type Database } from "sql.js";
import { runMigrations } from "@/db/migrations";

// The in-memory sql.js database the db tests run on, answering the same calls as the
// expo-sqlite one. A test file mocks `getDb` to return `fakeDb`, then calls `freshDb()`
// before each test; `raw` is the current database.
export let raw: Database;
let realTransactions = false;

const SQL = await initSqlJs();

export function rows<T>(sqlText: string, params: unknown[] = []): T[] {
  const stmt = raw.prepare(sqlText);
  stmt.bind(params as never);
  const out: T[] = [];
  while (stmt.step()) out.push(stmt.getAsObject() as T);
  stmt.free();
  return out;
}

export const fakeDb = {
  async execAsync(sqlText: string) {
    raw.exec(sqlText);
  },
  async runAsync(sqlText: string, params: unknown[] = []) {
    raw.run(sqlText, params as never);
  },
  async getAllAsync<T>(sqlText: string, params: unknown[] = []) {
    return rows<T>(sqlText, params);
  },
  async getFirstAsync<T>(sqlText: string, params: unknown[] = []) {
    return rows<T>(sqlText, params)[0] ?? null;
  },
  async withTransactionAsync(fn: () => Promise<void>) {
    if (!realTransactions) return fn();
    raw.exec("BEGIN");
    try {
      await fn();
      raw.exec("COMMIT");
    } catch (e) {
      raw.exec("ROLLBACK");
      throw e;
    }
  },
};

// An empty database with every migration applied. `realTransactions` makes a failing
// transaction roll back; by default the callback just runs.
export async function freshDb(options: { realTransactions?: boolean } = {}) {
  raw = new SQL.Database();
  realTransactions = options.realTransactions ?? false;
  await runMigrations(fakeDb as never);
}
