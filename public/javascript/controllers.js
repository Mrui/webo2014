'use strict';

/* Angular controllers */

var tamblrControllers = angular.module('tamplrControllers', []);

tamblrControllers.controller('tamplrMainCtrl', ['$rootScope', '$scope', 'Blogs', 'Users', 'Posts', function($rootScope, $scope, Blogs, Users, Posts) {
  $scope.logged = $rootScope.user;
  console.log("mainCtrl logged: "+ $scope.logged);
  $scope.blogs = Blogs.query();
  $scope.users = Users.query();
  $scope.posts = Posts.query();
  if ( $scope.logged )
  {

  }
}]);

tamblrControllers.controller('blogDetailCtrl', ['$rootScope', '$scope','$routeParams', 'Blog', 'Blogposts', function($rootScope, $scope, $routeParams, Blog, Blogposts) {
  $scope.logged = $rootScope.user;
  $scope.blog = Blog.query({blogId: $routeParams.blogId});
  $scope.posts = Blogposts.query({blogId: $routeParams.blogId});

  $scope.postForm = {};
  $scope.postForm.submit = function(item, event){
    var dataObject = {
      title: $scope.postForm.title,
      text: $scope.postForm.text };
    var response = Blogposts.post({blogId: $routeParams.blogId}, dataObject);
    console.log(response);
  }
}]);

tamblrControllers.controller('loginCtrl', ['$rootScope', '$scope','$routeParams', '$http',
function($rootScope, $scope, $routeParams, $http) {
  $scope.logged = $rootScope.user;
  if ( $routeParams.tag ) {
    $scope.failure = true;
  } else {
    $scope.failure = false;
  }
  $scope.logForm = {};
  $scope.logForm.username = "";
  $scope.logForm.password = "";
  $scope.logForm.submit = function(item, event){
    var dataObject = {
      kayttaja: $scope.logForm.username,
      salasana: $scope.logForm.password };
    var responsePromise = $http.post("/login", dataObject, {});
    responsePromise.success(function(dataFromServer, status, headers, config) {
      alert("Kirjautuminen onnistui");
      console.log("Kirjauduttu käyttäjänä: " + dataObject.kayttaja);
      window.location.reload();
    });
    responsePromise.error(function(dataFromServer, status, headers, config) {
      alert("Kirjautuminen epäonnistui");
    });
  }
}]);

tamblrControllers.controller('userCtrl', ['$rootScope', '$scope','$routeParams', 'User', 'Userblogs', 'Userfollows',
 function($rootScope, $scope, $routeParams, User, Userblogs, Userfollows) {
  $scope.logged = $rootScope.user;
  $scope.user = User.query({userId: $routeParams.userId});
  $scope.blogs = Userblogs.query({userId: $routeParams.userId});
  $scope.follows = Userfollows.query({userId: $routeParams.userId});
}]);

tamblrControllers.controller('postCtrl', ['$rootScope', '$scope','$routeParams', '$http', 'Post', 'Postcomments', 'PostLikes',
function($rootScope, $scope, $routeParams, $http, Post, Postcomments, PostLikes) {
  $scope.logged = $rootScope.user;
  console.log("Logannut käyttäjänä: " + $scope.logged);
  $scope.post = Post.query({postId: $routeParams.postId});
  $scope.comments = Postcomments.query({postId: $routeParams.postId});

  // Tykkäyksen aliohjelma
  $scope.like = function(item, event) {
    var responsePromise = PostLikes.put({userId: $scope.logged, postId: $routeParams.postId});
  }

  // Uuden kommentin lisäyksen aliohjelmat
  $scope.newComment = {};
  $scope.newComment.submit = function(item, event) {
    var dataObject = {
      text: $scope.newComment.text
    };
    var responsePromise = Postcomments.save({postId: $routeParams.postId}, dataObject);
    window.location.reload();
  }
}]);

tamblrControllers.controller('signupCtrl', ['$rootScope','$scope','$http',
function($rootScope, $scope, $http) {
  $scope.logged = $rootScope.user;
  $scope.regForm = {};
  $scope.regForm.name = "Koko nimi";
  $scope.regForm.password = "";
  $scope.regForm.username = "Käyttäjänimi";
  $scope.regForm.submit = function(item, event){
    var dataObject = {
      username: $scope.regForm.username,
      password: $scope.regForm.password,
      name: $scope.regForm.name };

    var responsePromise = $http.post("/api/user", dataObject, {});
    responsePromise.success(function(dataFromServer, status, headers, config) {
      alert("Uusi käyttäjä " + dataObject.username + " lisätty onnistuneesti.");
      window.location.reload();
    });
    responsePromise.error(function(dataFromServer, status, headers, config) {
      alert("Uuden käyttäjän lisäys epäonnistui");
    });
  }
}]);
