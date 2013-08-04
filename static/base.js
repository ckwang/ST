var superTripperApp = angular.module('superTripperApp', ['Filters', 'ui.bootstrap']);

superTripperApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
});
