//
// Model
//
Model.Collaborators = new Model.model();

//
// View
//
View.Collaborators = {};
View.Collaborators = new function() {
	var that = this;
	// Get the new permission of a collaborator
	this.getNewPermission = function(id) {
		return parseInt($('.collaborator.permission').filter('#' + id).val());
	}
	this.show = function(collaborators) {
		var renderOptions = function(p, parentContainer) {
			var output = '';
			// If is owner...
			if (p === 4) {	// The permission of a owner should never be changed
				parentContainer.append(
					$('<option>')
						.attr('value', 4)
						.attr('disabled', 'disabled')
						.text(Permission.permissionToString(4))
				);
			// Otherwise, render the other options
			} else {
				for (var i = 1; i <= 3; i++) {
					var newOption = $('<option>')
										.attr('value', i)
										.text(Permission.permissionToString(i));
					if (i === p) {
						newOption.attr('selected', 'true');
					}
					parentContainer.append(newOption);
				}
			}
			return output;
		}
		// Get collaborator from Model if it's not passed in as an argument
		if (!collaborators) {
			collaborators = Model.Collaborators.get();
		}
		// Clear all collaborators in order to re-render later
		$('#collaborators').empty();

		// Disable confirm/cancel buttons before the view has been rendered successfully
		$('#collaborators-confirm-btn').hide();
		$('#collaborators-cancel-btn').hide();
		// Display the 'done' button only if there's nothing in the input box for username of invitee
		if (!$('#inviteName').val()) {
			$('#collaborators-done-btn').show();
		} else {
			$('#collaborators-done-btn').hide();
		}
		// If there's collaborator data...
		if (collaborators) {
			// Render the collaborators
			collaborators.forEach(function(c) {
				var s = $('<select>')
							.addClass('input-small collaborator permission disable-plevel-3')
							.attr('id', c.id);
				renderOptions(c.permission, s);
				var e = $('<div>')
							.addClass('row')
							.append($('<div>')
								.addClass('span2')
								.text(c.username)
							).append($('<div>')
								.addClass('span2 select')
								.append(s)
							).append($('<div>')
								.addClass('span1 removeCollaborator hide-plevel-3')
								.attr('id', c.id)
								.append($('<a>&times;</a>')
									.addClass('close')
								)
							);
				// Should not allow changes on owner
				if (c.permission === 4) {
					e.children('.removeCollaborator').remove();
				}
				$('#collaborators').append(e);
				s.change(function() {
					// Display the confirm button and cancel button if something has changed
					$('#collaborators-done-btn').hide();
					$('#collaborators-confirm-btn').show();
					$('#collaborators-cancel-btn').show();
					$('#invite-input').hide();
					$('#invite-alt').hide();
				});
			});
			// Call remove function if the remove button is clicked
			$('.removeCollaborator').children('a').click(function() {
				var id = parseInt($(this).parent().attr('id'));
				Controller.Collaborators.remove(id);
			});
		}
		Permission.setElementPermission(Model.Permission.get());
	}
	// Initialize the view
	this.initialize = function() {
		// Show the modal when button is clicked
		$('#collaborators-btn').click(function() {
			$('#collaborators-modal').modal('show');
			that.show();
		});
		$('#collaborators-confirm-btn').click(function() {
			Controller.Collaborators.change(function() {
				that.show();
				$('#invite-input').css('display', '');
				$('#invite-alt').css('display', 'none');
			});
		});
		$('#collaborators-cancel-btn').click(function() {
			that.show();
			$('#invite-input').css('display', '');
			$('#invite-alt').css('display', 'none');
		});
		$('#invite-alt').css('display', 'none');
		Model.Collaborators.bind(that.show);
	}
}

// Add new Collaborator
View.Invite = {};
View.Invite = new function() {
	var that = this;
	// Get the username of the invitee
	this.getUsername = function() {
		return $('#inviteName').val();	
	}
	// Get the permission of the invitee
	this.getPermission = function() {
		return parseInt($('#invite-permission').val());	
	}
	this.clear = function() {
		$('#inviteName').val('');
		$('#invite-permission').val('');	
	}
	this.initialize = function() {
		$('#invite-confirm-btn').click(function() {
			Controller.Collaborators.invite(function() {
				View.Collaborators.show();
				$('#invite-control').css('display', 'none');
				$('#invite-permission').css('display', 'none');
			});
		});
		$('#inviteName').keyup(function() {
			// Show the 'share' button if username has been typed
			if ($(this).val()) {
				$('#collaborators-done-btn').css('display', 'none');
				$('#invite-control').css('display', '');
				$('#invite-permission').css('display', '');
			} else {
				$('#collaborators-done-btn').css('display', '');
				$('#invite-control').css('display', 'none');
				$('#invite-permission').css('display', 'none');
			}
		});
		$('#invite-cancel-btn').click(function() {
			that.clear();
			$('#collaborators-done-btn').css('display', '');
			$('#invite-control').css('display', 'none');
			$('#invite-permission').css('display', 'none');
		});
		// Render options for the select
		for (var i = 1; i <= 3; i++) {
			$('#invite-permission').append($('<option>').attr('value', i).text(Permission.permissionToString(i)));
		}
		$('#invite-control').css('display', 'none');
		$('#invite-permission').css('display', 'none');
		
	}
}

//
// Controller
//
Controller.Collaborators = new function() {
	var that = this;
	this.invite = function(callback) {
		var username = View.Invite.getUsername();
		var permission = View.Invite.getPermission();
		View.Invite.clear();
		if (username) {
		// Find the userID of this user
			$.get(URL_FOR.getUserID, {'username': username} ,function(response) {
				var id = response.id;
				if(id) {
					$.post("collaborators/add", {'user_id': id, 'permission': permission}, function(response) {
						that.update(response, callback);
					});
				} else {
					callback();
				}
			});
		} else {
			callback();
		}
	}
	// Change permission of collaborators
	this.change = function(callback) {
		var collaborators = Model.Collaborators.get();
		// Post all updates that have changes in them
		collaborators.forEach(function(c) {
			var newPermission = View.Collaborators.getNewPermission(c.id);
			// If there's input and input is different from the original permission...
			if ((newPermission) && (newPermission !== c.permission)) {
				$.post('collaborators/update', {'collaborator_id': c.id, 'permission': newPermission});
			}
		});
		that.update(undefined, callback);
	}
	this.remove = function(cid) {
		if (cid) {
			$.post('collaborators/delete', {'collaborator_id': cid}, function(response) {
				that.update(response);
			});
		}
	}
	this.update = function(response, callback) {
		// If this function call includes a response, just update with that response.
		if (response) {
			Model.Collaborators.set(response.collaborators);
			if(callback) {
				callback();
			}
		// Otherwise, update by AJAX call
		} else {
			$.get('collaborators', function(response) {
				that.update(response, callback);
			});
		}
	}
	this.initialize = function() {
		Controller.Collaborators.update();
	}
}