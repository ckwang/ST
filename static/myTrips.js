//
//	Controls the "MyTrip" dropdown
//  Updates the dropdown when there's new data
//

superTripperApp.controller("MyTripsCtrl", function($scope, $modal, Params) {
  $scope.TripsURL = Params.TRIPS_URL;

  $scope.openCreateTripModal = function() {
    $modal.open({
      templateUrl: 'createTripModal.html',
      scope: $scope,
      controller: CreateTripModalCtrl
    });
  };
});

var CreateTripModalCtrl = function ($scope, $modalInstance) {

  $scope.commitChanges = function () {
    $modalInstance.close($scope.tempDataCollaborators);
  };

  $scope.closeCreateTripModal = function () {
    $modalInstance.dismiss('cancel');
  };
};