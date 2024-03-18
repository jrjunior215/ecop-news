module.exports = async (req, res) => {
    try {
  
      res.locals.layout = 'category/components/layout';
      res.render('category/index');
      
    } catch (error) {
  
      res.redirect('/error');
      
    }
  }