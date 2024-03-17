module.exports = async (req, res) => {
    try {
  
      res.locals.layout = 'admin/components/layout_auth';
      res.render('admin/login');
      
    } catch (error) {
  
      res.redirect('/error');
      
    }
  }