var express = require('express');
var router = express.Router();

var models = require('../models');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;

router.get('/', function(req, res, next) {
  var theBlogs;
  models.Blog.findAll().then(function(blogs) {
    theBlogs = blogs;
  });
  models.User.findAll().then(function(users) {
      res.render('index', {
        host: req.headers.host,
        users: users,
        blogs: theBlogs,
        user: req.user
      });
  });

});

router.get('/confirm-login', function (req, res) {
        res.send(req.user)
    }
);

module.exports = router;
