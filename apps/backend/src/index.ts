/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import { setGlobalOptions } from "firebase-functions";
// import { onRequest } from "firebase-functions/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
// setGlobalOptions({ maxInstances: 10 });

// export const api = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// import { createNestServer } from "./src/main";
// import * as functions from "firebase-functions/v2/https";

// // declare variable to hold our express server
// let server: any;

// createNestServer().then((expressApp) => {
//   server = expressApp;
//   console.log("NestJS server ready inside Firebase Function");
// });

// export const api = functions.onRequest(
//   { region: "asia-south1" }, // ✅ set region
//   async (req, res) => {
//     if (!server) {
//       res.status(503).send("Server not ready");
//       return;
//     }
//     // const server = await createNestServer();
//     server(req, res); // ✅ pass req,res properly
//   },
// );
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import * as functions from "firebase-functions";
import { AppModule } from "./app.module";
// import { INestApplication } from "@nestjs/common";

const server = express();

const allowedOrigins = ["http://localhost:5000"];
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

const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  });

  await app.init();
  return app;
};

// ✅ Single Firebase Function entry point
export const api = functions.https.onRequest(
  { region: "asia-south1", cors: false },
  async (req, res) => {
    await createNestServer(server);
    return server(req, res);
  },
);
