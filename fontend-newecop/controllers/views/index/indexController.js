module.exports = async (req, res) => {
  try {

    res.locals.layout = 'index/components/layout';
    res.render('index/index');
    
  } catch (error) {

    res.redirect('/error');
    
  }
}