//
//	Initialize the generic Model, View and Controller
//
var View = {};
var Model = {};
var Controller = {};
var REFRESH_TIME = 5000;	// Time interval for auto-refreshing in milliseconds
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