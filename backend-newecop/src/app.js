import express from "express";
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import config from "./config/index.js";
import morgan from "morgan";
import api from "./api/v1/index.js";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { PassportGoogle } from "./helpers/passports/google.passport.js";
import { NotFoundRequestException } from "./exceptions/not-found-request.exception.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
import { hackerNewFetchToday } from "./schedules/hackerNewFetchToday.js";
import { scrapeDarkReading } from "./schedules/darkreadingToday.js";
import { fetchDataAndSave } from "./schedules/update-trend.js";
import { cybersecurityNews } from "./schedules/cybersecurityNews.js";
import { trendCybersecurityNews } from "./schedules/trendCybersecurityNews.js";
import { fetchPopularResourcesAndSave } from "./schedules/popularResources.js";
import { hackerNewFetchCat } from "./schedules/hackerNewCat.js";

const app = express();

// Scheduled Tasks
hackerNewFetchToday();
scrapeDarkReading();
fetchDataAndSave();
// cybersecurityNews();
hackerNewFetchCat();
// trendCybersecurityNews();
fetchPopularResourcesAndSave();
// Middlewares
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3000/blog","http://172.19.1.113:3000"],
    credentials: true,
  })
);
app.use(cookieSession({ signed: false, secure: false }));

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://example.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// // Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
});
app.use("/api", limiter);

// API Routes
app.use("/api", api);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(new NotFoundRequestException());
});

// Error Handling Middleware
app.use(errorHandlerMiddleware);
PassportGoogle();

// Server Listening
app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`);
});
