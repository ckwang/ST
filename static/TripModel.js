// Constructor for the generic model objects
Model.model = function() {
	var that = this;
	var subscribers = [];
	// Get the data of this model
	this.get = function() {
		return that.data;
	};
	
	// Set the data
	// forceFire: boolean. If true, it fires all subscribers whether or not there's real update in data
	this.set = function(d, forceFire) {
		if (!forceFire) {
			// check if d and that.data are the same
			// Fire subscribers only if the new data is not the same
			if (!checkEqual(that.data, d)) {
				that.data = d;
				subscribers.forEach(function(callback) {
					callback(d);
				});
			}
		// Fire anyway if force fire
		} else {
			that.data = d;
			subscribers.forEach(function(callback) {
				callback(d);
			});
		}
	};
	
	// Return the element in data with the specified id
	this.getById = function(id) {
		if (!that.data) return;
		var output;
		that.data.forEach(function(e) {
			if (e.id === id) output = e;
		});
		return output;
	};
	
	// bind a subscriber function to this model
	this.bind = function(callback) {
		subscribers.push(callback);
		if (that.data) callback(that.data);
	};
	// Remove all subscribers
	this.unbind = function() {
		for (var i = 0; i < subscribers.length; i++) subscribers.pop();
	};
}

// Permission
Model.Permission = new Model.model();