//
// Controls the toggling between map view and calendar view
//
$(document).ready(function() {
	$('#event-calendar').css('display', 'none');
	$('#map-view-btn').click(function() {
		// Activate only if it's not currently in map view
		if (!$(this).hasClass('active')) {
			$('#eventsContainer').show();
			$('#centerContainer').show();
			$('#rightContainer').show();
			$('#event-calendar').hide();
			$(window).resize();
			Controller.Map.restartMap();

		}
	});
	$('#cal-view-btn').click(function() {
		// Activate only if it's not currently in cal view
		if (!$(this).hasClass('active')) {
			$('#eventsContainer').hide();
			$('#centerContainer').hide();
			$('#rightContainer').hide();
			$('#event-calendar').show();
			$(window).resize();
			$('#calendar').weekCalendar('expandView').weekCalendar('center');
			
		}
	});
});