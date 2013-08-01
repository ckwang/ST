var superTripperApp = angular.module('superTripperApp', []);
superTripperApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
});
