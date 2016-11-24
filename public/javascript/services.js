'use strict';

/* Services */

var tamblrServices = angular.module('tamplrServices', ['ngResource']);

tamblrServices.factory('Blogs', ['$resource',
function($resource) {
  return $resource('api/blog/', {}, {
    query: {method:'GET', isArray:true}
  });
}]);

tamblrServices.factory('Blog', ['$resource',
function($resource) {
  return $resource('api/blog/:blogId', {}, {
    query: {method:'GET', params:{blogId:'blogId'}, isObject:true},
    post: {method:'POST', params:{blogId:'blogId'}}
  });
}]);

tamblrServices.factory('Blogposts', ['$resource',
function($resource) {
  return $resource('api/blog/:blogId/posts', {}, {
    query: {method:'GET', params:{blogId:'blogId'}, isArray:true},
    post: {method:'POST', params:{blogId:'blogId'}}
  });
}]);

tamblrServices.factory('Users', ['$resource',
function($resource) {
  return $resource('api/user/', {}, {
    query: {method:'GET', isArray:true}
  });
}]);

tamblrServices.factory('User', ['$resource',
function($resource) {
  return $resource('api/user/:userId', {}, {
    query: {method:'GET', params:{userId:'userId'}, isObject:true}
  });
}]);

tamblrServices.factory('Userblogs', ['$resource',
function($resource) {
  return $resource('api/user/:userId/blogs', {}, {
    query: {method:'GET', params:{userId:'userId'}, isArray:true}
  });
}]);

tamblrServices.factory('Userfollows', ['$resource',
function($resource) {
  return $resource('api/user/:userId/follows', {}, {
    query: {method:'GET', params:{userId:'userId'}, isArray:true}
  });
}]);

tamblrServices.factory('Posts', ['$resource',
function($resource) {
  return $resource('api/post/', {}, {
    query: {method:'GET', isArray:true}
  });
}]);

tamblrServices.factory('Post', ['$resource',
function($resource) {
  return $resource('api/post/:postId', {}, {
    query: {method:'GET', params:{postId:'postId'}, isObject:true}
  });
}]);

tamblrServices.factory('Postcomments', ['$resource',
function($resource) {
  return $resource('api/post/:postId/comments', {}, {
    query: {method:'GET', params:{postId:'postId'}, isArray:true},
    save: {method:'POST', params:{postId:'postId'}}
  });
}]);

tamblrServices.factory('PostLikes', ['$resource',
function($resource) {
  return $resource('api/user/:userId/likes/:postId', {}, {
    put: {method:'PUT', params:{userId:'userId', postId:'postId'}},
    delete: {method:'DELETE', params:{userId:'userId', postId:'postId'}}
  });
}]);
