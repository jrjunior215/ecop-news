module.exports = async (req, res) => {
  try {
      // ส่งข้อมูลผู้ใช้ไปยังหน้า "admin/createnews"
      res.locals.layout = 'admin/components/layout';
      res.render('admin/viewnews', { user: res.locals.user });
  } catch (error) {
      // หากเกิดข้อผิดพลาดในการ render ให้ redirect ไปยังหน้า "/error"
      res.redirect('/error');
  }
};
