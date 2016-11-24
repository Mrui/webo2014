var express = require('express');
var router = express.Router();

var models = require('../models');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;



module.exports = router;
