// Check if two variables composed of primitive types, arrays and objects are "deeply equal"
var checkEqual = function(a, b) {
	if (a instanceof Object) {
		if (!b instanceof Object) {
			return false;
		} else {	// Compare all keys and values if both a and b are objects
			for (var k in a) {
				if (a.hasOwnProperty(k) && b.hasOwnProperty(k)) {
					if (!checkEqual(a[k], b[k])) {
						return false;
					}
				} else {
					return false;
				}
			}
			for (var k in b) {	// Make sure that the keySet of a is the same as the keySet of b
				if (a.hasOwnProperty(k) && b.hasOwnProperty(k)) {
					if (!checkEqual(a[k], b[k])) {
						return false;
					}
				} else {
					return false;
				}
			}
			return true;
		}
	} else if (a instanceof Array) {
		if (!b instanceof Array) {
			return false;
		} else if (a.length !== b.length) {	// If a and b are both arrays, check length first
			return false;
		} else {
			for (var i = 0; i < a.length; i++) {	// With equal length, recursively check each element
				if (!checkEqual(a, b)) {
					return false;
				}
			}
			return true;
		}
	} else {	// Primary type
		return (a === b);
	}
}