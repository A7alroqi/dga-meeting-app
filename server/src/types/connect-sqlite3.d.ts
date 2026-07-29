declare module "connect-sqlite3" {
  import type session from "express-session";
  import type sqlite3 from "sqlite3";

  interface ConnectSqlite3Options {
    db: sqlite3.Database;
    table?: string;
  }

  type SqliteStoreConstructor = new (options: ConnectSqlite3Options) => session.Store;

  function connectSqlite3(sessionModule: unknown): SqliteStoreConstructor;

  export default connectSqlite3;
}
