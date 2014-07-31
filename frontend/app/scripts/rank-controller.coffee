# Controllers

angular.module('ppApp.controllers.rank', [])
    .controller('RankCtrl', ['$scope', ($scope) ->
        $scope.players = [
            {
                name: 'Joseph Dureau'
                company: 'Snips'
                score: 1200
            },
            {
                name: 'Pierre Merienne'
                company: 'Snips'
                score: 1400
            },
            {
                name: 'Tristan Deleu'
                company: 'Snips'
                score: 1800
            }
        ]
    ])