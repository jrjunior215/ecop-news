const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const { SERVER_PORT, SERVER_IP } = require("./js/server_setting");
require("dotenv").config();
// SET EXPRESS

const app = express();

// EXPRESS LAYOUTS

app.use(expressLayouts);
app.set("layout", "./layouts/layout");

//SET PAGE LAYOUT

app.use((req, res, next) => {
  res.locals.layout = "404/components/layout";
  next();
});

// SET EXPRESS

app.set("view engine", "ejs");

// SET STATIC FILE

app.use("/css", express.static("css"));
app.use("/img", express.static("img"));
app.use("/images", express.static("images"));
app.use("/lib", express.static("lib"));
app.use("/js", express.static("js"));
app.use("/fonts", express.static("fonts"));
app.use("/favicon", express.static(path.join(__dirname, "img", "icon.png")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// SET VIEWS AND VIEW ENGINE
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// VIEWS INDEX
// INDEX
const indexController = require("./controllers/views/index/indexController");
app.get("/", indexController);

// สมมติข้อมูลข่าว

// Blog
const blogController = require("./controllers/views/blog/blogController.js");
app.get("/blog", blogController);

// Blog
const categoryController = require("./controllers/views/category/categoryController.js");
app.get("/category/:name", categoryController);

// Blog
const newsController = require("./controllers/views/news/newsController.js");
app.get("/news/:id", newsController);

const SearchNewsController = require("./controllers/views/news/SearchNewsController.js");
app.get("/searchnews", SearchNewsController);

// ADMIN
const adminController = require("./controllers/views/admin/adminController");
app.get("/admin-ecop", adminController);

const adminNewsController = require("./controllers/views/admin/adminNewsController");
app.get("/admin-ecop/news", adminNewsController);
const adminLoginController = require("./controllers/views/admin/adminLoginController");
app.get("/admin-ecop/login", adminLoginController);

app.listen(SERVER_PORT, () =>
  console.log(
    "Server is Running on Port " +
      SERVER_PORT +
      " and Server ip : " +
      SERVER_IP +
      "."
  )
);
