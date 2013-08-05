//
//	Updates the trip list by using AJAX calls
//
superTripperApp.controller('TriplistCtrl', function($scope, $http, $timeout) {
  //TODO(yuchikuo): create a service called "constants"
  $scope.REFRESH_TIME = 5000;	// Time interval between auto-refreshing in milliseconds
  $scope.trips = [];
  var _updateTrips = function(data) {
    $scope.trips = data.trips;
    $scope.$apply();
  };
  $scope.opts = {
    backdropFade: true,
    dialogFade:true,
  };
  $scope.UpdateTrips = function() {
    $http.get('get').success(_updateTrips);
  };
  $scope.Init = function() {
    $scope.UpdateTrips();
    $timeout(function() {
      $scope.UpdateTrips();
    }, $scope.REFRESH_TIME);
  };
  $scope.deleteTrip = function(trip_id) {
    //TODO(yuchikuo): $https doesn't quite work
    //$http.post('delete', {'trip_id': trip_id}).success(_updateTrips);
    $.post('delete/', {'trip_id': trip_id}, _updateTrips);
  };
  $scope.openCreateTrip = function() {
    $scope.createTripOpen = true;
  };
  $scope.closeCreateTrip = function() {
    $scope.createTripOpen = false;
  }
});
