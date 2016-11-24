var express = require('express');
var router = express.Router();

var models = require('../models');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;

/*
- Hakee postauksen tiedot: GET <Olkoot>
- Kommenttien haku: GET <ok>
- Kommentin lisäys: POST <ok>
*/
// Hakee postauksen tiedot
router.get('/:id', function(req, res, next) {
  var postId = req.params['id'];
  var attributes = [ 'title', 'text', 'author', 'likes'];
  var query = {where: { id: postId },
  attributes: attributes };
  var likesAmount = 0;

  models.Post.find(query).then(function(post) {
    return res.status(200).json(post);
  }, function(err) {
    return res.status(500).json(err);
  });

});

// Hakee postauksen kommentit
router.get('/:id/comments', function(req, res, next) {
  var id = req.params['id'];
  var query = {where: { id: id }};
  var commentAmount = req.body.amount || 10;
  var attributes = ['id', 'text', 'author'];

  models.Post.find(query).then(function(post) {
    post.getComments({
      attributes: attributes,
      joinTableAttributes: []
    }).then(function(comments) {
      if (!comments) {
        return res.status(404).json({error: 'PostNotFound'});
      }
      else {
        // Järkyttävän hieno for-looppitoteutus 10 kommentin hakemiseen!
        var returnee = [];
        if ( comments.length < commentAmount ) {
          return res.status(200).json(comments);
        } else {
          for ( i = comments.length-commentAmount; i < comments.length; i++ ) {
            returnee = returnee.concat(comments[i]);
          };
          return res.status(200).json(returnee);
        }
      }
    });
  });
});

// Lisää kommentin postaukselle
router.post('/:id/comments', passport.authenticate('basic', {session: false}), function(req, res, next) {
  var id = req.params['id'];
  var text = req.body.text;
  if ( !text ) {
    return res.status(400).json({error: 'TextFieldEmpty'});
  }
  var query = {where: { id: id }};

  models.Post.find(query).then(function(post) {
    if (!post) {
      return res.status(404).json({error: 'PostNotFound'});
    } else {
      post.createComment({
        text: text
      }).then(function(comment) {
        models.User.findOne({where:{username:req.user}}).then(function(user) {
          comment.setUser(user);
          comment.updateAttributes({author: user.username});
        });
        return res.status(201).json({'id': comment.id});
      });
    }
  });
});

// Hakee 10 uusinta blogikirjoitusta.
router.get('/', function(req, res, next) {
  var postAmount = req.body.amount || 10;
  models.Post.findAll({attributes: ['id', 'title', 'text', 'author', ['createdAt', 'date']]}).then(function(posts) {
    var returnee = [];
    if ( posts.length < postAmount ) {
      return res.status(200).json(posts);
    } else {
      for ( i = posts.length-postAmount; i < posts.length; i++ ) {
        returnee = returnee.concat(posts[i]);
      };
      return res.status(200).json(returnee);
    }
  },
  function(err) {
    return res.status(500).json({error: 'ServerError'});
  });
});

module.exports = router;
