import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";
// import { INestApplication } from "@nestjs/common";

const server = express();

const allowedOrigins = ["http://localhost:5000", "https://projects-ajay.web.app"];
// ✅ Global CORS middleware for all routes (including OPTIONS)
server.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end(); // ✅ Preflight handled
  }

  next();
  return;
});

server.use(cookieParser());

const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));
  // app.use(cookieParser());
  // app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  });

  await app.init();
  return app;
};

// ✅ Single Firebase Function entry point
export const api = onRequest(
  { region: "asia-south1", cors: false, timeoutSeconds: 300 },
  async (req, res) => {
    await createNestServer(server);
    return server(req, res);
  },
);
