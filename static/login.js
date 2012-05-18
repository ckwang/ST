$(document).ready(function() {
	var reset = function() {
		$(".warning").removeClass('warning');
		$(".help-inline").remove();
		$(".alert").remove();
	};
	var alertMessage = function(message) {
		var errorHtml = '<div class="alert alert-info fade in">\
			<a class="close" data-dismiss="alert" href="#">×</a><strong>'
			+ message + '</strong></div>';
		$(errorHtml).prependTo('#mainContainer');
	};
	$("form").submit(function() {
		var shouldSubmit = true;
		reset();
		var username = $('#username');
		var password = $('#password');
		// Check if username is entered
		// If not...
		if (username.val().length === 0) {
			$('#usernameGroup').addClass('warning');
			$('<span class="help-inline">Please enter username.</span>').appendTo("#usernameControl");
			alertMessage("Please enter username");
			shouldSubmit = false;
		}
		// Check if password is non-empty
		if (password.val().length === 0) {
			$('#passwordGroup').addClass('warning');
			$('<span class="help-inline">Please enter password.</span>').appendTo("#passwordControl");
			alertMessage("Please enter password");
			shouldSubmit = false;
		}
		return shouldSubmit;
	});
	$("#reset").click(function(){ 
		reset();
	});
});