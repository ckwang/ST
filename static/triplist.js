//
//	Updates the trip list by using AJAX calls
//

var REFRESH_TIME = 5000;	// Time interval between auto-refreshing in milliseconds

superTripperApp.controller('TriplistCtrl', function($scope, $http) {
  $http.get('get').success(function(data) {
    $scope.trips = data.trips;
  });
});

$(document).ready(function() {
	$('#createTripModal').modal();
	$('#createTripModal').modal('hide');	// Hide the modal initially
	// Show the createTripModal when any of the newtrip button is clicked
	$('.newtrip-btn').each(function() {
		$(this).click(function() {
			$('#createTripModal').modal('show');
		});	
	});
	// Update if user clicks refresh putton
	$('#refresh').click(function() {
		update();
	});
	//update();
	
	// Auto-refresh
	var timeout = function() {
		setTimeout(function() {
			update();
			timeout();
		}, REFRESH_TIME);
	};
//	timeout();
	
});
// Function for updating
var update = function(response) {
	// If there's data to update, update the page with that data
	if (response) {
		// Remove all existing trips
		$('.trip').remove();
		var trips = response.trips;
		var container = $('#listContainer');
		
		// Render all trips
		trips.forEach(function(trip) {
			var row = $('<tr class="trip">');
			container.append(row);
		
			// Remove button
			row.append(
				$('<td>').append(
					$('<a class="close removeTrip">').attr('id', trip.id).html('&times;').click(function() {
						var id = trip.id;
						$.post('delete/', {'trip_id': id}, function(response) {
							update(response);
						});
					})
			));
			// Link to trip page
			row.append(
				$('<td>').append(
					$('<a>').text(trip.name).attr('href', '' + trip.id)));
			
			// owner
			row.append($('<td>').html(trip.owner_name));
					
			// trip time
			var formatDigit = function(num) {
				return num < 10 ? ('0' + num) : num;
			};
			
			var toDateString = function(dateObj) {
				var month = formatDigit(dateObj.getMonth()+1);
				var date = formatDigit(dateObj.getDate());
				return month + "/" + date + "/" + dateObj.getFullYear();
			};
			
			var dateContent = $('<td>')
			if (trip.start_time) {
				dateContent.html(toDateString(new Date(trip.start_time)) +
					" - " + toDateString(new Date(trip.end_time)));
			}
			row.append(dateContent);
			
			// permission
			row.append($('<td>').text(Permission.permissionToString(trip.permission)));
		});
	// Otherwise, get data by AJAX call
	} else {
		$.get('get', function(response) {
			update(response);
		});
	}
}
