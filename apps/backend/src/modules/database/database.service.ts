// database.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import mongoose from "mongoose";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (mongoose.connection.readyState === 0) {
      const uri: string = process.env.MONGODB_CONNECTION_URI || "";
      await mongoose.connect(uri);
      console.log("✅ MongoDB connected (singleton)");
    }
  }

  async onModuleDestroy() {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }

  getConnection() {
    return mongoose.connection;
  }
}
