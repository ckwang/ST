//
//	Controls the log displayed on the top-right
//

Model.Log = new Model.model();

View.Log = new function() {
	var that = this;
	// Display a log
	var displayLog = function() {
		var logQueue = Model.Log.logsQueue;
		var latestLog = logQueue[0];
		Model.Log.latestLog = logQueue[0];
		Model.Log.latestLog = latestLog;
		if (latestLog) {
			$('#logContainer').empty();
			var htmlString = 'Last modified: ';
			htmlString += '<strong>' + latestLog.username + '</strong>';
			switch (latestLog.type) {
				case 1:	// Added an event
					htmlString += ' added <strong>' + latestLog.event + '</strong> to the schedule.';
					break;
				case 2: // Updated an event
					htmlString += ' updated <strong>' + latestLog.event + '</strong>.';
					break;
				case 3: // Update time
					htmlString += ' rescheduled the itinerary.';
					break;
				case 4:	// Delete
					htmlString += ' deleted <strong>' + latestLog.event + '</strong> from the schedule.';
					break;
					
			}
			$('#logContainer').append(
				$('<div class="alert alert-error" id="log-content">')
					.html(htmlString)
			);
			setTimeout(function() {
				$('#log-content').animate({
					'color': '#3A87AD',
					'background-color': '#D9EDF7',
					'border-color': '#BCE8F1'
				}, 1000);
			}, 1000);
		}
	}
	var showLogs = function(logs) {
		Model.Log.logsQueue = logs.slice();
		displayLog();
	}
	this.initialize = function() {
		Model.Log.bind(showLogs);
	}
}