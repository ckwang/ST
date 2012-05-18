// This file mainly deals with the communications between our web application
// (client-side) and Google Map API.
// 
// Model:
// All Google Map API Components
// Temporary cached results from google map api
// 
// View:
// Functions that display objects in model onto Google Map
// Functions that display objects in model onto DOM
// Some presentation related helper functions
// 
// Controllers:
// Main logic component




Model.Map = new Model.model();

Model.Map.data = {};			//stores timelist and distlist


// Google Map API Components
Model.Map.map = null;			// Google Map
Model.Map.placesService = null;	// Place Search
Model.Map.autocomplete = null;	// Search autocomplete
Model.Map.dms = null;			// Get Distance and Time between points
Model.Map.dirService = null;	// Get directions between points
Model.Map.dirRenderer = null;	// Render route on the map
Model.Map.projection = null;	// Projection object from map to pixel
Model.Map.iw = null;			// info window on google map

Model.Map.highlightRenderer = null;

// Cache Results
Model.Map.queryCache = "";
Model.Map.dirResult = {};
Model.Map.dirResult.routes = [];
Model.Map.piecewiseDirResult = [];
Model.Map.markers = [];
Model.Map.searchResults = [];
Model.Map.optimalOrder = [];

Model.Map.optimalPath = {};
Model.Map.optimalPath.routes = [];

Model.Map.previousCenter = null;
Model.Map.previousZoom = null;

View.Map = new function() {
	var that = this;
	var eventMarkers = {};		// current event markers displayed on Google Map
	var activeIDs = {};			// Keep track what markers are still active
	//var activeEventWindowID = null;
	
	// hack for google map marker display bug (can't have markers at same location)
	var delta = 0.000001;
	
	
	/////////////////// Marker Icon Related //////////////////////////////////////////
	
	// colors for pin marker
	this.googleRed = "FF7D72";
	this.googleGreen = "67BF4B";
	this.googleBlue = "6991FD";
	this.defaultLetter = "%E2%80%A2";
	
	// URLs of Google Map Icons
	this.iconURL = {
		red_measle: "http://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle.png",
		blue_measle: "http://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle_blue.png",
		red_pin: "http://maps.gstatic.com/mapfiles/markers2/marker.png",
		blue_pin: "http://maps.gstatic.com/mapfiles/markers2/marker_blue.png"
	};
	// color in HEX form
	this.makeMarkerIcon = function(letter,color,shadow,scale) {
		var icon = {};
		icon.pinImage = new google.maps.MarkerImage(
			
			"http://chart.apis.google.com/chart?chst=d_map_spin&chld="
			+ 0.5*scale + "|0|" + color + "|" + 13*scale + "|_|" + letter
			,
			null,
			null,
			new google.maps.Point(Math.round(10*scale), Math.round(34*scale)),
			new google.maps.Size(Math.round(21*scale), Math.round(34*scale)));
		if(shadow){
			icon.pinShadow = new google.maps.MarkerImage(
			"http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
			null,
			new google.maps.Point(0, 0),
			new google.maps.Point(Math.round(12*scale), Math.round(35*scale)),
			new google.maps.Size(Math.round(40*scale), Math.round(37*scale)));
		}
		return icon;
	}
	
	this.getMarkerIconURL = function(order) {
		var letter = String.fromCharCode('A'.charCodeAt() + order);
		var icon = that.makeMarkerIcon(letter, that.googleBlue , true,1);
		return icon.pinImage.url;
	}

	////////////////////////////////////////////////////////////////////////////////

	// Display place search results and bind appropriate DOM listeners
	this.updateResults = function() {
		var results = Model.Map.searchResults;
		var markers = Model.Map.markers;
			
		var resultDOM = $('#results');
		resultDOM.empty();
		var i = 0;
		if (results) {
			var table = $('<table class="table">')
			var table_body = $('<tbody>');
			var numRows = 0;		// For blank rows
			var LEAST_ROWS = 10;	// For blank rows
			results.forEach(function(result) {
				var row = $('<tr class="span3">');
				
				var markerTrigger = function(i) {
					return function() {
				  		google.maps.event.trigger(markers[i], 'click');
					}
				};
				
				row.click(markerTrigger(i)); // end onclick function
				
				var markerHighLight = function(i) {
					return function() {
				  		markers[i].setIcon(that.iconURL["red_pin"]);
				  		//markers[i].setAnimation(google.maps.Animation.DROP);
					}
				};
				
				var markerUnhighLight = function(i) {
					return function() {
				  		markers[i].setIcon(that.iconURL["red_measle"]);
					}
				};
				
				row.hover(markerHighLight(i),markerUnhighLight(i));
				
				i++;
				
				
				// create icon td jquery object
				var iconTd = $('<td>');
				var iconContainer = $('<div class="iconContainer">');
				var icon = $('<img class="iconImg">');
				icon.attr('src',result.icon);
				icon.attr('alt',"");
				iconContainer.append(icon);
				iconTd.append(iconContainer);
				row.append(iconTd);
				
				// create name td jquery object
				var nameTd = $('<td>');
				nameTd.text(result.name);
				row.append(nameTd);
				
				// create button for event creation
				var createEvent_btn = $('<button class="btn btn-primary btn-mini hide-plevel-2 createEvent"><i class="icon-plus icon-white"></i></button>');
				createEvent_btn.click(function() {
					View.Event.showAddEvent({"location_names": [result.name], 
						   "location_lats": [result.geometry.location.lat()+delta],
						   "location_lngs": [result.geometry.location.lng()+delta]});
				});
				row.append($('<td>').append(createEvent_btn));
				
				
				table_body.append(row);
				numRows += 1;
			});

			table.append(table_body);
			resultDOM.append(table);
			}
			Permission.setElementPermission(Model.Permission.get());
	}
	
	// info window for place search result
	this.showInfoWindow = function(marker) {
		return function(place, status) {
		  if (Model.Map.iw) {
			Model.Map.iw.close();
			Model.Map.iw = null;
		  }
		
		  if (status == google.maps.places.PlacesServiceStatus.OK) {
			Model.Map.iw = new google.maps.InfoWindow({
			  content: that.getIWContent(place)
			});
			Model.Map.iw.open(Model.Map.map, marker);
		  }
		}
	}
	
	// show the information we want for place search results
	this.getIWContent = function(place) {
		var content = '<table style="border:0"><tr><td style="border:0;">';
		content += '<img class="placeIcon" src="' + place.icon + '"></td>';
		content += '<td style="border:0;"><b><a href="' + place.url + '" target="_blank">' + place.name + '</a></b>';
		content += '</td></tr></table>';
		return content;
	}
	
	
	
	// Helper function to computer absolute postion of where to render event info window div
	var getPixelPositionFromLatLng = function(position) {
		return  Model.Map.projection.fromLatLngToContainerPixel(position);
	}
	
	// Generate a div that displays the information associated with the event
	var showEventWindow = function(event, eventMarker) {
		return function(){
			that.closeEventWindow();
			
			var eventWindow = $('#eventWindow');
			var mapContainer = $('#mapContainer');
			
			// Map container boundaries
			var mapContainerPos = mapContainer.offset();
			var mapContainerH = mapContainer.innerHeight();
			var mapContainerW = mapContainer.innerWidth();
			
			// Computer where to put the div
			var markerPos = getPixelPositionFromLatLng(eventMarker.getPosition());
			var displayPos = {left: markerPos.x + mapContainerPos.left, 
							  top : markerPos.y + mapContainerPos.top};
			
			
			
			var dummy = $('<div class="event-popover">');
			var title = $('<div class="event-popover-title">').html('<h3>' + event.name + '</h3>');
			var content = $('<div class="event-popover-content">').html(View.Event.getEventContent(event));
			dummy.append(title);
			dummy.append(content);
			
			eventWindow.append(dummy);
			
			// Adjust display position when div exceeding boundaries of Map Container
			var windowLeft = displayPos.left;
			var windowTop = displayPos.top;
			
			windowLeft -= Math.min(0, windowLeft - mapContainerPos.left);
			windowTop -= Math.min(0, windowTop - mapContainerPos.top);
			windowLeft -= Math.max(0, (windowLeft + dummy.outerWidth()) - (mapContainerPos.left + mapContainerW));
			windowTop -= Math.max(0, (windowTop + dummy.outerHeight()) - (mapContainerPos.top + mapContainerH));

						
			eventWindow.css('position','absolute');
			eventWindow.css('left', windowLeft+'px');
			eventWindow.css('top', windowTop+'px');

		};
	}
	
	this.closeEventWindow = function (){
		$('#eventWindow').empty();
	}
	
	
	// show markers for every event in eventList (get from Model.Event)
	this.showEventMarkers = function(eventList) {
		// error prevention
		if(!eventList)
			eventList = Model.Event.get();
		
		activeIDs ={};
		for (var i = 0; i < eventList.length; i++){
			var id = eventList[i].id;
			
			// just allow the letter to exceed z and user get weird letters...haha
			var letter = String.fromCharCode('A'.charCodeAt() + i)
			
			activeIDs[id] = true;
			
			var icon = that.makeMarkerIcon(letter, that.googleBlue , true,1);
			
			// Event marker is already in the event marker list
			if (eventMarkers[id]){
				eventMarkers[id].setPosition(
				new google.maps.LatLng(eventList[i].location_lats[0], eventList[i].location_lngs[0]));
				eventMarkers[id].setIcon(icon.pinImage);
			}
			else {
			// Create new markers for event that is not in the event marker list
				eventMarkers[id] = new google.maps.Marker({
					map: Model.Map.map,
					position: new google.maps.LatLng(eventList[i].location_lats[0], eventList[i].location_lngs[0]),
					icon: icon.pinImage,
					shadow: icon.pinShadow,
					zIndex: google.maps.Marker.MAX_ZINDEX + 1
				});
				
			}
			eventMarkers[id].letter = letter;

			letter++;
			google.maps.event.clearListeners(eventMarkers[id], 'click');
			google.maps.event.addListener(eventMarkers[id], 'click', showEventWindow(eventList[i], eventMarkers[id]));
		}
		
		clearEventMarkers();
	}
	
	// remove all the inactive event markers
	var clearEventMarkers = function() {
		for (var key in eventMarkers) {
		  if (eventMarkers.hasOwnProperty(key)) {
			if(activeIDs[key]) {
				continue;
			}
			else{
				eventMarkers[key].setMap(null);
				delete eventMarkers[key];
			}
		  }
		}
	}
	
	// empty the event marker list
	this.emptyEventMarkers = function(){
		eventMarkers = {};
	};
	
	// helper function to move the center of map to a specific event location
	this.panToEventMarker = function(id) {
		Model.Map.map.panTo(eventMarkers[id].position);
		that.highlightEventMarker(id);
	};
	
	this.highlightEventMarker = function(id) {
		//eventMarkers[id].setAnimation(google.maps.Animation.BOUNCE);
		var icon = that.makeMarkerIcon(eventMarkers[id].letter, that.googleBlue , true,1.5);
		eventMarkers[id].setIcon(icon.pinImage);
		eventMarkers[id].setShadow(icon.pinShadow);
		
		google.maps.event.trigger(eventMarkers[id], 'click');
	}
	this.unhighlightEventMarker = function(id) {
		//eventMarkers[id].setAnimation(null);
		var icon = that.makeMarkerIcon(eventMarkers[id].letter, that.googleBlue , true, 1);
		eventMarkers[id].setIcon(icon.pinImage);
		eventMarkers[id].setShadow(icon.pinShadow);
		
		that.closeEventWindow();
	}
		
	this.disableRouteRendering = function() {
		Model.Map.dirRenderer.setMap(null);
		$('#showRouteButton').text('Show Route');
		$('#showRouteButton').removeClass('showing');
	}
	this.enableRouteRendering = function() {
		Model.Map.dirRenderer.setMap(Model.Map.map);
		$('#showRouteButton').text('Hide Route');
		$('#showRouteButton').addClass('showing');
	}
	
	// show the detail driving instructions
	this.showDetailDirections = function(index, panel) {
//		var panel = $("<div>");
		
//		Model.Map.highlightRenderer.setDirections( Model.Map.piecewiseDirResult[index] );
		Model.Map.highlightRenderer.setPanel(panel.get(0));
//		return panel;
	}
	
	this.highlightRoute = function(index) { 
		Model.Map.highlightRenderer.setDirections(Model.Map.piecewiseDirResult[index]);
		Model.Map.highlightRenderer.setMap(Model.Map.map);
	}
	this.unhighlightRoute = function(index) {
		Model.Map.highlightRenderer.setDirections({routes:[]});
		Model.Map.highlightRenderer.setMap(Model.Map.map);
	}
	
	this.toggleOptimalPath = function(){
		Model.Map.dirRenderer.setDirections(Model.Map.optimalPath);
		//Model.Map.dirRenderer.setMap(Model.Map.map);
	}
	
	this.untoggleOptimalPath = function(){
		Model.Map.dirRenderer.setDirections(Model.Map.dirResult);
	}
};


Controller.Map = new function() {
	var that = this;
	
	var firstPageLoad = true;
	
	this.initialize = function() {
		Model.Map.queryCache = '';
		
		initializeGoogleMap();
		
		// Search autocomplete
		Model.Map.autocomplete = new google.maps.places.Autocomplete(document.getElementById('searchTextField'));
		google.maps.event.addListener(Model.Map.autocomplete, 'place_changed', function() {
		  showSelectedPlaceFromAutocomplete();
		});
		
		// get distance and travel time between points.
		Model.Map.dms = new google.maps.DistanceMatrixService();
		
		// used for query directions
		Model.Map.dirService = new google.maps.DirectionsService();
		
		// render directions
  		Model.Map.dirRenderer = new google.maps.DirectionsRenderer({draggable:false, suppressMarkers:true, preserveViewport:true});
		Model.Map.highlightRenderer = new google.maps.DirectionsRenderer({draggable:false, suppressMarkers:true, preserveViewport:true, polylineOptions:{strokeColor:'FF0000', strokeOpacity:0.9, strokeWeight:5} });
		
		$('#searchTextField').keyup(function(e) {
			// Press enter
			if (e.keyCode === 13) { 
				Model.Map.queryCache = $('#searchTextField').val();
				search(); 
			 }  
		});
		// Register the search button
		$('#map-search-btn').click(function() {
				Model.Map.queryCache = $('#searchTextField').val();
				search(); 
		});
		
		$('#showRouteButton').toggle(View.Map.enableRouteRendering, View.Map.disableRouteRendering);
		
		// Whenever event list changes, call these functions
		Model.Event.bind(View.Map.showEventMarkers);
		Model.Event.bind(getEventRoute);
		Model.Event.bind(initialPan);
	}
	
	// Pan the center of map to some event locations
	var initialPan = function() {
		if(firstPageLoad){
			var eventList = Model.Event.get();
			if (eventList && eventList.length !== 0){
				var midIndex = Math.floor(eventList.length/2);
				Model.Map.map.panTo(new google.maps.LatLng(eventList[midIndex].location_lats[0], eventList[midIndex].location_lngs[0]));
			}
			firstPageLoad = false;
		}
	}
	
	var initializeGoogleMap = function() {
		var myLatlng = new google.maps.LatLng(42.3583, -71.0603); // set center to boston
		var myOptions = {
		  zoom: 12,
		  center: myLatlng,
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		Model.Map.map = new google.maps.Map(document.getElementById('mapContainer'), myOptions);
		
		
		// Used for get absolute pixel position from geo location
		MyOverlay.prototype = new google.maps.OverlayView();
		MyOverlay.prototype.onAdd = function() { }
		MyOverlay.prototype.onRemove = function() { }
		MyOverlay.prototype.draw = function() { }
		function MyOverlay(map) { this.setMap(map); }
		
		var overlay = new MyOverlay(Model.Map.map);
		
		Model.Map.projection = overlay.getProjection();
		
		// Wait for idle map
		google.maps.event.addListener(Model.Map.map, 'bounds_changed', function() {
		   // Get projection
		   Model.Map.projection = overlay.getProjection();
		})
		
 		google.maps.event.addListener(Model.Map.map, 'tilesloaded', tilesLoaded);
 		google.maps.event.addListener(Model.Map.map,'center_changed',View.Map.closeEventWindow);
		
		// Search place
		Model.Map.placesService = new google.maps.places.PlacesService(Model.Map.map);
	}
	
	
	this.restartMap = function(){

			$('#mapContainer').empty();
			
			google.maps.event.clearInstanceListeners(Model.Map.map);
			delete Model.Map.map ;			// Google Map
			delete Model.Map.placesService;
			
			View.Map.emptyEventMarkers();
			
			initializeGoogleMap();
			
			// pan to where we are before restart
			that.panToEventCenter();
			Model.Map.map.setZoom(Model.Map.previousZoom);

			View.Map.showEventMarkers();
			
			if ($('#showRouteButton').hasClass('showing')){
				Model.Map.dirRenderer.setMap(Model.Map.map);
			}
	}
	
	this.panToEventCenter = function(){
		var eventList = Model.Event.get();
		
		if (eventList && eventList.length !== 0){
			var midIndex = Math.floor(eventList.length/2);
			Model.Map.map.panTo(new google.maps.LatLng(eventList[midIndex].location_lats[0], eventList[midIndex].location_lngs[0]));
		}
	}
	

	// execute once when map finish loading
	var tilesLoaded = function() {
		google.maps.event.clearListeners(Model.Map.map, 'tilesloaded');
		
		google.maps.event.addListener(Model.Map.map, 'draggend', function(){search();});
		google.maps.event.addListener(Model.Map.map, 'zoom_changed', function(){search();});
		google.maps.event.addListener(Model.Map.map, 'bounds_changed', 
		function() {
			View.Map.showEventMarkers();;
			//Model.Map.previousCenter = Model.Map.map.getCenter();
			Model.Map.previousZoom = Model.Map.map.getZoom();
		});
		
		search();
		//getEventRoute();
		View.Map.showEventMarkers();

	}

	// execute when user select one place from autocomplete list
	function showSelectedPlaceFromAutocomplete() {
		Model.Map.searchResults = [];
		clearMarkers(Model.Map.markers);
		var place = Model.Map.autocomplete.getPlace();
		
		// HACK! when user not actually select on place from list but hit enter directly
		if(place.geometry === undefined) return;
		
		Model.Map.map.panTo(place.geometry.location);
		Model.Map.markers[0] = new google.maps.Marker({
		  position: place.geometry.location,
		  map: Model.Map.map
		});
		google.maps.event.addListener(Model.Map.markers[0], 'click', getDetails(place, 0));
		
		Model.Map.queryCache = $('#searchTextField').val();
		Model.Map.searchResults.push(place);
		View.Map.updateResults();
	}

	// search for place
	function search() {
	
		Model.Map.autocomplete.setBounds(Model.Map.map.getBounds());
		
		if (Model.Map.queryCache === "") {
			Model.Map.searchResults = [];
			View.Map.updateResults();
			return;
		}
		
		var request = {
		  location: Model.Map.map.getCenter(),
		  radius: getMapRadius(),
		  keyword: Model.Map.queryCache,
		  rankBy: google.maps.places.RankBy.PROMINENCE
		};
		
		
		Model.Map.placesService.search(request, function(results, status) {
		  if (status === google.maps.places.PlacesServiceStatus.OK) {
			Model.Map.searchResults = results;
			
			clearMarkers(Model.Map.markers);
			for (var i = 0; i < results.length; i++) {
			  //var icon = View.Map.makeMarkerIcon(View.Map.defaultLetter, View.Map.googleRed, true, 1);
			  Model.Map.markers[i] = new google.maps.Marker({
				map: Model.Map.map,
				position: results[i].geometry.location,
				icon: View.Map.iconURL['red_measle'],
				//shadow: icon.pinShadow
			  });
			  google.maps.event.addListener(Model.Map.markers[i], 'click', getDetails(results[i], i));
			}
			
			View.Map.updateResults();
		  }
		});
	}
	
	function clearMarkers(mlist) {
		for (var i = 0; i < mlist.length; i++) {
		  if (mlist[i]) {
			mlist[i].setMap(null);
			mlist[i] = null;
		  }
		}
	}
	
	// get detail information of a specific place
	function getDetails(result, i) {
		return function() {
		  Model.Map.placesService.getDetails({
			reference: result.reference
		  }, View.Map.showInfoWindow(Model.Map.markers[i]));
		}
	}
	
	
	function getEventRoute(eventList) {
		Model.Map.dirResult.routes = [];
		Model.Map.piecewiseDirResult = [];
		
		if(!eventList)
			eventList = Model.Event.get();
		
		var end = eventList.length;
		
		// Less than one event left
		if (end <=1){
			Model.Map.dirResult.routes = [];
			Model.Map.dirRenderer.setDirections(Model.Map.dirResult);
			var data = {};
			data.timelist = [];
			data.distlist = [];
			Model.Map.set(data);
			return;
		}
		
		var data = {};
		data.timelist = [];
		data.distlist = [];
		
		// callback function generator for piecewise route query
		var routeCallbackGen = function(index) {
			// The last event
			if (index === end -1){
				return function(result, status) {
				if (status === google.maps.DirectionsStatus.OK) {
					  Model.Map.piecewiseDirResult.push(result);
					  
					  var legs = result.routes[0].legs;
					  data.timelist.push(legs[0].duration);
					  data.distlist.push(legs[0].distance);
					  
					  // Combining previous query results
					  if (Model.Map.dirResult.routes.length === 0){
							Model.Map.dirResult.routes.push({});
							Model.Map.dirResult.routes[0].bounds = result.routes[0].bounds;
							Model.Map.dirResult.routes[0].copyrights = result.routes[0].copyrights;
							Model.Map.dirResult.routes[0].legs = result.routes[0].legs.slice();
							Model.Map.dirResult.routes[0].overview_path = result.routes[0].overview_path.slice();
							Model.Map.dirResult.routes[0].warnings = result.routes[0].warnings.slice();
							Model.Map.dirResult.routes[0].waypoint_order = [];
					  }
					  else{
							Model.Map.dirResult.routes[0].bounds  = result.routes[0].bounds.union(Model.Map.dirResult.routes[0].bounds);
							Model.Map.dirResult.routes[0].copyrights = result.routes[0].copyrights;
							Model.Map.dirResult.routes[0].legs.push(result.routes[0].legs[0]);
							Model.Map.dirResult.routes[0].overview_path = Model.Map.dirResult.routes[0].overview_path.concat(result.routes[0].overview_path);
							Model.Map.dirResult.routes[0].warnings = Model.Map.dirResult.routes[0].warnings.concat(result.routes[0].warnings);
							Model.Map.dirResult.routes[0].waypoint_order.push(Model.Map.dirResult.routes[0].waypoint_order.length);
					  }
				  
					  
				}
				else{
				  Model.Map.piecewiseDirResult.push(result);
				  data.timelist.push({'text':'unreachable', 'value': 0});
				  data.distlist.push({'text':'unreachable', 'value': 0});
				}
					Model.Map.set(data);
					that.getOptimalOrder();
					Model.Map.dirRenderer.setDirections(Model.Map.dirResult);
					//View.Map.highlightRoute(0);
				};
			}
			
			else {
				return function(result, status) {
					if (status === google.maps.DirectionsStatus.OK) {
					  Model.Map.piecewiseDirResult.push(result);
					  
					  var legs = result.routes[0].legs;
					  data.timelist.push(legs[0].duration);
					  data.distlist.push(legs[0].distance);
					  
					   // Combining previous query results
					  if (Model.Map.dirResult.routes.length === 0){
							Model.Map.dirResult.routes.push({});
							Model.Map.dirResult.routes[0].bounds = result.routes[0].bounds;
							Model.Map.dirResult.routes[0].copyrights = result.routes[0].copyrights;
							Model.Map.dirResult.routes[0].legs = result.routes[0].legs.slice();
							Model.Map.dirResult.routes[0].overview_path = result.routes[0].overview_path.slice();
							Model.Map.dirResult.routes[0].warnings = result.routes[0].warnings.slice();
							Model.Map.dirResult.routes[0].waypoint_order = [];
					  }
					  else{
							Model.Map.dirResult.routes[0].bounds  = result.routes[0].bounds.union(Model.Map.dirResult.routes[0].bounds);
							Model.Map.dirResult.routes[0].copyrights = result.routes[0].copyrights;
							Model.Map.dirResult.routes[0].legs.push(result.routes[0].legs[0]);
							Model.Map.dirResult.routes[0].overview_path = Model.Map.dirResult.routes[0].overview_path.concat(result.routes[0].overview_path);
							Model.Map.dirResult.routes[0].warnings = Model.Map.dirResult.routes[0].warnings.concat(result.routes[0].warnings);
							Model.Map.dirResult.routes[0].waypoint_order.push(Model.Map.dirResult.routes[0].waypoint_order.length);
					  }
					  
						}
					else{
					  Model.Map.piecewiseDirResult.push(result);
					  data.timelist.push({'text':'unreachable', 'value': 0});
					  data.distlist.push({'text':'unreachable', 'value': 0});
					}
					
					// Recursively initiate the callback
					var from = new google.maps.LatLng(eventList[index].location_lats[0], eventList[index].location_lngs[0]);
					var to = new google.maps.LatLng(eventList[index+1].location_lats[0], eventList[index+1].location_lngs[0]);
						
					var routeQuery = {
					  origin: from,
					  destination: to,
					  waypoints: [],
					  optimizeWaypoints: false,
					  travelMode: google.maps.TravelMode.DRIVING,
					  unitSystem: google.maps.UnitSystem.METRIC
					};
					Model.Map.dirService.route(routeQuery, routeCallbackGen(index + 1));
				};
			
			}
		}
		
		var from = new google.maps.LatLng(eventList[0].location_lats[0], eventList[0].location_lngs[0]);
		var to = new google.maps.LatLng(eventList[1].location_lats[0], eventList[1].location_lngs[0]);
			
		var routeQuery = {
		  origin: from,
		  destination: to,
		  waypoints: [],
		  optimizeWaypoints: false,
		  travelMode: google.maps.TravelMode.DRIVING,
		  unitSystem: google.maps.UnitSystem.METRIC
		};

		Model.Map.dirService.route(routeQuery, routeCallbackGen(1));
			
		
	}
	
	// Get optimal event order using google map api
	// Currently not supported when some of the events are not reachable
	this.getOptimalOrder = function(){
		
		eventList = Model.Event.get();
		
		var end = eventList.length;
		
		var waypts = [];
		
		for (var i = 1; i < end-1; i++){
			var loc = new google.maps.LatLng(eventList[i].location_lats[0], eventList[i].location_lngs[0]);
			waypts.push({location:loc, stopover:true});
		}
		
		var routeQuery = {
		  origin: new google.maps.LatLng(eventList[0].location_lats[0], eventList[0].location_lngs[0]),
		  destination: new google.maps.LatLng(eventList[end-1].location_lats[0], eventList[end-1].location_lngs[0]),
		  waypoints: waypts,
		  optimizeWaypoints: true,
		  travelMode: google.maps.TravelMode.DRIVING,
		  unitSystem: google.maps.UnitSystem.METRIC
    	};
		
		Model.Map.dirService.route(routeQuery, function(result, status){
			if (status === google.maps.DirectionsStatus.OK) {
			  Model.Map.optimalOrder = result.routes[0].optimized_waypoint_order;
			  Model.Map.optimalPath = result;
			  var optimizedTimelist = [];
			  result.routes[0].legs.forEach(function(e) {
			  	optimizedTimelist.push(e.duration);
			  });
			  Model.Map.optimalTimelist = optimizedTimelist;
			}
		});
	
	}
	
	// helper function: convert zoom level to radius on the map
	function getMapRadius(){
		var zoom = Model.Map.map.getZoom();
		var radius = 15*Math.pow(2,21-zoom);
		
		return radius;
	}

};






