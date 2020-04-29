var express = require('express');
var app = express();
var bodyParser = require('body-parser'); /* bodyparser + json + urlencoder */
var morgan  = require('morgan'); /* logger */
var fs = require('fs')
var path = require('path')
var rfs = require('rotating-file-stream')

// create a rotating write stream
var accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'log')
})

app.listen(3002);
app.use(morgan('combined', { stream: accessLogStream }))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.all('*', function(req, res, next) {
  //res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});

/* Routes */
var routes = {};
routes.reservations = require('./route/reservations.js');

app.post('/reservation', routes.reservations.create);
app.get('/reservations', routes.reservations.getAll);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

console.log('Reservations API is starting on port 3002');
