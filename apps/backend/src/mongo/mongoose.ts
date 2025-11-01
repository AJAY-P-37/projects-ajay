import mongoose, { ConnectOptions, Connection } from "mongoose";

const uri = process.env.MONGODB_CONNECTION_URI || "";

const clientOptions: ConnectOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

export class MongoDB {
  private static connections: Record<string, Connection> = {};

  public async connectMongoDB(dbName: string): Promise<Connection> {
    const dbKey = `${dbName}_${process.env.ENV}`;

    // ✅ return cached connection if available
    if (MongoDB.connections[dbKey]) {
      return MongoDB.connections[dbKey];
    }

    try {
      const connection = mongoose.createConnection(uri, {
        ...clientOptions,
        dbName: dbKey,
      });

      MongoDB.connections[dbKey] = connection;
      console.log(`✅ Connected to MongoDB: ${dbKey}`);
      return connection;
    } catch (error) {
      console.error(`❌ Error while connecting to MongoDB ${dbKey}:`, error);
      throw error;
    }
  }
}
