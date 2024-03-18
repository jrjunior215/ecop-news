module.exports = async (req, res) => {
    try {
  
      res.locals.layout = 'admin/components/layout';
      res.render('admin/viewnews');
      
    } catch (error) {
  
      res.redirect('/error');
      
    }
  }