/* GET home page. */
exports.index = function(req, res){
	var msgAlert="";
	res.render('index', { title: 'Express',msgAlert:msgAlert});
};
/* GET home page. */
exports.about = function(req, res){
  res.render('about', { title: 'Express' });
};