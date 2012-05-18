// The generic View object. Initialize View.
View.initialize = function() {
	var that = this;
	this.Collaborators.initialize();
	this.EventTypes.initialize();
	this.Invite.initialize();
	this.Event.initialize();
	this.MyTrips.initialize();
	this.Log.initialize();
	
	// Modals
	$('.modal').modal();
	$('.modal').modal('hide');	// Hide all modals
	
	// Buttons
	$('#refresh-btn').click(Controller.Update.update);
	$('#home-btn').click(function() {
		document.location.href = URL_FOR['trips'];
	});
	
	$('.date').datepicker({
        format: 'mm/dd/yyyy'
    });
	$('.time').timePicker({
		startTime: "00:00",
		endTime: "23:45",
		step: 30
	});

}
