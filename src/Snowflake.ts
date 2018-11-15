import * as SDK from "snowflake-sdk";

import { ConnectionOptions } from "./types/ConnectionOptions";
import { ExecuteOptions } from "./types/ExecuteOptions";
import { LoggingOptions } from "./types/LoggingOptions";
import { Statement } from "./Statement";

export class Snowflake {
  private readonly sdk_connection;
  private readonly logSql: (sqlText: string) => void;

  /*
   * Creates a new Snowflake instance.
   *
   * Set the insecureConnect parameter to true to workaround OCSP errors when connecting.
   * See: https://github.com/snowflakedb/snowflake-connector-nodejs/issues/16
   */
  constructor(
    connectionOptions: ConnectionOptions,
    loggingOptions: LoggingOptions = {},
    insecureConnect = false
  ) {
    if (loggingOptions && loggingOptions.logLevel) {
      SDK.configure({ logLevel: loggingOptions.logLevel });
    }
    this.logSql = (loggingOptions && loggingOptions.logSql) || null;
    if (insecureConnect) {
      SDK.configure({ insecureConnect: true });
    }
    this.sdk_connection = SDK.createConnection(connectionOptions);
  }

  /** the connection id */
  get id(): string {
    return this.sdk_connection.getId();
  }

  /** Establishes a connection if we aren't in a fatal state. */
  connect() {
    return new Promise<void>((resolve, reject) => {
      this.sdk_connection.connect(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Immediately terminates the connection without waiting for currently
   * executing statements to complete.
   */
  destroy() {
    return new Promise<void>((resolve, reject) => {
      this.sdk_connection.destroy(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /** Create a Statement. */
  createStatement(options: ExecuteOptions) {
    return new Statement(this.sdk_connection, options, this.logSql);
  }

  /** A convenience function to execute a SQL statement and return the resulting rows. */
  execute(sqlText: string, binds?: any[]) {
    const stmt = this.createStatement({ sqlText, binds });
    stmt.execute();
    return stmt.getRows();
  }
}
