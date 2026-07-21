import mongoose, { ConnectOptions, Connection } from "mongoose";

const uri = process.env.MONGODB_CONNECTION_URI || "";

const clientOptions: ConnectOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

export class MongoDB {
  private static connections: Record<string, Connection> = {};

  private resolveDbName(dbName: string): string {
    const normalizedDbName = dbName.trim();

    if (normalizedDbName.endsWith("_DEV") || normalizedDbName.endsWith("_PROD")) {
      return normalizedDbName;
    }

    const env = (process.env.ENV || process.env.NODE_ENV || "DEV").toUpperCase();
    return env === "PROD" || env === "PRODUCTION" ? `${normalizedDbName}_PROD` : `${normalizedDbName}_DEV`;
  }

  public async connectMongoDB(dbName: string): Promise<Connection> {
    const resolvedDbName = this.resolveDbName(dbName);

    // ✅ return cached connection if available
    if (MongoDB.connections[resolvedDbName]) {
      return MongoDB.connections[resolvedDbName];
    }

    try {
      const connection = mongoose.createConnection(uri, {
        ...clientOptions,
        dbName: resolvedDbName,
      });

      MongoDB.connections[resolvedDbName] = connection;
      console.log(`✅ Connected to MongoDB: ${resolvedDbName}`);
      return connection;
    } catch (error) {
      console.error(`❌ Error while connecting to MongoDB ${resolvedDbName}:`, error);
      throw error;
    }
  }
}
