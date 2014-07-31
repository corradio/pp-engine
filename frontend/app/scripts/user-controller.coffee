angular.module('ppApp.controllers.user', [])
    .controller('USerCtrl', ['$scope', ($scope) ->
        $scope.user = {name: "Pierre", score: 2360}
        
    ])