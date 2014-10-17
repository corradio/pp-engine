# Declare app level module which depends on filters, and services

app = angular.module('ppApp', ['ngRoute', 'ngResource', 'mm.foundation', 'simplePagination', 'ppApp.controllers.user'])
    .config(['$routeProvider', ($routeProvider) ->
        $routeProvider
            .when('/rank', {templateUrl: 'pages/rank.html', controller: 'RankCtrl'})
            .when('/user/:userId', {templateUrl: 'pages/user.html', controller: 'UserCtrl'})
            .otherwise({redirectTo: '/rank'})
    ])

module.exports = app
