var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var routes = require('./routes/index');
var apiUser = require('./routes/api_user');

var apiHt = require('./routes/api_ht');
var apiBlog = require('./routes/api_blog');
var apiBlogPost = require('./routes/api_post');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// express-session middleware
app.use(session({
  secret: 'salaisuus123',
  resave: false,
  saveUninitialized: false
}));
// http authorize
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/api/user', apiUser);
app.use('/api/ht', apiHt);
app.use('/api/blog', apiBlog);
app.use('/api/post', apiBlogPost);

passport.use(new BasicStrategy(
  function(username, password, done) {
    var models = require('./models');
    var query = {where:{username: username}};
    models.User.findOne(query).then(function(user) {
      console.log("Authorize user: " + username);
      if (!user) {
        done(null,false);
      } else if (user.username === username && user.password === password ) {
        done(null, username);
      }
      else {
        done(null,false);
      }
    });
  }
));


// Lomakekirjautuminen
passport.use(new LocalStrategy(
  {
    // Kenttien nimet HTML-lomakkeessa
    usernameField: 'kayttaja',
    passwordField: 'salasana'
  },
  function(username, password, done) {
    var models = require('./models');
    var query = {where:{username: username}};
    models.User.findOne(query).then(function(user) {
      if (!user) {
        done(null, false);
      } else {
        if (user.username===username && user.password===password) {
          done(null, username);
        } else {
          done(null, false);
        }
      }
    });
  }
));

var basicAuth = passport.authenticate('basic', {session: false});

function apiAuth(req, res, next) {
  // Onko käyttäjä kirjautunut istuntoon (LocalStrategy)?
  if (req.user) {
    // Jos on, voidaan jatkaa.
    next();
  }
  else {
    // Ellei, yritetään vielä Basic-autentikointia.
    basicAuth(req, res, next);
  }
}

// Serialisointi session-muuttujaksi
passport.serializeUser(function(user, done) {
  done(null, user);
});

// Deserialisointi session-muuttujasta
passport.deserializeUser(function(user, done) {
  done(null, user);
});

function logout(req, res){
  req.session.destroy(function (err) {
    res.redirect('/');
  });
}

app.post('/logout', logout);
app.post('/login', passport.authenticate('local',
         {successReturnToOrRedirect: '/', failureRedirect: '/login'}));
app.get('/login', function(req,res) {res.render('kirjaudu');} );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
