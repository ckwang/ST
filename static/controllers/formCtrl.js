//
//	Form controller for error messages.
//
superTripperApp.controller('FormCtrl', function($scope) {
  $scope.addMessages = function(messages) {
    $scope.messages = $scope.messages || [];
    $scope.messages = $scope.messages.concat(messages);
  };

  $scope.reset = function() {
    $scope.messages = [];
    $scope.form = {};
  };

});

