# Controllers
app = require('./app')

app.controller('RankCtrl', ($scope, Pagination, $modal, $http) ->

    $scope.points_to_level = (level) ->
        PARAMS = 
            level_delta: 20.0
            level_delta_increment: 10.0
        PARAMS.level_delta * level + (level - 1.0) * level * 0.5 * PARAMS.level_delta_increment

    $scope.encodeURI = encodeURI

    $scope.load = () ->
        $http.get('api/snips_users')
            .then((e) ->
                snips_users = if e.status == 200 then e.data else []
                snips_users_by_email = {}
                snips_users.forEach( (p) -> snips_users_by_email[p.email] = p )
                $http.get('api/users')
                    .then((e) ->
                        $scope.players = if e.status == 200 then e.data else []
                        $scope.search = {}
                        $scope.pagination = Pagination.getNew(10)
                        $scope.updateFilter = () ->
                            $scope.pagination.numPages = Math.ceil($scope.players.length/$scope.pagination.perPage)
                            $scope.pagination.toPageId(0)
                        $scope.updateFilter()

                        $scope.players.forEach( (player) -> 
                            up = $scope.points_to_level(player.level + 1)
                            down = $scope.points_to_level(player.level)
                            now = player.points
                            # Convert name (which is email in the db) to nickname
                            snips_player = snips_users_by_email[player.name]
                            player.name = snips_player?.nickname
                            player.email = snips_player?.email
                            player.level_ratio = (now - down) / (up - down)
                        )
                    )
        )

    $scope.open = () ->
        modalInstance = $modal.open({
            templateUrl: 'myModalContent.html',
            controller: ModalInstanceCtrl
        })
        modalInstance.result.then(() -> $scope.load)

    $scope.load()
)

ModalInstanceCtrl = ($scope, $modalInstance, $http) ->
    $http.get('api/snips_users')
        .then((e) ->
            $scope.snips_users = if e.status == 200 then e.data else []
        )

    $scope.ok = () ->
        if $scope.player1? and $scope.player2? and $scope.score1? and $scope.score2?
            data = {}
            data[$scope.player1] = parseInt($scope.score1)
            data[$scope.player2] = parseInt($scope.score2)
            console.log(data)

            $http.post('api/games', data)
                .success( () ->
                    $modalInstance.close()
                )

    $scope.cancel = () ->
        $modalInstance.dismiss('cancel')
