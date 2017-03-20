var express = require('express');
	bodyParser = require('body-parser')
    app = express();
    partials = require('express-partials');
//var http = require('http');
    path = require('path');
//var favicon = require('static-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/graphs', express.static('graphs'));

var router = express.Router(); 
var routes = require('./routes/index.js');
var data = require('./routes/data.js');
var moodle = require('./routes/moodle.js');
var history = require('./routes/history.js');
var viewer = require('./routes/viewer.js');
app.use(router);
router.use(function(req, res, next) {
  // do logging
  console.log('Realizando petición');
  next(); // make sure we go to the next routes and don't stop here
});
router.get('/',routes.index);
router.get('/index',routes.index);
router.get('/about',routes.about);
router.post('/grafo',data.buildGraph);
router.post('/connect',moodle.getToken);
router.get('/history',history.getGraphs);
router.get('/viewer',viewer.viewGraph);


var port = process.env.PORT || 3000;  
app.listen(port);
console.log('Escuchando en el puerto ' + port);