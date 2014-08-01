# Controllers

angular.module('ppApp.controllers.rank', [])
    .controller('RankCtrl', ['$scope', 'Pagination', '$modal', '$http', ($scope, Pagination, $modal, $http) ->
        $http.get('api/users')
            .then((e) ->
                $scope.players = if e.status == 200 then e.data else []
                $scope.search = {}
                $scope.pagination = Pagination.getNew(4)
                $scope.updateFilter = () ->
                    $scope.pagination.numPages = Math.ceil($scope.players.length/$scope.pagination.perPage)
                    $scope.pagination.toPageId(0)
                $scope.updateFilter()

                $scope.open = () ->
                    modalInstance = $modal.open({
                        templateUrl: 'myModalContent.html',
                        controller: ModalInstanceCtrl
                    })

            )
    ])

ModalInstanceCtrl = ($scope, $modalInstance, $http) ->

    $scope.player1 = {name : "", score: 0}
    $scope.player2 = {name : "", score: 0}

    $scope.ok = () ->
        console.log($scope.player1)
        
        data = {}
        data[$scope.player1.name] = $scope.player1.score
        data[$scope.player2.name] = $scope.player2.score
        console.log(data)

        $http.post('api/games', data)
            .success(
                $modalInstance.close()
            )

    $scope.cancel = () ->
        $modalInstance.dismiss('cancel')