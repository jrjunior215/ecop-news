import axios from "axios";
import cheerio from "cheerio";
import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
// ฟังก์ชันสำหรับลบ element ที่มี class ที่ระบุ
function removeElementsByClass($, className) {
  $(className).remove();
}

async function translateText(text, targetLanguage = "th") {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  const translateApiUrl =
    "https://translation.googleapis.com/language/translate/v2";

  const textChunks = splitTextIntoChunks(text, 5000);

  const translations = await Promise.all(
    textChunks.map(async (chunk) => {
      console.log("🚀 ~ textChunks.map ~ chunk:", chunk);
      const params = {
        key: apiKey,
        q: chunk,
        target: targetLanguage,
      };

      try {
        const response = await axios.post(translateApiUrl, null, { params });
        return response.data.data.translations[0].translatedText;
      } catch (error) {
        console.error("Translation error:", error.message);
        throw error;
      }
    })
  );

  const translatedText = translations.join(" ");

  return translatedText;
}

function splitTextIntoChunks(text, chunkSize) {
  const regex = new RegExp(`.{1,${chunkSize}}`, "g");
  return text.match(regex) || [];
}

async function translateData(data, targetLanguage = "th") {
  const translatedTitle = await translateText(data.title, targetLanguage);
  const translatedParagraphs = await Promise.all(
    data.paragraphs.map(async (paragraph) => {
      return await translateText(paragraph, targetLanguage);
    })
  );
  // console.log("🚀 ~ translateData ~ translatedParagraphs:", translatedParagraphs)

  const translatedData = {
    title: data.title,
    imageUrl: data.imageUrl,
    paragraphs: data.paragraphs,
    titleTh: translatedTitle,
    paragraphsTh: translatedParagraphs,
    ref: data.ref,
  };

  return translatedData;
}

function extractLinks($) {
  const linkElements = $(".ListPreview-ImageWrapper a");
  // console.log("🚀 ~ extractLinks ~ linkElements:", linkElements)
  const links = [];

  linkElements.each((index, element) => {
    const contentItem = $(element).closest(".LatestFeatured-ContentItem_left");
    const dateElement = contentItem.find(".ListPreview-Date");
    // console.log("🚀 ~ linkElements.each ~ dateElement:", dateElement)

    if (dateElement.length) {
      const currentDate = new Date(2024, 2, 14);
      // const currentDate = new Date();
      const newsDate = new Date(dateElement.text());
      // console.log("🚀 ~ linkElements.each ~ newsDate:", newsDate)

      // ตรวจสอบว่ามีวันที่และวันที่เป็นปัจจุบันหรือไม่
      if (!isNaN(newsDate) && newsDate >= currentDate) {
        const href = "https://www.darkreading.com" + $(element).attr("href");
        links.push({ href });
      }
    }
  });

  return links;
}

async function fetchDataFromLink(link) {
  const prisma = new PrismaClient();
  try {
    const response = await axios.get(link);

    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);
      removeElementsByClass(
        $,
        ".FullScreenBackground.NavBase-SecondaryMenuBackground"
      );
      removeElementsByClass(
        $,
        ".FullScreenBackground.MainMenu-BackgroundMenuItem"
      );
      removeElementsByClass(
        $,
        ".FullScreenBackground.NavBase-SecondaryMenuBackground"
      );
      removeElementsByClass(
        $,
        ".celtra-screen.celtra-screen-object-container.celtra-view"
      );
      removeElementsByClass(
        $,
        ".ContributorSummary.ContributorSummary_variant_author"
      );
      removeElementsByClass($, ".TwoColumnLayout-Sidebar");

      const title = $("title").text();

      const existingNewsRecord = await prisma.news.findFirst({
        where: { title: title },
      });

      if (existingNewsRecord) {
        console.log(
          "News with title already exists. Skipping translation and database insertion."
        );
        return;
      }

      const imageUrlElement = $(".ArticleBase-FeaturedImage");
      const author = $(".Contributors-ContributorName").text();
      const pTags = $(".ArticleBase-Topics").text();
      const date = $(".Contributors-Date").text();
      const imageUrl = imageUrlElement.attr("src");
      const parsedUrl = new URL(imageUrl);
      const searchParams = new URLSearchParams(parsedUrl.search);
      searchParams.delete("quality");
      searchParams.delete("format");
      searchParams.delete("disable");
      searchParams.delete("blur");
      parsedUrl.search = searchParams.toString();
      const modifiedImageUrl = parsedUrl.toString();

      const imageFileName = uuidv4();

      const imagePath1 = "images/" + imageFileName + ".webp";
      const imagePath2 = "../fontend-newecop/images/" + imageFileName + ".webp";

      const imageResponse = await axios.get(modifiedImageUrl, {
        responseType: "arraybuffer",
      });

      await Promise.all([
        fs.promises.writeFile(imagePath1, imageResponse.data),
        fs.promises.writeFile(imagePath2, imageResponse.data),
      ]);

      const paragraphs = [];
      $('div[data-module="content"] p').each((index, element) => {
        const $paragraph = $(element);
        const text = $paragraph.text();
        paragraphs.push(`<p>${text}</p>`);
      });

      const jsonData = {
        title,
        imageUrl: imageFileName,
        paragraphs,
        ref: link,
      };

      const translatedData = await translateData(jsonData);
      console.log("🚀 ~ fetchDataFromLink ~ translatedData:", translatedData);

      try {
        const newsRecord = await prisma.news.create({
          data: {
            title: translatedData.title,
            date,
            imgLinks: translatedData.imageUrl,
            contentEn: translatedData.paragraphs
              ? translatedData.paragraphs.join("\n")
              : "",
            titleTh: translatedData.titleTh,
            contentTh: translatedData.paragraphsTh
              ? translatedData.paragraphsTh.join("\n")
              : "",
            ref: translatedData.ref,
            author: author,
            pTags: pTags,
          },
        });

        console.log("Saved news record to MySQL:", newsRecord);
      } catch (prismaError) {
        console.error("Error creating news record with Prisma:", prismaError);
        throw prismaError;
      }

      return translatedData;
    } else {
      throw new Error("Failed to fetch data from the link:", link);
    }
  } catch (error) {
    throw new Error(
      `Error fetching data from the link: ${link}. ${error.message}`
    );
  }
}
// ฟังก์ชันสำหรับ scraping ข้อมูลจาก Dark Reading
export async function scrapeDarkReading() {
  cron.schedule("0 */3 * * *", async () => {
    try {
      const url = "https://www.darkreading.com/";
      const response = await axios.get(url);

      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);

        removeElementsByClass($, ".TopFeatured.TopFeatured_variant_recent");
        removeElementsByClass(
          $,
          ".FullScreenBackground.MainMenu-BackgroundMenuItem"
        );
        removeElementsByClass($, ".Ad.Ad_pos_300_1v_article");
        removeElementsByClass($, ".SocialShare");
        removeElementsByClass($, ".n_native_wrapper");
        removeElementsByClass(
          $,
          ".FullScreenBackground.NavBase-SecondaryMenuBackground"
        );
        removeElementsByClass($, ".SubscribeBanner-Wrapper");

        const links = extractLinks($);

        const dataFromLinks = await Promise.all(
          links.map(async (linkObject) => {
            try {
              const data = await fetchDataFromLink(linkObject.href);
              return { link: linkObject.href, data };
            } catch (fetchError) {
              console.error(
                "Error fetching data from link:",
                linkObject.href,
                fetchError
              );
              throw fetchError;
            }
          })
        );

        return dataFromLinks;
      } else {
        throw new Error("Failed to fetch data from Dark Reading");
      }
    } catch (error) {
      throw new Error("Error scraping Dark Reading:", error);
    }
  });
}
