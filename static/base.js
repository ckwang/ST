var superTripperApp = angular.module('superTripperApp', ['Filters']);

superTripperApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
});
