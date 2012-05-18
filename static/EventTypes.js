//
// Model
//
Model.EventTypes = new Model.model();

//
// View
//
View.EventTypes = new function() {
	var that = this;
	// Get the name of the new event type
	this.get = function() {
		return $('#addEventType-name').val();
	}
	// Set the name of the new event type to content
	this.set = function(content) {
		$('#addEventType-name').val(content);
	}
	// Clear the name of the new event type
	this.clear = function() {
		$('#addEventType-name').val('');
	}
	// Disable the button of adding new event type
	this.disable = function() {
		$('#addEventType-btn').attr('disabled', 'disabled');
	}
	// Enable the button of adding new event type
	this.enable = function() {
		$('#addEventType-btn').removeAttr('disabled');	
	}
	// Show the list of event types
	this.show = function() {
		$('#editEvent-type').empty();
		var eventTypes = Model.EventTypes.get();
		if (eventTypes) {
			eventTypes.forEach(function(e) {
				$('#editEvent-type').append(
					$('<option>')
						.attr('value', e.id)
						.text(e.name)
				);
			});
		}
		$('#addEventType-spacer').css('display', 'none');
		$('#addEventType-name').css('display', 'none');
		$('#editEvent-type')
			.append($('<option>').attr('disabled', 'disabled').text('--------------'))
			.append($('<option>').text('Other...').attr('value', 'other'))
			.unbind('change')
			.change(function() {
				if ($(this).val() === 'other') {
					$('#addEventType-spacer').css('display', 'block');
					$('#addEventType-name').css('display', '');
					
				} else {
					$('#addEventType-spacer').css('display', 'none');
					$('#addEventType-name').css('display', 'none');
				}
			});
	}
	
	this.initialize = function() {
		$('#addEventType-btn').click(function() {
			$('#addEventType-modal').modal('show');
			that.show();
		});
		$('#addEventType-confirm-btn').click(function() {
			$('#addEventType-modal').modal('hide');
			Controller.EventTypes.addEventType();
		});
	}
}

//
// Controller
//
Controller.EventTypes = new function() {
	var that = this;
	this.addEventType = function() {
		var name = View.EventTypes.get();
		if (name) {
			View.EventTypes.clear();
			$.post('eventTypes/add', {'name': name}, function(response) {
				Model.EventTypes.set(response.event_types);
			});
		}
	}
	this.update = function(response) {
		if (response) {
			var eventTypes = response.event_types;
			Model.EventTypes.set(eventTypes);
		} else {
			$.get('eventTypes', function(response) {
				that.update(response);
			});
		}
	}
	this.initialize = function() {
		that.update();
	}
}