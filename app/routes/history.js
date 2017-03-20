exports.getGraphs = function(req, res) {
	var history = require('../history.json');
	var token=req.query.token;
  	res.render('history.ejs', {history : history["list"],token: token}) 
};