//
//  Initialize the generic Model, View and Controller
//

superTripperApp.factory("Params", function() {
  return {
    REFRESH_TIME: 5000,  // Time interval between auto-refreshing in milliseconds
    GET_USER_ID_URL: URL_FOR.getUserID,
    TRIPS_URL: URL_FOR.trips,
    GET_TRIPS_URL: URL_FOR.getTrips
  };
});

superTripperApp.controller('TripCtrl', function($scope, $timeout, Params) {

  $scope.dataLogs = {};
  $scope.dataTrips = {};

  $scope.Update = function() {
    $.get(URL_FOR['getTrips'], function(response) {
      $scope.dataTrips = response.trips;
      $scope.$apply();
      console.log($scope.dataTrips);
      console.log(Params.TRIPS_URL);
    });
  };

  $timeout(function() {
    $scope.Update();
  }, Params.REFRESH_TIME);
});

var View = {};
var Model = {};
var Controller = {};
var REFRESH_TIME = 5000;  // Time interval for auto-refreshing in milliseconds
$(document).ready(function() {
  Controller.initialize();
  View.initialize();
  
  Model.Permission.bind(Permission.setElementPermission);
  
  // Auto-refresh
  var timeout = function() {
    setTimeout(function() {
      Controller.Update.update();
      timeout();
    }, REFRESH_TIME);
  };
  timeout();
});
