module.exports = async (req, res) => {
    try {
  
      res.locals.layout = 'blog/components/layout';
      res.render('blog/index');
      
    } catch (error) {
  
      res.redirect('/error');
      
    }
  }