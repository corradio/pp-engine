angular.module('ppApp.controllers.user', [])
    .controller('UserCtrl', ['$scope', '$http', '$routeParams', ($scope, $http, $routeParams) ->
        $http.get('api/users/' + encodeURI($routeParams.userId))
            .then((e) ->
                $scope.user = if e.status == 200 then e.data else {}
                $http.get('api/users/' + encodeURI($routeParams.userId) + '/games')
                    .then((e) ->
                        $scope.games = if e.status == 200 then e.data else {}
                        $scope.wins = _.filter($scope.games, $scope.won)
                        $scope.losses = _.filter($scope.games, $scope.lost)
                        $http.get('api/snips_users')
                            .then((e) ->
                                snips_users = if e.status == 200 then e.data else []
                                snips_users_by_email = {}
                                snips_users.forEach( (p) -> snips_users_by_email[p.email] = p )
                                $scope.user.name = snips_users_by_email[$scope.user.name]?.nickname
                                $scope.games.forEach( (g) -> 
                                    g.players.forEach (p) -> p.name = snips_users_by_email[p.name]?.nickname
                                    player = g.players.filter (player) -> player.name == $scope.user.name
                                    opponent = g.players.filter (player) -> player.name != $scope.user.name
                                    g.userScore = player[0].score
                                    g.userGain = player[0].gain
                                    g.opponentScore = opponent[0].score
                                    g.opponent = opponent[0].name
                                    g.displayGain = "#{Math.abs(g.userGain)} points"
                                    g.won = g.userScore > g.opponentScore
                                    g.lost = not g.won
                                )
                                console.log $scope.games
                            )
                )
        )

        $scope.fromDate = (date) -> 
            moment(date, 'YYYYMMDDThh:mm:ss').fromNow()

    ])
