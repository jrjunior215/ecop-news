import express from "express";
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import config from "./config/index.js";
import morgan from "morgan";
import api from "./api/v1/index.js";
import cors from "cors";
import rateLimit  from 'express-rate-limit';
import helmet  from 'helmet';
import fs from 'fs';
import path from 'path';

import { NotFoundRequestException } from "./exceptions/not-found-request.exception.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
// import { hackerNewFetchAlltime } from "./schedules/fetchalltime/main.js";
import { hackerNewFetchToday } from "./schedules/hackerNewFetchToday.js";
import { scrapeDarkReading } from "./schedules/darkreadingToday.js";
import { fetchDataAndSave } from "./schedules/update-trend.js";
import { fetchPopularResourcesAndSave } from "./schedules/popularResources.js";
// import { scrapeData } from "./schedules/cybernewToday.js";
const app = express();
app.use(helmet());

// resetProductSchedule();
hackerNewFetchToday();
scrapeDarkReading();
fetchDataAndSave();
// scrapeData();
fetchPopularResourcesAndSave();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  cookieSession({
    signed: false,
    secure: false,
  })
);

const whitelist = ["http://localhost:3000","http://localhost:3000/blog"];

const corsOptions = {
  origin: '*',
  credentials: true,
};


app.use(cors(corsOptions));


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://example.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', ''); // ลบการกำหนด Same-Origin
  res.setHeader('Cross-Origin-Resource-Policy', ''); // ลบการกำหนด Same-Origin
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 50, // จำนวนคำขอสูงสุดที่อนุญาตให้ในช่วงเวลา 15 นาที
});

app.use('/api', limiter);

// ใช้ path.resolve() เพื่อกำหนดเส้นทางสมบูรณ์ของไฟล์รูปภาพ
app.use("/images", express.static(path.join(process.cwd(), 'images')));

app.get('/images/:filename', (req, res, next) => {
  const imageDirectory = path.join(process.cwd(), 'images');
  fs.readdir(imageDirectory, (err, files) => {
    if (err) {
      return next(err);
    }

    const requestedFileName = req.params.filename;
    const filePath = files.find(file => file.startsWith(requestedFileName));
    
    if (!filePath) {
      return next(new NotFoundRequestException());
    }

    const fullFilePath = path.join(imageDirectory, filePath);
    fs.stat(fullFilePath, (err, stats) => {
      if (err) {
        return next(err);
      }

      if (stats.isFile()) {
        res.sendFile(fullFilePath);
      } else {
        return next(new NotFoundRequestException());
      }
    });
  });
});

app.use("/api", api);
app.all("*", async (req, res, next) => {
  try {
    throw new NotFoundRequestException();
  } catch (error) {
    next(error);
  }
});

app.use(errorHandlerMiddleware);

app.listen(config.port, () => {
  console.log(process.env.NODE_ENV);
  console.log(`listening on port ${config.port}`);
  // console.log("For the UI, open http://localhost:8000/admin/queues");
});
