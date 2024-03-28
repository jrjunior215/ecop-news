const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const axios = require("axios");
const { SERVER_PORT, SERVER_IP } = require("./js/server_setting");
require("dotenv").config();
const API_URL = process.env.BACKEND_API;
// SET EXPRESS

const app = express();

// EXPRESS LAYOUTS

app.use(expressLayouts);
app.set("layout", "./layouts/layout");

//SET PAGE LAYOUT
// Middleware for handling 404 errors
// app.use((req, res, next) => {
//   res.status(404).send("Page Not Found"); // Send "Page Not Found" message for 404 errors
// });

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

// Middleware function to check authentication
const isAuthenticated = async (req, res, next) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/me`, {
      headers: { cookie: req.headers.cookie },
      withCredentials: true,
    });

    const me = response.data;

    console.log("user/me info => ", me);

    if (!me) {
      res.redirect("/admin-ecop/login"); // Redirect to login page if user is not logged in
    } else if (me.role !== 1) {
      res.redirect("/"); // Redirect to another page if user is not admin
    } else {
      // ส่งข้อมูลผู้ใช้ไปยังหน้าที่เกี่ยวข้อง
      res.locals.user = me; // เก็บข้อมูลผู้ใช้ในตัวแปร locals เพื่อให้สามารถเข้าถึงได้ในหน้าอื่น
      next(); // Proceed to the next middleware if user is authenticated and is admin
    }
  } catch (error) {
    console.error("Error fetching user/me info: ", error);
    res.redirect("/admin-ecop/login"); // Redirect to login page in case of error
  }
};

// Apply authentication middleware to Admin routes
// app.use("/admin-ecop", isAuthenticated);

// Blog
const blogController = require("./controllers/views/blog/blogController.js");
app.get("/", blogController);

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
app.get("/admin-ecop",isAuthenticated, adminController);

const adminNewsController = require("./controllers/views/admin/adminNewsController");
app.get("/admin-ecop/news",isAuthenticated, adminNewsController);
const adminLoginController = require("./controllers/views/admin/adminLoginController");
app.get("/admin-ecop/login", adminLoginController);

const adminCreateController = require("./controllers/views/admin/adminCreateController");
app.get("/admin-ecop/createnews",isAuthenticated, adminCreateController);
const adminViewController = require("./controllers/views/admin/adminViewerController");
app.get("/admin-ecop/viewer",isAuthenticated, adminViewController);
const adminEditController = require("./controllers/views/admin/adminEditController");
app.get("/admin-ecop/editnews/:id",isAuthenticated, adminEditController);

app.listen(SERVER_PORT, () =>
  console.log(
    "Server is Running on Port " +
      SERVER_PORT +
      " and Server ip : " +
      SERVER_IP +
      ":" +
      SERVER_PORT
  )
);
