//
// The generic Controller object on client side.
// 

// Controller.Update: call update of all other controllers
// Controller.initialize: call initialize function of all other Controllers.

Controller.Update = new function() {
  this.update = function() {
//    Controller.Collaborators.update();
    Controller.EventTypes.update();
//    Controller.Event.update();
//    Controller.MyTrips.update();
    $.get('permission', function(response) {
      // Logout to triplist page if the user does not have permission to view this page
      if (response.permission === 0) {
        alert('You do not have permission to view this page.');
        $('#home-btn').click();
      }
      Model.Permission.set(response.permission, true);
    });
  };
  this.initialize = function() {
    $.get('permission', function(response) {
      if (response.permission === 0) {
        alert('You do not have permission to view this page.');
        $('#home-btn').click();
      }
      Model.Permission.set(response.permission, true);
    });
  };
}
Controller.initialize = function() {
  this.EventTypes.initialize();
//  this.Collaborators.initialize();
  this.Update.initialize();
  this.Event.initialize();
  this.Map.initialize();
//  this.MyTrips.initialize();
}
