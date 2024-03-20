module.exports = async (req, res) => {
  try {
    res.locals.layout = "news/components/layout";
    res.render("news/search");
  } catch (error) {
    res.redirect("/error");
  }
};
