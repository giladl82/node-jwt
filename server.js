var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');

var port = process.env.PORT || 8000;
mongoose.connect(config.database);
app.set('superSecret', config.secret);

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// WEB ROUTES -----------------------

app.get('/', function (req, res) {
  res.send('Hello, The Api is at http://localhost:' + port + '/api');
});

app.get('/setup', function (req, res) {
  var user = new User({
    name: 'giladl82',
    password: '123456',
    admin: true
  });

  user.save(function (err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});

// WEB ROUTES END -------------------
// API ROUTES -----------------------

// get an instance of the router for api routes
var apiRoutes = express.Router();

app.use('/api', apiRoutes);

apiRoutes.post('/authenticate', function (req, res) {
  console.log('req.body', req.body)
  User.findOne({
    name: req.body.name
  }, function (err, user) {
    if (err) throw err;
    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User node found' });
    } else if (user) {
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrond password' });
      } else {
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: '1d' //expires in 24 hours
        });

        res.json({
          success: true,
          msessage: 'Enjoy your token!',
          token: token
        });
      }
    }
  });
});

// route middleware to verify a token
// MUST BE UNDER '/authenticate' so it won't go through middleware
apiRoutes.use(function (req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    jwt.verify(token, app.get('superSecret'), function (err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }
})

apiRoutes.get('/', function (req, res) {
  res.json({ message: 'Wellcome to the coolest API on earth!' });
});

apiRoutes.get('/users', function (req, res) {
  User.find({}, function (err, users) {
    res.json(users);
  });
});

// API ROUTES END -------------------
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
