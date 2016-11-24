'use strict';

/* Tamplr app functions */

var tamplrApp = angular.module('tamplrApp', [
  'ngRoute',
  'tamplrControllers',
  'tamplrServices'
]);

tamplrApp.run(function ($rootScope, $location, $http) {
    $http.get('/confirm-login')
        .success(function (user) {
            if (user) {
                $rootScope.user = user;
                console.log(user);
            }
        });
});

tamplrApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/main', {
        templateUrl: 'partial/main.html',
        controller: 'tamplrMainCtrl'
      }).
      when('/blog/:blogId', {
        templateUrl: 'partial/blog-detail.html',
        controller: 'blogDetailCtrl'
      }).
      when('/login', {
        templateUrl: 'partial/login.html',
        controller: 'loginCtrl'
      }).
      when('/signup', {
        templateUrl: 'partial/register.html',
        controller: 'signupCtrl'
      }).
      when('/login/:tag', {
        templateUrl: 'partial/login.html',
        controller: 'loginCtrl'
      }).
      when('/user/:userId', {
        templateUrl: 'partial/user.html',
        controller: 'userCtrl'
      }).
      when('/post/:postId', {
        templateUrl: 'partial/post.html',
        controller: 'postCtrl'
      }).
      otherwise({
        redirectTo: '/main'
      });
  }]);
