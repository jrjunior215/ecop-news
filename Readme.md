Category

<script>
  const baseURL = "<%= process.env.BACKEND_API %>";
  window.onload = async function () {
    try {
      const maxTextLength = 100;

      // Function to fetch data from the provided URL
      const fetchData = async (url) => {
        const response = await fetch(url);
        return await response.json();
      };

      // Function to sanitize HTML content to text
      const sanitizeHTML = (html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || "";
      };

      // Function to create a news item element
      const createNewsItem = (newsItem) => {
        const item = document.createElement("div");
        item.classList.add("maketing_articles");

        // HTML template for the news item
        item.innerHTML = `
                  <div class="container_box_articles">
                      <div class="articles_img">
                          <img src="/images/${newsItem.imgLinks}.webp" alt="${
          newsItem.imgLinks
        }">
                      </div>
                      <div class="header_articles">
                          <h1>${newsItem.titleTh}</h1>
                      </div>
                      <div class="desc_articles">
                          <p>${sanitizeHTML(
                            newsItem.contentTh.substring(0, maxTextLength)
                          )}${
          newsItem.contentTh.length > maxTextLength ? "..." : ""
        }</p>
                      </div>
                      <a href="#" class="read-more-button" 
                          data-news-id="${newsItem.id}"
                          // data-img-url="${newsItem.imgLinks}"
                          // data-title-th="${newsItem.titleTh}"
                          // data-content-th="${newsItem.contentTh}"
                          // data-title-en="${newsItem.title}"
                          // data-content-th="${sanitizeHTML(newsItem.contentTh.textContent)}"
                          // data-content-en="${sanitizeHTML(newsItem.contentEn.textContent)}"
                          // data-date="${newsItem.date}"
                          // data-author="${newsItem.author}"
                          type="button">Read More</a>
                  </div>
                  <div class="article_option">
                      <div class="profile_article_writing">
                          <img src="img/rectangle-21.png" alt="">
                          <span>${newsItem.author}</span>
                      </div>
                      <div class="related_article_view">
                          <i class="fa-solid fa-eye"></i>
                          <span>${newsItem.viewCount}</span>
                      </div>
                  </div>
              `;

        return item;
      };

      // Select the containers for marketing articles and related blogs
      const marketingArticlesContainer = document.querySelector(
        ".main_maketing_articles"
      );

      // Function to append news items to a container
      const appendNewsItems = (container, newsItems) => {
        const fragment = document.createDocumentFragment();
        newsItems.forEach((newsItem) => {
          fragment.appendChild(createNewsItem(newsItem));
        });
        container.appendChild(fragment);
      };

      // Function to create pagination
      // Function to create pagination
      const createPagination = (currentPage, totalPages) => {
        const baseURL = "<%= process.env.BACKEND_API %>";
        const paginationContainer = document.querySelector(
          ".container_pagination"
        );
        paginationContainer.innerHTML = ""; // Clear existing pagination

        const prevButton = document.createElement("a");
        prevButton.classList.add("pagination-newer");
        prevButton.textContent = "PREV";
        // prevButton.href = '#';
        prevButton.addEventListener("click", () => {
          if (currentPage > 1) {
            fetchDataForPage(currentPage - 1);
          }
        });
        paginationContainer.appendChild(prevButton);

        const paginationInner = document.createElement("span");
        paginationInner.classList.add("pagination-inner");

        // Add page links
        const maxVisiblePages = 5; // Maximum number of visible page links
        const halfVisiblePages = Math.floor(maxVisiblePages / 2);
        let startPage = Math.max(currentPage - halfVisiblePages, 1);
        let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

        if (endPage - startPage < maxVisiblePages - 1) {
          startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }

        if (startPage > 1) {
          const ellipsisStart = document.createElement("span");
          ellipsisStart.textContent = "...";
          paginationInner.appendChild(ellipsisStart);
        }

        for (let i = startPage; i <= endPage; i++) {
          const pageLink = document.createElement("a");
          // pageLink.href = '#';
          pageLink.textContent = i;
          if (i === currentPage) {
            pageLink.classList.add("pagination-active");
          }
          pageLink.addEventListener("click", () => {
            fetchDataForPage(i);
          });
          paginationInner.appendChild(pageLink);
        }

        if (endPage < totalPages) {
          const ellipsisEnd = document.createElement("span");
          ellipsisEnd.textContent = "...";
          paginationInner.appendChild(ellipsisEnd);
        }

        paginationContainer.appendChild(paginationInner);

        const nextButton = document.createElement("a");
        nextButton.classList.add("pagination-older");
        nextButton.textContent = "NEXT";
        nextButton.href = "#";
        nextButton.addEventListener("click", () => {
          if (currentPage < totalPages) {
            fetchDataForPage(currentPage + 1);
          }
        });
        paginationContainer.appendChild(nextButton);
      };

      // Function to fetch data for a specific page
      const fetchDataForPage = async (page) => {
        try {
          const urlParts = window.location.pathname.split("/");
          let category = urlParts[2]; // Get the category from the URL

          // Replace "-" with " " if category is "Data-Breach"
          if (category === "Data-Breach") {
            category = "Data Breach";
          }

          let apiUrl = `${baseURL}/api/news/search?pageSize=12&page=${page}`;
          if (category) {
            apiUrl += `&category=${category}`;
          }

          const response = await fetch(apiUrl);
          const data = await response.json();
          console.log("🚀 ~ fetchDataForPage ~ data:", data);
          const newsItems = data.data;
          // Clear existing news items
          marketingArticlesContainer.innerHTML = "";
          appendNewsItems(marketingArticlesContainer, newsItems);
          createPagination(page, data.pagination.totalPages);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      const initializePagination = async () => {
        try {
          // Extract category from the URL
          const urlParts = window.location.pathname.split("/");
          let category = urlParts[2]; // Get the category from the URL

          // Replace "-" with " " if category is "Data-Breach"
          if (category === "Data-Breach") {
            category = "Data Breach";
          }

          // Build API URL with category
          let apiUrl = `${baseURL}/api/news/search?pageSize=12&page=1`;
          if (category) {
            apiUrl += `&category=${category}`;
          }

          // Fetch data from the API
          const response = await fetch(apiUrl);
          const data = await response.json();
          console.log("🚀 ~ initializePagination ~ data:", data);
          const newsItems = data.data;
          const currentPage = data.pagination.currentPage;
          const totalPages = data.pagination.totalPages;

          // Set the category as the h1 heading
          const categoryHeading = document.querySelector(
            ".header_blog_list h1"
          );
          if (categoryHeading) {
            categoryHeading.textContent = category || "News Articles";
          }

          appendNewsItems(marketingArticlesContainer, newsItems);
          createPagination(currentPage, totalPages);
        } catch (error) {
          console.error("Error initializing pagination:", error);
        }
      };

      // Initialize pagination
      initializePagination();

      const fetchUserIp = async () => {
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const data = await response.json();
          return data.ip;
        } catch (error) {
          console.error("Error fetching user IP:", error);
          return null;
        }
      };

      // Event delegation for "Read More" buttons
      document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("read-more-button")) {
          event.preventDefault();
          const button = event.target;
          const newsId = button.getAttribute("data-news-id");
          const imgLinks = button.getAttribute("data-img-url");
          const titleTh = button.getAttribute("data-title-th");
          const contentTh = button.getAttribute("data-content-th");
          const titleEn = button.getAttribute("data-title-en");
          const contentEn = button.getAttribute("data-content-en");
          const date = button.getAttribute("data-date");
          const author = button.getAttribute("data-author");

          // Fetch user IP
          const userIp = await fetchUserIp();
          console.log("🚀 ~ document.addEventListener ~ userIp:", userIp);
          if (userIp) {
            // Prepare data to be sent to the backend API
            const requestData = {
              newsId: newsId,
              userIp: userIp,
            };

            // Send the data to the backend API
            try {
              const logViewResponse = await fetch(
                `${baseURL}/api/news/logView`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(requestData),
                }
              );

              const logViewData = await logViewResponse.json();
              // Do something with the response if needed
            } catch (error) {
              console.error("Error logging view:", error);
            }
          } else {
            console.error("Unable to fetch user IP.");
          }

          // Store selected news data in localStorage
          sessionStorage.setItem(
            "selectedNews",
            JSON.stringify({
              newsId,
              imgLinks,
              titleTh,
              contentTh,
              titleEn,
              contentEn,
              date,
              author,
            })
          );

          const url = `/news/${newsId}`;
          window.location.href = url;
        }
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };
</script>

-----------------------



blog


<script>
  window.onload = async function () {
    const baseURL = "<%= process.env.BACKEND_API %>";
    try {
      const maxTextLength = 100;
      // Function to fetch data from the provided URL
      const fetchData = async (url) => {
        const response = await fetch(url);
        return await response.json();
      };

      // Function to sanitize HTML content to text
      const sanitizeHTML = (html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || "";
      };

      // Function to create a news item element
      const createNewsItem = (newsItem) => {
        const item = document.createElement("div");
        item.classList.add("maketing_articles");
        const formattedDate = new Date(newsItem.date).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        );
        // HTML template for the news item
        item.innerHTML = `
                <div class="container_box_articles">
                        <div class="articles_img">
                            <img src="/images/${newsItem.imgLinks}.webp" alt="${newsItem.imgLinks
          }">
                        </div>
                        <div class="articles_list">
                            <div class="articles_category">
                                <i class="fa fa-th-large"></i>
                                <span>${newsItem.pTags}</span>
                            </div>
                            <div class="articles_date">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                                <span>${formattedDate}</span>
                            </div>
                        </div>
                        <div class="header_articles">
                            <h1>${newsItem.titleTh}</h1>
                        </div>
                        <div class="desc_articles">
                            <p>${sanitizeHTML(
            newsItem.contentTh.substring(0, maxTextLength)
          )}${newsItem.contentTh.length > maxTextLength ? "..." : ""
          }</p>
                        </div>
                        <a  class="read-more-button" 
                            data-news-id="${newsItem.id}"
                            data-img-url="${newsItem.imgLinks}"
                            data-title-th="${newsItem.titleTh}"
                            data-content-th="${newsItem.contentTh}"
                            data-title-en="${newsItem.title}"
                            data-content-en="${sanitizeHTML(newsItem.contentEn.textContent)}"
                            data-date="${newsItem.date}"
                            data-author="${newsItem.author}"
                            type="button">Read More</a>
                    </div>
                    <div class="article_option">
                        <div class="profile_article_writing">
                            <img src="img/rectangle-21.png" alt="">
                            <span>${newsItem.author}</span>
                        </div>
                        <div class="related_article_view">
                            <i class="fa-solid fa-eye"></i>
                            <span>${newsItem.viewCount}</span>
                        </div>
                    </div>
                `;

        return item;
      };

      // Select the containers for marketing articles and related blogs
      const marketingArticlesContainer = document.querySelector(
        ".main_maketing_articles"
      );

      // Function to append news items to a container
      const appendNewsItems = (container, newsItems) => {
        const fragment = document.createDocumentFragment();
        newsItems.forEach((newsItem) => {
          fragment.appendChild(createNewsItem(newsItem));
        });
        container.appendChild(fragment);
      };

      // Function to create pagination
      // Function to create pagination
      const createPagination = (currentPage, totalPages) => {
        const paginationContainer = document.querySelector(
          ".container_pagination"
        );
        paginationContainer.innerHTML = ""; // Clear existing pagination

        const prevButton = document.createElement("a");
        prevButton.classList.add("pagination-newer");
        prevButton.textContent = "PREV";
        // prevButton.href = '#';
        prevButton.addEventListener("click", () => {
          if (currentPage > 1) {
            fetchDataForPage(currentPage - 1);
          }
        });
        paginationContainer.appendChild(prevButton);

        const paginationInner = document.createElement("span");
        paginationInner.classList.add("pagination-inner");

        // Add page links
        const maxVisiblePages = 5; // Maximum number of visible page links
        const halfVisiblePages = Math.floor(maxVisiblePages / 2);
        let startPage = Math.max(currentPage - halfVisiblePages, 1);
        let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

        if (endPage - startPage < maxVisiblePages - 1) {
          startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }

        if (startPage > 1) {
          const ellipsisStart = document.createElement("span");
          ellipsisStart.textContent = "...";
          paginationInner.appendChild(ellipsisStart);
        }

        for (let i = startPage; i <= endPage; i++) {
          const pageLink = document.createElement("a");
          // pageLink.href = '#';
          pageLink.textContent = i;
          if (i === currentPage) {
            pageLink.classList.add("pagination-active");
          }
          pageLink.addEventListener("click", () => {
            fetchDataForPage(i);
          });
          paginationInner.appendChild(pageLink);
        }

        if (endPage < totalPages) {
          const ellipsisEnd = document.createElement("span");
          ellipsisEnd.textContent = "...";
          paginationInner.appendChild(ellipsisEnd);
        }

        paginationContainer.appendChild(paginationInner);

        const nextButton = document.createElement("a");
        nextButton.classList.add("pagination-older");
        nextButton.textContent = "NEXT";
        // nextButton.href = '#';
        nextButton.addEventListener("click", () => {
          if (currentPage < totalPages) {
            fetchDataForPage(currentPage + 1);
          }
        });
        paginationContainer.appendChild(nextButton);
      };

      // Function to fetch data for a specific page
      const fetchDataForPage = async (page) => {
        try {
          const response = await fetch(`${baseURL}/api/news?page=${page}`);
          const data = await response.json();
          const newsItems = data.news;
          // Clear existing news items
          marketingArticlesContainer.innerHTML = "";
          appendNewsItems(marketingArticlesContainer, newsItems);
          createPagination(page, data.pagination.totalPages);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      // Fetch initial data for the first page
      const initializePagination = async () => {
        try {
          const response = await fetch(`${baseURL}/api/news`);
          const data = await response.json();
          const newsItems = data.news;
          const currentPage = data.pagination.currentPage;
          const totalPages = data.pagination.totalPages;
          appendNewsItems(marketingArticlesContainer, newsItems);
          createPagination(currentPage, totalPages);
        } catch (error) {
          console.error("Error initializing pagination:", error);
        }
      };

      // Initialize pagination
      initializePagination();

      // Function to fetch user IP using ipify.org API
      const fetchUserIp = async () => {
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const data = await response.json();
          // console.log("🚀 ~ fetchUserIp ~ data:", data)
          return data.ip;
        } catch (error) {
          console.error("Error fetching user IP:", error);
          return null;
        }
      };

      // Event listener for "Read More" buttons
      document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("read-more-button")) {
          event.preventDefault();
          const button = event.target;
          const newsId = button.getAttribute("data-news-id");
          const imgLinks = button.getAttribute("data-img-url");
          const titleTh = button.getAttribute("data-title-th");
          const contentTh = button.getAttribute("data-content-th");
          const titleEn = button.getAttribute("data-title-en");
          const contentEn = button.getAttribute("data-content-en");
          const date = button.getAttribute("data-date");
          const author = button.getAttribute("data-author");

          // Fetch user IP
          const userIp = await fetchUserIp();
          console.log("🚀 ~ document.addEventListener ~ userIp:", userIp);
          if (userIp) {
            // Prepare data to be sent to the backend API
            const requestData = {
              newsId: newsId,
              userIp: userIp,
            };

            // Send the data to the backend API
            try {
              const logViewResponse = await fetch(
                `${baseURL}/api/news/logView`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(requestData),
                }
              );

              const logViewData = await logViewResponse.json();
              // Do something with the response if needed
            } catch (error) {
              console.error("Error logging view:", error);
            }
          } else {
            console.error("Unable to fetch user IP.");
          }


          // Store selected news data in localStorage
          sessionStorage.setItem('selectedNews', JSON.stringify({ newsId, imgLinks, titleTh, contentTh, titleEn, contentEn, date, author }));

          // Redirect to the news page
          let url;
          if (button.classList.contains("related_blog")) {
            url = `/news/${newsId}`; // Assuming the URL pattern for blogs is '/blogs/{id}'
          } else {
            url = `/news/${newsId}`; // Assuming the URL pattern for news is '/news/{id}'
          }
          window.location.href = url;
        }
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
    // Function to fetch trending news

    const maxTextLength = 100;

    // Function to sanitize HTML content to text
    const sanitizeHTML = (html) => {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || "";
    };

    // Function to fetch trending news with pagination
    // Function to fetch trending news with pagination
    const fetchTrendingNews = async () => {
      try {
        const response = await fetch(
          `${baseURL}/api/news/search?trendNew=Trending%20News`
        );
        const data = await response.json();
        const trendingNews = data.data;
        const currentPage = data.pagination.currentPage;
        const totalPages = data.pagination.totalPages;

        // Clear existing trending news items
        const trendingNewsContainer = document.querySelector(
          ".slide-container .card-wrapper"
        );
        trendingNewsContainer.innerHTML = "";

        // Append trending news items
        trendingNews.forEach((newsItem) => {
          // Create trending news card element
          const trendingNewsCard = document.createElement("div");
          trendingNewsCard.classList.add("card", "swiper-slide");

          // Set image source
          const imageContent = document.createElement("div");
          imageContent.classList.add("image-content");
          const img = document.createElement("img");
          img.src = `/images/${newsItem.imgLinks}.webp`;
          img.alt = newsItem.imgLinks;
          imageContent.appendChild(img);
          trendingNewsCard.appendChild(imageContent);

          // Set card content
          const cardContent = document.createElement("div");
          cardContent.classList.add("card-content");
          const formattedDate = new Date(newsItem.date).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          );
          cardContent.innerHTML = `
        <h2 class="name">${newsItem.titleTh}</h2>
          <p class="description">${sanitizeHTML(
            newsItem.contentTh.substring(0, maxTextLength)
          )}${newsItem.contentTh.length > maxTextLength ? "..." : ""}</p>
        <button class="button read-more-button" 
                data-news-id="${newsItem.id}"
                data-img-url="${newsItem.imgLinks}"
                data-title-th="${newsItem.titleTh}"
                data-content-th="${newsItem.contentTh}"
                data-title-en="${newsItem.title}"
                data-content-en="${newsItem.contentEn.textContent}"

                data-date="${formattedDate}"
                data-author="${newsItem.author}">Read More</button>
      `;
          trendingNewsCard.appendChild(cardContent);

          // Append card to container
          trendingNewsContainer.appendChild(trendingNewsCard);
        });

        // Initialize Swiper slider after appending trending news cards
        initSwiper();

        // Create pagination for trending news
        createPagination(currentPage, totalPages);
      } catch (error) {
        console.error("Error fetching trending news:", error);
      }
    };

    // Call the function to fetch and display trending news
    fetchTrendingNews();

  };
</script>
--------------------------