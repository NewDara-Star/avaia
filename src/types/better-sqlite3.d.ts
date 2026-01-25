declare module 'better-sqlite3' {
  class Statement {
    get(...params: any[]): any;
    all(...params: any[]): any[];
    run(...params: any[]): any;
  }

  class Database {
    constructor(path: string, options?: any);
    prepare(sql: string): Statement;
    pragma(pragma: string): any;
    close(): void;
  }

  export default Database;
}
