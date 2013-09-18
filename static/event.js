//
//	Handles event
//

// show edit event modal
// show event popup
// travel time

superTripperApp.controller('EventCtrl', function($scope, $modal, $http, $timeout, Params) {
  $scope.tempDataEvents;
  $scope.isTravelTimeShownFlag = true;
  $scope.isUpdatableFlag = true;
  $scope.isEditEventOpenFlag = false;
  var DEFAULT_EVENT_LENGTH = 60 * 60000;

  //TODO(bunkie): should call from trip.js instead of watch
  $scope.$watch("dataEvents", function(value) {
    if ($scope.isUpdatableFlag) {
      $scope.tempDataEvents = angular.copy(value);
    }
  });

  $scope.sortableOptions = {
    update: function (event, ui) {
      var index = ui.item.sortable.index;//ui.item.attr('id');
      var newIndex = ui.item.index();//jQuery.inArray(index + '', indexArray);
      var events = ui.item.sortable.resort.$modelValue;//Model.Event.get();
      var updatesToMake = [];
      var data = angular.copy(events[index]);//Model.Event.copy(index);
      if (index !== newIndex) {
        var timeInterval = events[index]['end_time'] - events[index]['start_time'];

        // Determine the new start time
        switch (newIndex) {
          // It becomes the first event
          case 0:
            data['end_time'] = events[0]['start_time'];
            data['start_time'] = data['end_time'] - timeInterval;
            updatesToMake.push(data);
            break;
          // It becomes the last event
          case (events.length - 1):
            data['start_time'] = events[events.length - 1]['end_time'];
            data['end_time'] = data['start_time'] + timeInterval;
            updatesToMake.push(data);
            break;
          // It becomes an event in the middle
          default:
            if (newIndex < index) {	// Moving up
              // Update the moved event itself
              data['start_time'] = events[newIndex - 1]['end_time'];
              data['end_time'] = data['start_time'] + timeInterval;
              updatesToMake.push(data);
              // Update all the events after if necessary
              for (var i = newIndex; i < events.length; i++) {
                if (i !== index) {
                  if (events[i]['start_time'] < updatesToMake[updatesToMake.length - 1]['end_time']) {
                    var eventTimeInterval = events[i]['end_time'] - events[i]['start_time'];
                    var newData = angular.copy(events[i]);//Model.Event.copy(i);
                    newData['start_time'] = updatesToMake[i - newIndex]['end_time'];
                    newData['end_time'] = newData['start_time'] + eventTimeInterval;
                    updatesToMake.push(newData);
                  } else {
                    break;
                  }
                }
              }
            } else if (newIndex > index) {	// Moving down
              // Move the events above up
              for (var i = index + 1; i <= newIndex; i++) {
                var newData = angular.copy(events[i]);//Model.Event.copy(i);
                newData['start_time'] -= timeInterval;
                newData['end_time'] -= timeInterval;
                updatesToMake.push(newData);
              }
              // Update the moved event itself
              data['start_time'] = updatesToMake[updatesToMake.length - 1]['end_time'];
              data['end_time'] = data['start_time'] + timeInterval;
              updatesToMake.push(data);
              // Update all events after
              for (var i = newIndex + 1; i < events.length; i++) {
                if (events[i]['start_time'] < updatesToMake[updatesToMake.length - 1]['end_time']) {
                  var eventTimeInterval = events[i]['end_time'] - events[i]['start_time'];
                  var newData = Model.Event.copy(i);
                  newData['start_time'] = updatesToMake[i - newIndex]['end_time'];
                  newData['end_time'] = newData['start_time'] + eventTimeInterval;
                  updatesToMake.push(newData);
                } else {
                  break;
                }
              }
            }
            break;
        }
        // Disable the sortable before all requests are sended
        //TODO(bunkie): use other way to disable sortable
        $('#events-list').sortable('disable');
        updateEventTimes(updatesToMake);
        $('#events-list').sortable('enable');
//        showTravelTime();
        // Nothing changed, just re-renderer the list based on Model data
      } else {
//        that.updateList(Model.Event.get(), Model.Map.get()['timelist']);
      }
    },
    // Do not trigger sortable feature if dragging is done on a travel time
    cancel: '.travelTime',
    // Hide all travelTime when drag starts
    start: function () {
      $scope.isTravelTimeShownFlag = false;
      $scope.isUpdatableFlag = false;
      $scope.$apply();
      // Preserve the spacing for travel time when drag starts
      $('#events-list').find('li').css('margin-bottom', 17);
    },
    // Show all travelTime when drag ends
    stop: function () {
      $scope.isTravelTimeShownFlag = true;
      $scope.isUpdatableFlag = true;
      $scope.$apply();
      $('#events-list').find('li').css('margin-bottom', 0);
    },
    axis: "y",
    containment: "parent"
  };
  $( "#events-list" ).disableSelection(); //TODO(bunkie): more legit way to disable selection

  $scope.hasConflict = function(index) {
    if (index > 0 && $scope.tempDataEvents[index].start_time < $scope.tempDataEvents[index-1].end_time) {
      return true;
    }
    if (index+1 < $scope.tempDataEvents.length && $scope.tempDataEvents[index+1].start_time < $scope.tempDataEvents[index].end_time) {
      return true;
    }
    return false;
  };

  var showEditEvent = function(title, btnText, clickHandler) {
    return function(data) {

//      var confirmFunction = function() {
////        var data = that.getEditEventData();
////        if (data.start_time > data.end_time) {
////          $('#editEvent-endTimeGroup').addClass('error');
////          return;
////        }
//        $scope.hideEditEvent();
//        clickHandler();
//      };

      // set data for the edit event
      var editEventData = angular.copy(data);
      if (!editEventData.name) {
        editEventData.name = editEventData.location_names[0];
      }
      var latestEndTime = $scope.dataEvents.length > 0?
        $scope.dataEvents[$scope.dataEvents.length - 1].end_time:
        (Math.ceil((new Date()).getTime() / 30 / 60000) * 30 * 60000);
      if (!editEventData.start_time) {
        editEventData.start_time = latestEndTime;
      }
      if (!editEventData.end_time) {
        editEventData.end_time = latestEndTime + DEFAULT_EVENT_LENGTH;
      }


      var modalInstance = $modal.open({
        templateUrl: 'editEventModal.html',
        scope: $scope,
        controller: EditEventModalCtrl,
        resolve: {
          title: function() {return title;},
          buttonText: function() {return btnText;},
          editEventData: function() {return editEventData;}
        }
      });

      modalInstance.result.then(clickHandler);
    };
  };

  $scope.showAddEvent = function(data) {
    showEditEvent('Add an event', 'Add', addEvent)(data);
  };

  $scope.showUpdateEvent = function(data) {
    showEditEvent('Update the event', 'Update', updateEvent)(data);
  };

  var addEvent = function(data) {
    if (!data)  return;
    if (data.type_id) {
      $.post("events/add", data, update);
    } else {
      $.post('events/addWithType', data, update);
    }
  };

  // Update a single event
  var updateEvent = function(data) {
    if (!data)	return;
    if (data.type_id) {
      console.log(data);
      $.post("events/update", data, update);
    } else {
      $.post('events/updateWithType', data, update);
    }
  };

  // Update the time of a list of events
  var updateEventTimes = function(events) {
    var ids = [];
    var startTimes = [];
    var endTimes = [];
    events.forEach(function(event) {
      ids.push(event.id);
      startTimes.push(event.start_time);
      endTimes.push(event.end_time);
    });
    var data = {};
    data['id[]'] = ids;
    data['start_time[]'] = startTimes;
    data['end_time[]'] = endTimes;
    $.post('events/updateTimes', data, update);
  }

  $scope.removeEvent = function(eid) {
    if (eid) {
      $.post('events/delete', {'event_id': eid}, update);
    }
  }

  var update = function(response) {
    if (response) {
      if (response.event_types) {
        $scope.dataEventTypes = response.event_types;
      }
      $scope.dataEvents = response.events;
      $scope.dataPermission = response.permission;
      $scope.dataLogs = response.logs;
      $scope.$apply();
    }
  };

});

var EditEventModalCtrl = function ($scope, $modalInstance, title, buttonText, editEventData) {
  $scope.title = title;
  $scope.buttonText = buttonText;
  $scope.editEventData = editEventData;

  $scope.hideEditEvent = function() {
    $modalInstance.dismiss('cancel');
  };

  $scope.confirm = function () {
    $scope.editEventData.start_time = new Date($scope.editEventData.start_time).getTime();
    $scope.editEventData.end_time = new Date($scope.editEventData.end_time).getTime();
    $modalInstance.close($scope.editEventData);
  };
}

// View.Event: Renders the list view and the calendar view of schedule
// Controller.Event: handles AJAX calls about event updating

//
View.Event = new function() {
	var that = this;
	var DEFAULT_EVENT_LENGTH = 60 * 60000;	// default length of a new event in milliseconds

	// get data for the edit event
	this.getEditEventData = function() {
		var start_date = $('#editEvent-startDate').val();
		var end_date = $('#editEvent-endDate').val();
		var start_time_date = new Date(start_date + " " + $('#editEvent-startTime').val());
		var end_time_date = new Date(end_date + " " + $('#editEvent-endTime').val());
		var suggested_interval = parseInt($('#editEvent-suggestedInterval').val());

		return {
			'id': $('#editEvent-id').val(),
			'name': $('#editEvent-name').val(),
			'type_id': parseInt($('#editEvent-type').val()),
			'type_name': $('#addEventType-name').val(),
			'start_time': start_time_date.getTime(),
			'end_time': end_time_date.getTime(),
			'suggested_interval': suggested_interval ? suggested_interval : 0,
			'is_arranged': 0,
			'location_names[]': [$('#editEvent-locationName').text()],
			'location_lats[]': parseFloat([$('#editEvent-locationLat').text()]),
			'location_lngs[]': parseFloat([$('#editEvent-locationLng').text()])
		}
	};


	var formatDigit = function(num) {
		return num < 10 ? ('0' + num) : num;
	};

	var toDateString = function(dateObj) {
		var month = formatDigit(dateObj.getMonth()+1);
		var date = formatDigit(dateObj.getDate());
		return month + "/" + date + "/" + dateObj.getFullYear();
	};

	var toTimeString = function(dateObj) {
		var hours = formatDigit(dateObj.getHours());
		var minutes = formatDigit(dateObj.getMinutes());
		return hours + ":" + minutes;
	};

	var setDate = function(dateObj, dateElement) {
		var date_value = toDateString(dateObj);
		dateElement.val(date_value);
		dateElement.parent().attr("data-date", date_value);
		dateElement.attr("value", date_value);
		dateElement.datepicker('update');
	};

	var setTime = function(dateObj, timeElement) {
		timeElement.val(toTimeString(dateObj));
	};
	// Show travel time on the event list
	var showTravelTime = function() {
		// Bind listener to listen to time change

		var genHighlighter = function(index){
			return function() {View.Map.highlightRoute(index)};
		}
		var genUnHighlighter = function(index){
			return function() {View.Map.unhighlightRoute(index)};
		}

		Model.Map.unbind();
		Model.Map.bind(function(e) {
			$('.travelTime-time').empty();
			var timelist = e.timelist;
			if (timelist) {
				for (var i = 0; i < timelist.length; i++) {
					var detailPanel = $('<div id=detail-' + i + '>');
					$('#time-' + i)
						.append(detailPanel)
						.data('time', timelist[i].value)
						.hover(genHighlighter(i), genUnHighlighter(i))
						.find('.travelTime-time')
						.html(timelist[i].text)
				}
				checkTravelTime();
			}
		});
	};
	// Check if each event have enough travel time
	var checkTravelTime = function() {
		var events = Model.Event.get();
		$('.warning-travelTime').remove();
		for (var i = 0; i < events.length - 1; i++) {
			var travelTimeDiv = $('#time-' + i);
			// Check if there's a travel time
			if (travelTimeDiv.length > 0) {
				// Convert into milliseconds and compare
				if (parseInt(travelTimeDiv.data('time')) * 1000 >
					(events[i+1]['start_time'] - events[i]['start_time'])) {
					travelTimeDiv.find('.travelTime-time').prepend(
						$('<a class="badge badge-warning warning warning-travelTime">')
							.text('!')
							.tooltip({'title': 'Not enough traveling time'})
					);
				}
			}
		}
		updateButtonColor();
	};
	// Update the color of calendar view button
	var updateButtonColor = function() {
		// If there's no warning...
		if ($('.warning').length === 0) {
			$('#cal-view-btn').removeClass('btn-danger').removeClass('btn-warning').addClass('btn-info');
		// Show conflict as the first priority
		} else if ($('.warning-conflict').length > 0) {
			$('#cal-view-btn').addClass('btn-danger').removeClass('btn-warning').removeClass('btn-info');
		} else {
			$('#cal-view-btn').removeClass('btn-danger').addClass('btn-warning').removeClass('btn-info');
		}
	}

	// set data for the edit event
	this.setEditEventData = function(data) {
		$('#editEvent-id').val(data.id);
		$('#editEvent-name').val(data.name ? data.name : data.location_names[0]);
		$('#editEvent-type').val(data.type_id);
		var setDateAndTime = function(time, dateElement, timeElement) {
			dateObj = new Date(time);
			setDate(dateObj, dateElement);
			setTime(dateObj, timeElement);
		}
		var events, latestEndTime;
		if (data.start_time) {
			setDateAndTime(data.start_time, $('#editEvent-startDate'), $('#editEvent-startTime'));
		// Set a default time
		} else {
			events = Model.Event.get();
			latestEndTime = events.length > 0?
				events[events.length - 1].end_time:
				(Math.ceil((new Date()).getTime() / 30 / 60000) * 30 * 60000);
			setDateAndTime(latestEndTime, $('#editEvent-startDate'), $('#editEvent-startTime'));
		}
		if (data.end_time) {
			setDateAndTime(data.end_time, $('#editEvent-endDate'), $('#editEvent-endTime'));
		} else {
			setDateAndTime(latestEndTime + DEFAULT_EVENT_LENGTH, $('#editEvent-endDate'), $('#editEvent-endTime'));
		}
		$('#editEvent-suggestedInterval').val(data.suggested_interval);
		$('#editEvent-locationName').text(data.location_names[0]);
		$('#editEvent-locationLat').text(data.location_lats[0]);
		$('#editEvent-locationLng').text(data.location_lngs[0]);
	};

	var clearEditEventData = function() {
		$('#editEvent-name').val('');
		$('#editEvent-type').val('');
		$('#editEvent-startTime').val('');
		$('#editEvent-endTime').val('');
		$('#editEvent-suggestedInterval').val('');
		$('#editEvent-locationName').text('');
		$('#editEvent-locationLat').text('');
		$('#editEvent-locationLng').text('');
		$('#editEvent-endTimeGroup').removeClass('error');
		$('#addEventType-name').val('');
	};

	var showEditEvent = function(title, btnText, clickHandler) {
		return function(data) {
			clearEditEventData();
			View.EventTypes.show();
			that.setEditEventData(data);
			$('#editEvent-confirm-btn').unbind("click");
			$('#editEvent-confirm-btn').click(function() {
				var data = that.getEditEventData();
				if (data.start_time > data.end_time) {
					$('#editEvent-endTimeGroup').addClass('error');
					return;
				}
				$('#editEvent-modal').modal('hide');
				clickHandler();
			});
			$('#editEvent-title').text(title);
			$('#editEvent-confirm-btn').text(btnText);
			$('#editEvent-modal').modal('show');
		};
	};

	this.showAddEvent = function(data) {
		showEditEvent('Add an event', 'Add', Controller.Event.addEvent)(data);
	};

	this.showUpdateEvent = function(data) {
		showEditEvent('Update the event', 'Update', Controller.Event.updateEvent)(data);
	};

	this.updateCalendar = function(events) {
		var year = new Date().getFullYear();
		var month = new Date().getMonth();
		var day = new Date().getDate();

		//var events = Model.Event.get();
		var calendar_events = [];

		events.forEach(function(event, index) {
			calendar_events.push({
				"id": event.id,
				"start": new Date(event.start_time),
				"end": new Date(event.end_time),
				"title": event.name,
				"event": event
			});
		});

		$("#calendar").weekCalendar("option", {
			data: {
				events : calendar_events
			}
		}).weekCalendar("refresh");
	};

	this.updateCalendarPermission = function(permission) {
		$("#calendar").weekCalendar("option", {
			readonly: permission < 2
		}).weekCalendar("refresh");
	};

	this.updateList = function(events, timelist) {
		$('.travelTime').remove();
		$('#events-list').empty();
		var hasConflict = false;

		if (events) {
			var table = $('#events-list');
			var latestTime;		// The latest endtime
			var latestEventElement;	// The event element with latest endtime
			events.forEach(function(event, index) {
				var row = $('<li>').css('cursor', 'move').attr('id', index).append($('<a>').append($('<table class="event-table">').append($('<tr>'))));

				// the marker pin
				var pin = $('<td class="event-marker">').append($('<img>').attr('src', View.Map.getMarkerIconURL(index)));
				row.find('tr').append(pin);

				// the name
				var name = $('<td class="event-name" rel="popover">').html(event.name);
				var start_time_date = new Date(event.start_time);
				var end_time_date = new Date(event.end_time);
				row.find('tr').append(name);
				row.hover(function() {//name.popover("show")
									   View.Map.highlightEventMarker(event.id)},
						   function() {//$(".popover").remove()
									   View.Map.unhighlightEventMarker(event.id)});
				row.click(function() {View.Map.panToEventMarker(event.id)});

				var cell_edit = $('<td class="event-icons">');
				// the update button
				var update_btn = $('<i class="icon-pencil clickable hide-plevel-2 updateEvent"></i>');
				update_btn.click(function() {
					that.showUpdateEvent(event);
				});
				// the delete button
				var delete_btn = $('<a class="close hide-plevel-2 removeEvent">&times;</a>');
				delete_btn.click(function(e) {
					View.Map.unhighlightEventMarker(event.id);
					Controller.Event.removeEvent(event.id);
					e.stopPropagation();
				});

				cell_edit.append(update_btn);
				cell_edit.append(delete_btn);
				row.find('tr').append(cell_edit);

				table.append(row);

				// If there's a latest time...
				if (latestTime) {
					// If there's a conflict...
					if (event.start_time < latestTime) {
						name.addClass('conflict');
						latestEventElement.addClass('conflict');
						hasConflict = true;
					}
					// Update latestTime
					if (event.end_time >= latestTime) {
						latestTime = event.end_time;
						latestEventElement = name;
					}
				// Otherwise, set it to be self
				} else {
					latestTime = event.end_time;
					latestEventElement = name;
				}
				// Append a div for travel time
				if (index !== events.length - 1) {
					table.append(
						$('<div class="travelTime" id="time-' + index + '">')
						.append(
							$('<table>').append(
								$('<tr>')
									.append(
										$('<td class="travelTime-arrow">')
										.append($('<a class="icon-arrow-down">'))
									).append($('<td class="travelTime-time">'))
							)
						)
					);

				}
			});
			// Highlight the conflict events
			$('.conflict').each(function() {
				$(this).prepend($('<a class="warning warning-conflict">')
					.tooltip({'title': 'Conflicting schedule'})
					.addClass('badge badge-important')
					.text('!')
				);
			});
			showTravelTime();
		}
	};

	this.getEventContent = function(event) {
		var start_time_date = new Date(event.start_time);
		var end_time_date = new Date(event.end_time);

		return '<table><tr><td class="event-popover-content-left"><i class="icon-map-marker"></i><b>Location</b></td><td>'
		+ event.location_names[0] + '</td></tr>'
		+'<tr><td class="event-popover-content-left"><i class="icon-tag"></i><b>Event type</b></td><td>'
		+ Model.EventTypes.getById(event.type_id).name + '</td></tr>'
		+'<tr><td class="event-popover-content-left"><i class="icon-time"></i><b>Start time</b></td><td>'
		+ toDateString(start_time_date) + ' ' + toTimeString(start_time_date) + '</td></tr>'
		+'<tr><td class="event-popover-content-left"><i class="icon-time"></i><b>End time</b></td><td>' + toDateString(end_time_date) + ' ' + toTimeString(end_time_date) + '</td></tr>'
		+'<tr><td>&nbsp;</td></tr><tr><td class="event-popover-content-left"><i class="icon-user"></i>Created by </td><td><i>' + event.creator_name + '</i></td></tr></table>';
	}

	this.initialize = function() {
		Model.Event.bind(that.updateList);
		Model.Event.bind(that.updateCalendar);
		Model.Permission.bind(that.updateCalendarPermission);

		$('#editEvent-startDate').datepicker()
		.on('changeDate',function(e) {
			var endDateContainer = $('#editEvent-endDate');
			endDateContainer.datepicker('setStartDate', e.date);
			if (e.date.valueOf() > (new Date(endDateContainer.val())).getTime()) {
				setDate(e.date, endDateContainer);
			}
		});
		$('#editEvent-endDate').datepicker()
		.on('changeDate',function(e) {
			var startDateContainer = $('#editEvent-startDate');
			if (e.date.valueOf() < (new Date(startDateContainer.val())).getTime()) {
				setDate(e.date, startDateContainer);
			}
		});

		$('#calendar').weekCalendar({
			timeslotsPerHour: 4,
			daysToShow: 1,
			use24Hour: false,
			allowCalEventOverlap: true,
			overlapEventsSeparate: true,
			readonly: true,
			height: function($calendar){
				return $('#event-calendar').height();//$(window).height() - $("h1").outerHeight();
			},
			eventClick : function(calEvent, $event) {
				var event = calEvent.event;
				View.Map.panToEventMarker(event.id);
			},
			eventDoubleClick : function(calEvent, $event) {
				var event = calEvent.event;
				View.Event.showUpdateEvent(event);
			},
			eventResize : function(newCalEvent, calEvent) {
				var event = newCalEvent.event;
				event.start_time = newCalEvent.start.getTime();
				event.end_time = newCalEvent.end.getTime();
				Controller.Event.updateEvent(event);
     		},
     		eventDrop : function(newCalEvent, calEvent) {
				var event = newCalEvent.event;
				event.start_time = newCalEvent.start.getTime();
				event.end_time = newCalEvent.end.getTime();
				Controller.Event.updateEvent(event);
     		},
     		eventNew : function(calEvent, $event) {
     			$event.remove();
     		}
		});
//		//-----------------------------------------
//		// The sortable feature of events list
//		//-----------------------------------------
//		$( "#events-list" ).sortable({
//			update: function(event, ui) {
//				var indexArray = $(this).sortable('toArray').filter(function(e) {return !(e.match('time-'))});
//				var index = ui.item.attr('id');
//				var newIndex = jQuery.inArray(index + '', indexArray);
//				var events = Model.Event.get();
//				var updatesToMake = [];
//				var data = Model.Event.copy(index);
//				index = parseInt(index);
//				if (index !== newIndex) {
//					// Remove all travelTime
//					$(this).children('.travelTime').remove();
//
//					var timeInterval =  events[index]['end_time'] - events[index]['start_time'];
//
//					// Determine the new start time
//					switch(newIndex) {
//						// It becomes the first event
//						case 0:
//							data['end_time'] = events[0]['start_time'];
//							data['start_time'] = data['end_time'] - timeInterval;
//							updatesToMake.push(data);
//							break;
//						// It becomes the last event
//						case (indexArray.length - 1):
//							data['start_time'] = events[events.length - 1]['end_time'];
//							data['end_time'] = data['start_time'] + timeInterval;
//							updatesToMake.push(data);
//							break;
//						// It becomes an event in the middle
//						default:
//							if (newIndex < index) {	// Moving up
//								// Update the moved event itself
//								data['start_time'] = events[newIndex - 1]['end_time'];
//								data['end_time'] = data['start_time'] + timeInterval;
//								updatesToMake.push(data);
//								// Update all the events after if necessary
//								for (var i = newIndex; i < events.length; i++) {
//									if (i !== index) {
//										if (events[i]['start_time'] < updatesToMake[updatesToMake.length - 1]['end_time']) {
//											var eventTimeInterval = events[i]['end_time'] - events[i]['start_time'];
//											var newData = Model.Event.copy(i);
//											newData['start_time'] = updatesToMake[i - newIndex]['end_time'];
//											newData['end_time'] = newData['start_time'] + eventTimeInterval;
//											updatesToMake.push(newData);
//										} else {
//											break;
//										}
//									}
//								}
//							} else if (newIndex > index) {	// Moving down
//								// Move the events above up
//								for (var i = index + 1; i <= newIndex; i++) {
//									var newData = Model.Event.copy(i);
//									newData['start_time'] -= timeInterval;
//									newData['end_time'] -= timeInterval;
//									updatesToMake.push(newData);
//								}
//								// Update the moved event itself
//								data['start_time'] = updatesToMake[updatesToMake.length - 1]['end_time'];
//								data['end_time'] = data['start_time'] + timeInterval;
//								updatesToMake.push(data);
//								// Update all events after
//								for (var i = newIndex + 1; i < events.length; i++) {
//									if (events[i]['start_time'] < updatesToMake[updatesToMake.length - 1]['end_time']) {
//										var eventTimeInterval = events[i]['end_time'] - events[i]['start_time'];
//										var newData = Model.Event.copy(i);
//										newData['start_time'] = updatesToMake[i - newIndex]['end_time'];
//										newData['end_time'] = newData['start_time'] + eventTimeInterval;
//										updatesToMake.push(newData);
//									} else {
//										break;
//									}
//								}
//							}
//							break;
//					}
//					// Disable the sortable before all requests are sended
//					$('#events-list').sortable('disable');
//					Controller.Event.updateEventTimes(updatesToMake);
//					$('#events-list').sortable('enable');
//					showTravelTime();
//				// Nothing changed, just rerenderer the list based on Model data
//				} else {
//					that.updateList(Model.Event.get(), Model.Map.get()['timelist']);
//				}
//			},
//			// Do not trigger sortable feature if dragging is done on a travel time
//			cancel: '.travelTime',
//			// Hide all travelTime when drag starts
//			start: function() {
//				$('.travelTime').hide();
//				// Preserve the spacing for travel time when drag starts
//				$('#events-list').find('li').css('margin-bottom', 17);
//			},
//			// Show all travelTime when drag ends
//			stop: function() {
//				$('.travelTime').show();
//				$('#events-list').find('li').css('margin-bottom', 0);
//			}
//		});
//		$( "#events-list" ).disableSelection();

		//---------------------------
		// The optimizing feature
		//---------------------------
		var purposedEvents = [];
		$('#events-optimized').hide();
		$(window).resize();
		$('.optimize-after').hide();
		$('#optimize-optimize-btn').click(function() {
			$('#events-optimized').empty();
			$(this).hide();
			$('.optimize-after').show();
			$('#events').hide();
			$('#events-optimized').show();
			$(window).resize();
			View.Map.toggleOptimalPath();
			// Display the optimal order
			// An array of indices
			var optimalOrder = Model.Map.optimalOrder.slice();
			var optimalTimelist = Model.Map.optimalTimelist;
			// Calculate the purposed events
			purposedEvents = [];
			var events = Model.Event.get();
			// Put the start point into the list
			purposedEvents.push(Model.Event.copy(0));
			purposedEvents[0]['prev_index'] = 0;
			// A trick to include the end point automatically since the endpoint would always be the last point
			optimalOrder.push(optimalOrder.length);
			for (var i = 0; i < optimalOrder.length; i++) {
				// Copy the corresponding event, +1 because optimalOrder does not include start point
				purposedEvents.push(Model.Event.copy(optimalOrder[i] + 1));
				// Preserve time duration
				var duration = purposedEvents[i + 1]['end_time'] - purposedEvents[i + 1]['start_time'];
				purposedEvents[i + 1]['start_time'] = purposedEvents[i]['end_time'];
				purposedEvents[i + 1]['end_time'] = purposedEvents[i + 1]['start_time'] + duration;
				purposedEvents[i + 1]['prev_index'] = optimalOrder[i] + 1;
			}
			// Display the events
			for (var i = 0; i < purposedEvents.length; i++) {
				$('#events-optimized').append(
					function() {
						var output = $('<div class="optimized">').append(
							$('<table>').append(
								$('<tr>')
									.append(
										$('<td class="event-marker">')
											.append(
												$('<img>').attr('src', View.Map.getMarkerIconURL(purposedEvents[i]['prev_index']))
											)
									)
									.append($('<td class="optimized-event-name">').text(purposedEvents[i].name)
									)
							)
						);
						if (i !== purposedEvents[i]['prev_index']) {
							output.addClass('changed');
						}
						return output;
					}
				);
				// Show the new travel time
				if (i !== purposedEvents.length - 1) {
					$('#events-optimized').append(
						function() {
							var output = $('<div class="optimized">').append(
								$('<table>').append(
									$('<tr>').append($('<td>').append($('<a class="icon-arrow-down">')))
											.append($('<td>').append($('<div>').text(optimalTimelist[i].text)))
								)
							)
							return output;
						}
					);
				}
			}
		});
		// Send requests in purposedEvents
		$('#optimize-save-btn').click(function() {
			if (purposedEvents.length) {
				Controller.Event.updateEventTimes(purposedEvents);
			}
		});
		// Clean up purposedEvents
		$('#optimize-cancel-btn').click(function() {
			purposedEvents = [];
		});

		$('.optimize-after').filter('button').click(function() {
			$('.optimize-after').hide();
			$('#optimize-optimize-btn').show();
			$('#events').show();
			$('#events-optimized').hide();
			$(window).resize();
			View.Map.untoggleOptimalPath();
		});
	};
};

Model.Event = new Model.model()
// Copy a data as a JSON-form object and return it
Model.Event.copy = function(index) {
	var that = this;
	var events = that.get();
	index = parseInt(index);
	if ((index >= 0) && (index < events.length)) {
		var keys = ['id', 'name', 'type_id', 'start_time', 'end_time', 'suggested_interval', 'is_arranged']
		var arrayKeys = ['location_names', 'location_lats', 'location_lngs']
		var data = {};
		keys.forEach(function(key) {
			data[key] = events[index][key];
		});
		arrayKeys.forEach(function(key) {
			data[key + '[]'] = events[index][key].slice();
		});
		return data;
	}
}

Controller.Event = new function() {
	var that = this;

	this.initialize = function() {
		that.update();
	}

	this.addEvent = function() {
		var data = View.Event.getEditEventData();
		if (data) {
			if (data.type_id) {
				$.post("events/add", data, that.update);
			} else {
				$.post('events/addWithType', data, function(response) {
					Controller.EventTypes.update(response);
					that.update(response);
				});
			}
		}
	};
	// Update a single event
	this.updateEvent = function(data) {
		if (!data)	data = View.Event.getEditEventData();
		if (data.type_id) {
			$.post("events/update", data, that.update);
		} else {
			$.post('events/updateWithType', data, function(response) {
				Controller.EventTypes.update(response);
				that.update(response);
			});
		}
	};

	// Update the time of a list of events
	this.updateEventTimes = function(events) {
		var ids = [];
		var startTimes = [];
		var endTimes = [];
		events.forEach(function(event) {
			ids.push(event.id);
			startTimes.push(event.start_time);
			endTimes.push(event.end_time);
		});
		var data = {};
		data['id[]'] = ids;
		data['start_time[]'] = startTimes;
		data['end_time[]'] = endTimes;
		$.post('events/updateTimes', data, function(response) {
			that.update(response);
		});
	}

	this.update = function(response) {
		if (response) {
			Model.Event.set(response.events);
			Model.Permission.set(response.permission, true);
//			Model.Log.set(response.logs);
		} else {
			$.get('events', that.update);
		}
	};

	this.removeEvent = function(eid) {
		if (eid) {
			$.post('events/delete', {'event_id': eid}, that.update);
		}
	}
};