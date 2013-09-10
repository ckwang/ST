var superTripperApp = angular.module('superTripperApp', ['ui.bootstrap','ui.sortable']);

superTripperApp.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});