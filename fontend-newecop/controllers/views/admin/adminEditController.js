module.exports = async (req, res) => {
    try {
  
      res.locals.layout = 'admin/components/layout';
      res.render('admin/editnews', { user: res.locals.user });
      
    } catch (error) {
  
      res.redirect('/error');
      
    }
  }