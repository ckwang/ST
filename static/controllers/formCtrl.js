//
//	Form controller for error messages.
//
superTripperApp.controller('FormCtrl', function($scope) {
  $scope.addMessages = function(messages) {
    $scope.messages = $scope.messages || [];
    $scope.messages = $scope.messages.concat(messages);
  };

  $scope.removeMessage = function(index) {
    $scope.messages.splice(index, 1);
  }

  $scope.reset = function() {
    $scope.messages = [];
    $scope.user = {};
    $scope.form.$setPristine();
  };

});

