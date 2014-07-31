angular.module('ppApp.controllers.user', [])
    .controller('UserCtrl', ['$scope', ($scope) ->
        $scope.user = {name: "Pierre", score: 2360};
      
        $scope.games = [
            {
                date : "2014-07-26T20:12:05",
                players : [
                    {name : "Julie", score : 21, gain : 253},
                    {name : "Pierre", score : 18, gain : -200}
                ]
            },{
                date : "2014-07-28T12:31:09",
                players : [
                    {name : "Pierre", score : 21, gain : 400},
                    {name : "Tristan", score : 11, gain : -22}
                ]
            }
        ];

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