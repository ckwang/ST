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
  $scope.dataCollaborators = {};
  $scope.dataEvents = {};
  $scope.dataPermission = 0;

  $scope.Update = function() {
    $.get(URL_FOR['getTrips'], function(response) {
      $scope.dataTrips = response.trips;
      $scope.$apply();
    });

    $.get('collaborators', function(response) {
      $scope.dataCollaborators = response.collaborators;
      $scope.$apply();
    });

    $.get('permission', function(response) {
      // Logout to triplist page if the user does not have permission to view this page
      if (response.permission === 0) {
        alert('You do not have permission to view this page.');
        $('#home-btn').click();
      }
      $scope.dataPermission = response.permission;
      $scope.$apply();
    });

    $.get('events', function(response) {
      $scope.dataEvents = response.events;
      $scope.dataPermission = response.permission;
      $scope.dataLogs = response.logs;
      $scope.$apply();
    });

  };

  var periodicUpdate = function() {
    $scope.Update();
    $timeout(periodicUpdate, Params.REFRESH_TIME);
  };

  periodicUpdate();
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
