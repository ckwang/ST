var superTripperApp = angular.module('superTripperApp', ['ui.bootstrap']);

superTripperApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
});
