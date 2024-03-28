import axios from "axios";
import cheerio from "cheerio";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const url = "https://thehackernews.com/";
const prisma = new PrismaClient();

const SCRAPER_API_KEY = "8fc2dd040ee2320156f8ab676fb8636a";
const SCRAPER_API_URL = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=`;

async function fetchData(url) {
  try {
    const response = await axios.get(`${SCRAPER_API_URL}url`);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    throw new Error("Error fetching data:", error);
  }
}

function cleanHTML($) {
  // $('.PopularPosts').remove();
  $(
    ".header.clear, .left-box, .below-post-box.cf, .footer-stuff.clear.cf"
  ).remove();
  $(".clear.section.babsi.side_res").remove();
}

function getTitles($) {
  const titles = [];
  $(".pop-title").each((index, element) => {
    titles.push($(element).text());
  });
  return titles;
}

async function updateNews(news, trend) {
  try {
    // ค้นหาข้อมูลข่าวในฐานข้อมูล
    const existingNewsRecord = await prisma.news.findUnique({
      where: { id: news.id },
    });

    // ตรวจสอบว่าข้อมูลถูกพบและ ref เป็น https://thehackernews.com
    if (existingNewsRecord && existingNewsRecord.ref === 'https://thehackernews.com') {
      await prisma.news.update({
        where: { id: news.id },
        data: { trend_new: trend },
      });
      console.log(
        `News "${news.title}" is now marked as ${trend} in the database.`
      );
    } else {
      console.log(
        `News "${news.title}" either not found or not from thehackernews.com. Skipped updating.`
      );
    }
  } catch (error) {
    console.error(`Error updating news "${news.title}":`, error);
  }
}

async function searchAndResetTrending(titles) {
  try {
    if (titles && titles.length > 0) {
      const trendingNews = await prisma.news.findMany({
        where: { trend_new: "Trending News" },
      });

      if (trendingNews.length > 0) {
        await Promise.all(
          trendingNews.map(async (news) => {
            if (!titles.includes(news.title)) {
              return updateNews(news, "Normal");
            }
          })
        );
      }
    }
  } catch (error) {
    console.error("Error searching and resetting Trending News:", error);
  }
}

async function searchAndSetTrending(titles) {
  try {
    await Promise.all(
      titles.map(async (title) => {
        const existingNews = await prisma.news.findFirst({ where: { title } });
        if (existingNews) {
          return updateNews(existingNews, "Trending News");
        }
      })
    );
  } catch (error) {
    console.error("Error searching and updating:", error);
  }
}

export async function fetchDataAndSave() {
  cron.schedule("0 */2 * * *", async () => {
    try {
      const htmlData = await fetchData(url);

      // Clone cheerio object for titles
      const $titles = cheerio.load(htmlData);
      cleanHTML($titles);

      const titles = getTitles($titles);
      console.log("🚀 ~ cron.schedule ~ titles:", titles);

      await Promise.all([
        searchAndResetTrending(titles),
        searchAndSetTrending(titles),
      ]);

      console.log("Data saved to the database.");
    } catch (error) {
      console.error(error.message);
    }
  });
}