# Controllers
app = require('./app')

app.controller('RankCtrl', ($scope, Pagination, $modal, $http) ->

        $scope.points_to_level = (level) ->
            PARAMS = 
                level_delta: 20.0
                level_delta_increment: 10.0
            PARAMS.level_delta * level + (level - 1.0) * level * 0.5 * PARAMS.level_delta_increment

        $scope.open = () ->
            modalInstance = $modal.open({
                templateUrl: 'myModalContent.html',
                controller: ModalInstanceCtrl
            })

        $http.get('api/users')
            .then((e) ->
                $scope.players = if e.status == 200 then e.data else []
                $scope.search = {}
                $scope.pagination = Pagination.getNew(4)
                $scope.updateFilter = () ->
                    $scope.pagination.numPages = Math.ceil($scope.players.length/$scope.pagination.perPage)
                    $scope.pagination.toPageId(0)
                $scope.updateFilter()

                $scope.players.forEach( (player) -> 
                    up = $scope.points_to_level(player.level + 1)
                    down = $scope.points_to_level(player.level)
                    now = player.points
                    player.level_ratio = (now - down) / (up - down)
                )
            )
)

ModalInstanceCtrl = ($scope, $modalInstance, $http) ->

    $scope.player1 = {name : "", score: 0}
    $scope.player2 = {name : "", score: 0}

    $scope.ok = () ->
        data = {}
        data[$scope.player1.name] = parseInt($scope.player1.score)
        data[$scope.player2.name] = parseInt($scope.player2.score)
        console.log(data)

        $http.post('api/games', data)
            .success(
                $modalInstance.close()
            )

    $scope.cancel = () ->
        $modalInstance.dismiss('cancel')
