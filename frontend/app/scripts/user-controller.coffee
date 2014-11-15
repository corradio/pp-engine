angular.module('ppApp.controllers.user', [])
    .controller('UserCtrl', ['$scope', '$http', '$routeParams', ($scope, $http, $routeParams) ->
        $http.get('api/users/' + $routeParams.userId)
            .then((e) ->
                $scope.user = if e.status == 200 then e.data else {}
                $http.get('api/users/' + $routeParams.userId + '/games')
                    .then((e) ->
                        $scope.games = if e.status == 200 then e.data else {}
                        $scope.wins = _.filter($scope.games, $scope.won)
                        $scope.losses = _.filter($scope.games, $scope.lost)
                )
        )

        $scope.fromDate = (date) -> 
            moment(date, 'YYYYMMDDThh:mm:ss').fromNow()

        $scope.displayGain = (game) -> "#{Math.abs($scope.userGain(game))} points"

        $scope.won = (game) ->
            $scope.userScore(game) > $scope.opponentScore(game)

        $scope.lost = (game) -> !$scope.won(game)

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
