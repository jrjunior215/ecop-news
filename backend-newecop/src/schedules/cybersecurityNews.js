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

const SCRAPER_API_KEY = "8fc2dd040ee2320156f8ab676fb8636a";
const SCRAPER_API_URL = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=`;

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
    const linkElements = $(".td_module_10.td_module_wrap.td-animation-stack .entry-title.td-module-title a");
    // const currentDate = new Date(); // กำหนด currentDate ที่นี่
    const currentDate = new Date();
    const links = [];
  
    linkElements.each((index, element) => {
        const contentItem = $(element).closest(".vc_column.tdi_20.wpb_column.vc_column_container.tdc-column.td-pb-span8");
        const dateElement = contentItem.find(".td-post-date");
  
        if (dateElement.length) {
            const newsDateStr = dateElement.find('time').attr('datetime'); // ดึงค่า datetime ออกมา
            const newsDate = new Date(newsDateStr); // แปลงค่า datetime เป็น Date object
            console.log("🚀 ~ linkElements.each ~ newsDate:", newsDate)
  
            // ตรวจสอบว่ามีวันที่และวันที่เป็นปัจจุบันหรือไม่
            if (!isNaN(newsDate) && newsDate >= currentDate) {
                const href = $(element).attr("href");
                console.log("🚀 ~ extractLinks ~ links:", href)
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
        ".td-header-wrap.td-header-style-1"
      );
      removeElementsByClass(
        $,
        ".td-ss-main-sidebar"
      );
      removeElementsByClass(
        $,
        ".author-box-wrap"
      );
      removeElementsByClass(
        $,
        ".td-post-source-tags"
      );
      removeElementsByClass(
        $,
        ".td-author-by"
      );
      removeElementsByClass(
        $,
        ".td-author-line"
      );
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

      const imageUrlElement = $(".entry-thumb");
      const author = $(".Contributors-ContributorName").text();
      const pTags = $(".td-post-author-name").text();
      const date = $(".entry-date.updated.td-module-date").text();
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
      $('.td-pb-span8.td-main-content p').each((index, element) => {
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
export async function cybersecurityNews() {
    try {
      const response = await axios.get(`${SCRAPER_API_URL}https://cybersecuritynews.com/`);
      console.log("🚀 ~ cron.schedule ~ response:", response)

      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);

        // removeElementsByClass($, ".vc_column.tdi_12.wpb_column.vc_column_container.tdc-column.td-pb-span12");
        // removeElementsByClass(
        //   $,
        //   ".td-header-wrap.td-header-style-1 "
        // );
        // removeElementsByClass(
        //   $,
        //   ".td-a-rec.td-a-rec-id-custom_ad_1.tdi_27.td_block_template_1"
        // );
        // removeElementsByClass(
        //   $,
        //   ".wpb_wrapper"
        // );
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
    console.error("Error scraping Dark Reading:", error);
    throw error; // แก้ไขนี้เพื่อส่งข้อผิดพลาดออกไป
}
}



cron.schedule("0 */5 * * *", async () => {
    try {
      await cybersecurityNews();
      console.log("cybersecurityNews has started.");
    } catch (error) {
      console.error("Error occurred in cybersecurityNews:", error);
    }
  });
  