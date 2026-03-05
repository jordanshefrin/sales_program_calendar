import snowflake from "snowflake-sdk";

let connection: snowflake.Connection | null = null;

function getConnection(): Promise<snowflake.Connection> {
  return new Promise((resolve, reject) => {
    if (connection) {
      resolve(connection);
      return;
    }

    const conn = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT!,
      username: process.env.SNOWFLAKE_USERNAME!,
      password: process.env.SNOWFLAKE_PASSWORD!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
      database: process.env.SNOWFLAKE_DATABASE || "ANALYTICS",
      schema: process.env.SNOWFLAKE_SCHEMA || "PUBLIC",
    });

    conn.connect((err, conn) => {
      if (err) {
        reject(err);
      } else {
        connection = conn;
        resolve(conn);
      }
    });
  });
}

export async function querySnowflake<T = Record<string, unknown>>(
  sqlText: string
): Promise<T[]> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      complete: (err, _stmt, rows) => {
        if (err) reject(err);
        else resolve((rows || []) as T[]);
      },
    });
  });
}
