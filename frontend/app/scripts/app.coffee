# Declare app level module which depends on filters, and services

app = angular.module('ppApp', ['ngRoute', 'ppApp.controllers'])
    .config(['$routeProvider', ($routeProvider) ->
        $routeProvider
            .when('/rank', 
                {templateUrl: 'pages/rank.html', controller: 'RankCtrl'})
            .otherwise({redirectTo: '/rank'})
    ])