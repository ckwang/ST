superTripperApp.controller('CollaboratorsCtrl', function($scope, $modal, $http, $timeout, Params) {
//  $scope.tempDataCollaborators;
  //$scope.isOpenFlag = false;

  // open the collaborator modal
  $scope.open = function() {
//    $scope.reset();
//    $scope.isOpenFlag = true;
    var modalInstance = $modal.open({
      templateUrl: 'collaboratorsModal.html',
      scope: $scope,
      controller: CollaboratorsModalCtrl
    });

    modalInstance.result.then($scope.commitChanges);

  };

//  // close the collaborator modal
//  $scope.close = function() {
//    $scope.isOpenFlag = false;
//  };

//  // reset the state of the modal
//  $scope.reset = function() {
//    $scope.tempDataCollaborators = angular.copy($scope.dataCollaborators);
//    $scope.isDirtyFlag = false;
//    $scope.clearInvite();
//  };

//  // set the modal as dirty
//  $scope.setDirty = function() {
//    $scope.isDirtyFlag = true;
//  };

  $scope.commitChanges = function (newDataCollaborators) {
    var getPermission = function(collaborators, id) {
      for (var i = 0; i < collaborators.length; i++) {
        var c = collaborators[i];
        if (c.id === id) {
          return c.permission;
        }
      }
      return undefined;
    };

    newDataCollaborators.forEach(function(c) {
      var oldPermission = getPermission($scope.dataCollaborators, c.id);
      if (oldPermission && c.permission !== oldPermission) {
        $.post('collaborators/update', {'collaborator_id': c.id, 'permission': c.permission}, $scope.update);
      }
    });
  };

  $scope.update = function(response) {
    $scope.dataCollaborators = response.collaborators;
    $scope.$apply();
  };

//  // Change permission of collaborators
//  $scope.change = function(callback) {
//    var collaborators = Model.Collaborators.get();
//    // Post all updates that have changes in them
//    collaborators.forEach(function(c) {
//      var newPermission = View.Collaborators.getNewPermission(c.id);
//      // If there's input and input is different from the original permission...
//      if ((newPermission) && (newPermission !== c.permission)) {
//        $.post('collaborators/update', {'collaborator_id': c.id, 'permission': newPermission});
//      }
//    });
//    that.update(undefined, callback);
//  }

});

var CollaboratorsModalCtrl = function ($scope, $modalInstance) {
  $scope.tempDataCollaborators = angular.copy($scope.dataCollaborators);
  $scope.isDirtyFlag = false;

  $scope.invite = function(username, permission) {
    $scope.clearInvite();
    if (username) {
      // Find the userID of this user
      $.get(URL_FOR.getUserID, {'username': username}, function(response) {
        var id = response.id;
        if(id) {
          $.post("collaborators/add", {'user_id': id, 'permission': permission}, $scope.update);
        }
      });
    }
  };

  $scope.remove = function(cid) {
    $.post('collaborators/delete', {'collaborator_id': cid}, $scope.update);
  };

  $scope.update = function(response) {
    $scope.dataCollaborators = response.collaborators;
    $scope.tempDataCollaborators = angular.copy($scope.dataCollaborators);
    $scope.$apply();
  };

  // clear the contents of the invite form
  $scope.clearInvite = function() {
    $scope.collaborators = {};
  };

  // set the modal as dirty
  $scope.setDirty = function() {
    $scope.isDirtyFlag = true;
  };

  $scope.commitChanges = function () {
    $modalInstance.close($scope.tempDataCollaborators);
  };

  $scope.close = function () {
    $modalInstance.dismiss('cancel');
  };
};