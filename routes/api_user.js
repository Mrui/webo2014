var express = require('express');
var router = express.Router();

var models = require('../models');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;

// var auth = require('./auth');

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

/*
  - Uuden käyttäjän rekisteröiminen: POST <ok>
  - Päivittää käyttäjän tiedot: PUT <ok>
  - Käyttäjän tietojen haku: GET <ok>
  - Käyttäjien blogien hakeminen: GET <ok>

  - Lisää blogin seurantaan: PUT <ok>
  - Hakee käyttäjän seuraamat blogit: GET <ok>
  - Poistaa blogin seuraamisen käyttäjältä: DELETE <ok>

  - Tykkää blogikirjoituksesta: PUT <ok>
  - Poistaa tykkäyksen: DELETE <ok>
*/

// Uuden käyttäjän rekisteröiminen.
router.post('/', function(req, res, next) {

  var username = req.body.username;
  var realname = req.body.name;
  var pass = req.body.password;
  if (!username) {
    return res.status(400).json({error: 'InvalidUserName'});
  }
  else if ( !realname || !pass ) {
    return res.status(400).json({error: 'EmptyNameOrPassword'});
  }

  var query = {where: {username: username}};
  models.User.findOne(query).then(function(user) {
    if (user) {
      return res.status(409).json({error: 'UserNameExists'});
    }
    else {
      models.User.create({
        username: username,
        name: realname,
        password: pass
      }).then(function(user) {
        models.Blog.create({
          rid: username,
          name: username + "'s blog"
        }).then(function(blog) {
          user.addAuthoredBlogs(blog);
          return res.status(201).json();
        },
        function(err) {
          return res.status(500).json({error: 'ServerError'});
        });
      },
      function(err) {
        if (err.message === "Validation error: UserNameError"){
          return res.status(400).json({error: 'InvalidUserName'});
        }
        else {
          return res.status(500).json({error: 'ServerError'});
        }
      });
    }
  });

});

// Käyttäjän tietojen haku
router.get('/:username', function(req, res, next) {

  var username = req.params['username'];
  var query = {where: {username: username},
               attributes: [
                 'username',
                 'name']};

  models.User.findOne(query).then(function(user) {
    if (user) {
      return res.status(200).json(user);
    }
    else {
      return res.status(404).json({error: 'UserNotFound'});
    }
  }, function(err) {
    return res.status(500).json({error: 'ServerError'});
  });
});

// Päivittää käyttäjän tiedot
router.put('/:username', passport.authenticate('local'), function(req, res, next) {
  var name = req.body.name;
  var passwd = req.body.password;
  var username = req.params['username'];

  if ( req.user != username ) {
    return res.status(403).json({error: 'NotAuthed'});
  }

  var query = {where: {username: username}};
  models.User.findOne(query).then(function(user) {
    if (!user) {
      return res.status(404).json({error: 'UserNotFound'});
    } else {
      if (name && !passwd ) {
        user.updateAttributes({name: name});
      } else if (!name && passwd) {
        user.updateAttributes({password: passwd});
      } else if (name && passwd) {
        user.updateAttributes({name: name, password: passwd});
      } else {
        return res.status(400).json({error: 'EmptyNameAndPassword'});
      }
      return res.status(200).json(user);
    }
  }, function(err) {
    return res.status(500).json({error: 'ServerError'});
  });

});

// Hakee käyttäjän blogit.
router.get('/:username/blogs', function(req, res, next) {

  var username = req.params['username'];

  var query = {where: {username: username}};
  models.User.findOne(query).then(function(user) {
    if (!user) {
      return res.status(404).json({error: 'NotFound'});
    }
    else {
      user.getAuthoredBlogs({attributes: [['rid', 'id']],
                            joinTableAttributes: []
                            }).then(function(blogs) {
        return res.status(200).json(blogs);
      }, function(err) {
        return res.status(500).json({error: 'ServerError'});
      });
    }
  });

});

// Lisää blogin käyttäjälle seurantaan
router.put('/:username/follows/:id', passport.authenticate('local'), function(req, res, next) {
  var username = req.params['username'];
  var id = req.params['id'];
  if ( username != req.user ) {
    return res.status(403).json({error: 'NotAuthorized'});
  }

  var userQuery = {where:{username: username}};
  var blogQuery = {where:{rid: id}};

  models.User.findOne(userQuery).then(function(user) {
    if (user) {
      models.Blog.findOne(blogQuery).then(function(blog) {
        if (blog) {
          user.addFollows(blog);
          return res.status(200).json();
        }
        else {
          return res.status(404).json({error: 'UserOrBlogNotFound'});
        }
      });
    }
    else {
      return res.status(404).json({error: 'UserOrBlogNotFound'});
    }
  });

});

// Hakee käyttäjän seuraamat blogit.
router.get('/:username/follows', function(req, res, next) {
  var username = req.params['username'];
  var userQuery = {where:{username: username}};

  models.User.findOne(userQuery).then(function(user) {
    if (!user) {
      return res.status(404).json({error: 'UserNotFound'});
    }
    else {
      user.getFollows( {
        attributes: [['rid', 'id']],
        joinTableAttributes: []}).then(function(follows) {
        return res.status(200).json(follows);
      });
    }
  });
});

// Poistaa blogin seurannasta
router.delete('/:username/follows/:id', passport.authenticate('local'), function(req, res, next) {
  var username = req.params['username'];
  var id = req.params['id'];
  if ( username != req.user ) {
    return res.status(403).json({error: 'NotAuthorized'});
  }

  var userQuery = {where:{username: username}};
  var blogQuery = {where:{rid: id}};

  models.User.findOne(userQuery).then(function(user){
    if (!user) {
      return res.status(404).json({error: 'UserOrBlogNotFound'});
    }
    else {
      models.Blog.find(blogQuery).then(function(follow) {
        if ( !follow ) {
          return res.status(404).json({error: 'UserOrBlogNotFound'});
        } else {
          user.removeFollow(follow);
          return res.status(200).json();
        }

      });
    }
  });

});

// Postauksesta tykkääminen
router.put('/:username/likes/:id', passport.authenticate('local'), function(req, res, next) {
  var username = req.params['username'];
  var id = req.params['id'];
  if ( username != req.user ) {
    return res.status(403).json({error: 'NotAuthorized'});
  }

  var userQuery = {where:{username: username}};
  var postQuery = {where:{id: id}};

  models.User.findOne(userQuery).then(function(user) {
    if (user) {
      user.getLikedPosts(postQuery).then(function(liked) {
        if (!liked[0]) {
          models.Post.findOne(postQuery).then(function(post) {
            if (post) {
              post.addUserLike(user);
              var newLikes = post.likes+1;
              post.updateAttributes({likes: newLikes})
              return res.status(200).json();
            }
            else {
              return res.status(404).json({error: 'UserOrPostNotFound'});
            }
          });
        } else {
          return res.status(200).json({message: 'Liked'});
        }
      });

    }
    else {
      return res.status(404).json({error: 'UserOrPostNotFound'});
    }
  });
});

// Tykkäyksen poistaminen
router.delete('/:username/likes/:id', passport.authenticate('local'), function(req, res, next) {
  var username = req.params['username'];
  var id = req.params['id'];
  if ( username != req.user ) {
    return res.status(403).json({error: 'NotAuthorized'});
  }

  var userQuery = {where:{username: username}};
  var postQuery = {where:{id: id}};
  var thePost, theUser;
  models.User.findOne(userQuery).then(function(user){
    if (!user) {
      return res.status(404).json({error: 'UserOrPostNotFound'});
    }
    else {
      user.getLikedPosts({where: {id: id}}).then(function(post) {
        if ( !post[0] ) {
          return res.status(404).json({error: 'UserOrPostNotFound'});
        } else {
          thePost = post[0];
          return user.removeLikedPost(post[0]);
        }
      }).then(function(){
        if ( thePost ) {
          var newLikes = thePost.likes-1;
          thePost.updateAttributes({likes: newLikes});
          return res.status(200).json();
        }
      });
    }
  });

});

// Hakee tamplr:n käyttäjät.
router.get('/', function(req, res, next) {
  models.User.findAll({attributes: [
    'username',
    'name']}).then(function(users) {
      return res.json(users);
  });
});

module.exports = router;
