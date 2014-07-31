# Controllers

angular.module('ppApp.controllers.rank', [])
    .controller('RankCtrl', ['$scope', 'Pagination', '$modal', ($scope, Pagination, $modal) ->
        $scope.players = [
            {
                name: 'Joseph Dureau1'
                company: 'Snips'
                score: 1201
                level: 1
            }
            {
                name: 'Pierre Merienne'
                company: 'Snips'
                score: 1400
                level: 2
            }
            {
                name: 'Tristan Deleu'
                company: 'Snips'
                score: 1800
                level: 3
            }
        ]
        $scope.results = []
        $scope.search = {}
        $scope.pagination = Pagination.getNew(4)
        $scope.updateFilter = () ->
            $scope.pagination.numPages = Math.ceil($scope.players.length/$scope.pagination.perPage)
            $scope.pagination.toPageId(0)
        $scope.updateFilter()

        $scope.open = () ->
            modalInstance = $modal.open({
              templateUrl: 'myModalContent.html',
              controller: ModalInstanceCtrl,
              resolve: {
                items: () -> return $scope.players
              }
            })

    ])

ModalInstanceCtrl = ($scope, $modalInstance, items) ->

    $scope.items = items
    $scope.selected = {
        item: $scope.items[0]
    }

    $scope.ok = () ->
        $modalInstance.close($scope.selected.item)

    $scope.cancel = () ->
        $modalInstance.dismiss('cancel')