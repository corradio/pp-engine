angular.module('ppApp.controllers.user', [])
    .controller('UserCtrl', ['$scope', ($scope) ->
        $scope.user = {name: "Pierre", score: 2360}
        
    ])