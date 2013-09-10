//
//	Controls the "MyTrip" dropdown
//  Updates the dropdown when there's new data
//

superTripperApp.controller("MyTripsCtrl", function($scope, Params) {
  $scope.TripsURL = Params.TRIPS_URL;

  $scope.isCreateTripModalOpenFlag = false;

  $scope.openCreateTripModal = function() {
    $scope.isCreateTripModalOpenFlag = true;
  };

  $scope.closeCreateTripModal = function() {
    $scope.isCreateTripModalOpenFlag = false;
  }
});