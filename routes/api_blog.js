var express = require('express');
var router = express.Router();

var models = require('../models');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;

/*
Tässä tiedostossa järjestyksessä:
- Uuden blogin lisäys: POST <ok>
- Blogin tietojen hakeminen: GET <ok>
- Poistaa blogin: DELETE <ok>

- Lisää kirjoittajan blogille: PUT <ok>
- Poistaa kirjoittajan blogilta: DELETE <ok>

- Lisää uuden postauksen blogiin: POST <ok>

- Hakee blogin seuraajat: GET <ok>
*/

// Lisää uuden blogin.
router.post('/', passport.authenticate('local', {session: false}), function(req, res, next) {

  var blogName = req.body.name;
  if ( !blogName ) {
    res.status(400).json({error: 'EmptyName'})
  }

  models.Blog.create({
    name: blogName
  }).then(function(blog) {
    blog.updateAttributes({ rid: blog.id.toString() });
    models.User.find({where:{username: req.user}}).then(function(user) {
      blog.addAuthor(user);
    });
    return res.status(201).json({"id": blog.rid });
  },
  function(err) {
    return res.status(500).json(err);
  });

});

// Hakee blogin tiedot.
router.get('/:id', function(req, res, next) {

  var id = req.params['id'].toString();
  var attributes = [['rid', 'id'], 'name'];
  var query = {where: {rid: id},
               attributes: attributes};

  models.Blog.findOne(query).on('success', function(blog) {
    if (blog) {
      return res.status(200).json(blog);
    }
    else {
      return res.status(404).json({error: 'BlogNotFound'});
    }
  });
});

// Poistaa blogin.
router.delete('/:id', passport.authenticate('basic', {session: false}), function(req, res, next) {

  var blogId = req.params['id'].toString();
  var query = {where: {rid: blogId}};
  if ((/[a-z][a-z0-9_]*$/.test(blogId))) {
    return res.status(403).json({error: 'UsersDefaultBlog'});
  }
  var theBlog;
  models.Blog.findOne(query).then(function(blog) {
    if (blog) {
      blog.getAuthors({where:{username: req.user}}).then(function(author) {
        if (author[0]) {
          theBlog = blog;
          return blog.setAuthors([]);
        }
      }).then(function() {
        if ( theBlog ) {
          theBlog.destroy();
          return res.status(200).json();
        } else {
          return res.status(403).json({error: 'NotBlogAuthor'});
        }
      });
    }
    else {
      return res.status(404).json({error: 'BlogNotFound'});
    }
  });
});

// Lisää käyttäjän blogiin.
router.put('/:id/author/:username', passport.authenticate('basic', {session: false}), function(req, res, next) {
  var blogId = req.params['id'].toString();
  var username = req.params['username'];

  if ((/[a-z][a-z0-9_]*$/.test(blogId))) {
    return res.status(403).json({error: 'Forbidden'});
  }

  var idQuery = {where: {rid: blogId}};
  var userQuery = {where: {username: username}};
  models.User.find({where:{username: req.user}}).on('success', function(author) {
    if (!author) {
      return res.status(404).json({error: 'NotFound'});
    }
    else {
      author.getAuthoredBlogs(idQuery).then(function(blogs) {
        if (!blogs[0]) {
          return res.status(403).json({error: 'Forbidden'});
        }
        else {
          models.User.find(userQuery).on('success', function(user) {
            if (!user) {
              return res.status(404).json({error: 'NotFound'});
            }
            else {
              user.addAuthoredBlog(blogs[0]);
              return res.status(200).json();
            }
          });
        }
      });
    }
  });
});

// Poistaa kirjoittajan blogista.
router.delete('/:id/author/:username', passport.authenticate('basic', {session: false}), function(req, res, next) {
  var blogId = req.params['id'].toString();
  var username = req.params['username'];

  if ((/[a-z][a-z0-9_]*$/.test(blogId)) ) {
    return res.status(403).json({error: 'Forbidden'});
  }

  var idQuery = {where: {rid: blogId}};
  var userQuery = {where: {username: username}};

  models.User.find({where:{username:req.user}}).on('success', function(author) {
    if (!author) {
      return res.status(404).json({error: 'BlogOrUserNotFound'});
    }
    else {
      author.getAuthoredBlogs(idQuery).then(function (blog) {
        if (!blog[0]) {
          return res.status(403).json({error: 'Forbidden'});
        }
        else {
          blog[0].getAuthors(userQuery).then(function(user) {
            if (!user[0]) {
              return res.status(404).json({error: 'BlogOrUserNotFound'});
            } else {
              blog[0].removeAuthor(user[0]);
              return res.status(200).json();
            }
          },function(err) {
            return res.status(500).json({error: 'ServerError'});
          });
        }
      })
    }
  });

});

// Lähettää uuden blogipostauksen.
router.post('/:id/posts', passport.authenticate('local'), function(req, res, next) {
  var blogId = req.params['id'].toString();
  var postTitle = req.body.title;
  var postText = req.body.text;
  if (!postText) {
    return res.status(400).json({error: 'EmptyTextField'});
  }

  var query = {where: {rid: blogId}};
  models.Blog.findOne(query).on('success', function(blog) {
    if (!blog) {
      return res.status(404).json({error: 'BlogNotFound'});
    }
    else {
      blog.getAuthors({where:{username:req.user}}).then(function(author) {
        if ( author == null || !author[0] ) {
          return res.status(403).json({error: 'NotBlogAuthor'});
        } else {
          models.Post.create({
            title: postTitle,
            text: postText
          }).then(function(post){
            blog.addBlogpost(post);
            post.setAuthor(author[0]);
            post.updateAttributes({author: req.user})

            var returnId = { "id": post.id };
            return res.status(201).json(returnId);
          }, function(err) {
            return res.status(500).json({error: 'ServerError'});
          });
        }
      });

    }
  },
  function(err) {
    return res.status(500).json({error: 'ServerError'});
  });

});

// Hakee 10 uusinta blogikirjoitusta.
router.get('/:id/posts', function(req, res, next) {
  var blogId = req.params['id'].toString();
  var postAmount = req.body.amount || 10;
  var query = {where: {rid: blogId}};
  models.Blog.findOne(query).on('success', function(blog) {
    if (!blog) {
      return res.status(404).json({error: 'BlogNotFound'});
    }
    else {
      blog.getBlogposts({
        attributes: ['id', 'title', 'text', 'author'],
        joinTableAttributes: []
      }).then(function(posts) {
        var returnee = [];
        if ( posts.length < postAmount ) {
          return res.status(200).json(posts);
        } else {
          for ( i = posts.length-postAmount; i < posts.length; i++ ) {
            returnee = returnee.concat(posts[i]);
          };
          return res.status(200).json(returnee);
        }
      });
    }
  },
  function(err) {
    return res.status(500).json({error: 'ServerError'});
  });
});

router.get('/', function(req, res, next) {
  var postAmount = req.body.amount || 10;
  models.Blog.findAll({attributes: [['rid', 'id'], 'name']}).on('success', function(blogs) {
    return res.status(200).json(blogs);
  },
  function(err) {
    return res.status(500).json({error: 'ServerError'});
  });
});

// Hakee blogin seuraajat
router.get('/:id/followers', function(req, res, next) {
  var blogId = req.params['id'].toString();
  var query = {where:{rid: blogId}};

  models.Blog.findOne(query).on('success', function(blog) {
    if (!blog) {
      return res.status(404).json({error: 'BlogNotFound'});
    }
    else {
      blog.getFollows({ attributes: ['username'], joinTableAttributes: []}).then(function(users) {
        return res.status(200).json(users);
      });
    }
  },
  function(err) {
    return res.status(500).json({error: 'ServerError'});
  });
});

module.exports = router;
