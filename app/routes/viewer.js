exports.viewGraph = function(req, res) {
	var filename=req.query.filename;
  	res.render('viewer.ejs', {file: filename}) 
};