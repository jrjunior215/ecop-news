module.exports = async (req, res) => {
  try {
    res.locals.layout = "news/components/layout";
    res.render("searchnews/index");
  } catch (error) {
    res.redirect("/error");
  }
};
