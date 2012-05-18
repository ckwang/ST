/*
*	Functions for client-side checking on register data
*/


// Check if a username is consisted of only legal characters. Return true if valid
var checkUsername = function(username) {
	var regex = new RegExp("^[a-zA-Z0-9_\.]+$");
	if (username.length === 0) {
		return false;
	}
	if (username.match(regex)) {
		return true;
	}
	return false;
}
$(document).ready(function() {
	// Remove all errors when clicking on the reset button
	var reset = function() {
		$(".error").removeClass('error');
		$(".help-inline").remove();
		$(".alert").remove();
	};
	// Create an error message and put it on the page
	var alertMessage = function(message) {
		var errorHtml = '<div class="alert alert-error fade in">\
			<a class="close" data-dismiss="alert" href="#">×</a><strong>'
			+ message + '</strong></div>';
		$(errorHtml).prependTo('#mainContainer');
	};
	// Checking before submit
	$("form").submit(function() {
		var shouldSubmit = true;
		reset();
		var username = $('#username');
		var password = $('#password');
		var confirmPassword = $('#confirmPassword');
		// Check if username is valid
		// If not...
		if (!checkUsername(username.val())) {
			$('#usernameGroup').addClass('error');
			if (username.val().length === 0) {
				$('<span class="help-inline">Username cannot be empty.</span>').appendTo("#usernameControl");
				alertMessage("Username cannot be empty.");
			} else {
				$('<span class="help-inline">Username must be consisted of only letters, numbers, underlines and dots.</span>').appendTo("#usernameControl");
				alertMessage("Username must be consisted of only letters, numbers, underlines and dots.");
			}
			shouldSubmit = false;
		}
		// Check if password is non-empty
		if (password.val().length === 0) {
			$('#passwordGroup').addClass('error');
			$('<span class="help-inline">Password cannot be empty.</span>').appendTo("#passwordControl");
			alertMessage("Password cannot be empty.");
			shouldSubmit = false;
		}
		// Check if password is the same as confirm password
		if (password.val() !== confirmPassword.val()) {
			$('#passwordGroup').addClass('error');
			$('#confirmPasswordGroup').addClass('error');
			$('<span class="help-inline">Password and Confirm Password must argee.</span>').appendTo("#confirmPasswordControl");
			alertMessage("Password and Confirm Password must argee.");
			shouldSubmit = false;
		}
		return shouldSubmit;
	});
	$("#reset").click(function(){ 
		reset();
	});
});