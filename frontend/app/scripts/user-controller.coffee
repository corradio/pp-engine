angular.module('ppApp.controllers.user', [])
    .controller('UserCtrl', ['$scope', '$http', '$routeParams', ($scope, $http, $routeParams) ->
        $scope.user =  $http.get('api/users/' + $routeParams.userId)
        $scope.games = $http.get('api/users/' + $routeParams.userId + '/games')

        $scope.fromDate = (date) -> moment(date, 'YYYYMMDDThh:mm:ss').fromNow()

        $scope.displayGain = (game) -> "#{Math.abs($scope.userGain(game))} points"

        $scope.won = (game) -> 
            $scope.userScore(game) > $scope.opponentScore(game)

        $scope.userScore = (game) ->
            player = game.players.filter (player) -> player.name == $scope.user.name
            player[0].score

        $scope.userGain = (game) ->
            player = game.players.filter (player) -> player.name == $scope.user.name
            player[0].gain

        $scope.opponentScore = (game) ->
            player = game.players.filter (player) -> player.name != $scope.user.name
            player[0].score

        $scope.opponent = (game) ->
            player = game.players.filter (player) -> player.name != $scope.user.name
            player[0].name

    ])