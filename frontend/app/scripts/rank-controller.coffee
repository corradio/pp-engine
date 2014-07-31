# Controllers

angular.module('ppApp.controllers.rank', [])
    .controller('RankCtrl', ['$scope', 'Pagination', '$modal', '$http', ($scope, Pagination, $modal, $http) ->
        $http.get('')
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

    $scope.ok = () ->
        data = {
            'player1': $scope.player1
            'player2': $scope.player2
            'score1':  $scope.score1
            'score2':  $scope.score2
        }
        $http.post('', data)
            .success(
                $modalInstance.close()
            )

    $scope.cancel = () ->
        $modalInstance.dismiss('cancel')