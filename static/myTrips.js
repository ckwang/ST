//
//	Controls the "MyTrip" dropdown
//  Updates the dropdown when there's new data
//

superTripperApp.controller("MyTripsCtrl", function($scope, Params) {
  $scope.TripsURL = Params.TRIPS_URL;

  $scope.OpenCreateTripModel = function() {
    $('#createTripModal').modal('show');
  };
});

Controller.MyTrips = new function() {
	var that = this;
	this.update = function() {
		$.get(URL_FOR['getTrips'], function(response) {
			Model.MyTrips.set(response.trips);
		});
	}
	this.initialize = function() {
		that.update();
	}
}
View.MyTrips = new function() {
	var that = this;
	this.updateList = function(trips) {
//		if (trips) {
//			$('#myTrips-list').empty();
//			trips.forEach(function(trip) {
//				$('<li>')
//					.append($('<a>').attr('href', URL_FOR['trips'] + trip.id).text(trip.name))
//					.appendTo('#myTrips-list');
//			});
//			$('#myTrips-list').append(
//				$('<li>').addClass('divider')
//			);
//			$('#myTrips-list').append(
//				$('<li>')
//					.css('cursor', 'pointer')
//					.append($('<a>').text('+ Create a new trip..'))
//					.click(function() {
//						$('#createTripModal').modal('show');
//					})
//			);
//		}
	}
	this.initialize = function() {
		Model.MyTrips.bind(that.updateList);
	}
}
Model.MyTrips = new Model.model();