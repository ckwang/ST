var Permission = new function() {
	this.permissionToString = function(p) {
		switch(p) {
			case 4:
				return "Is owner"
			case 3:
				return "Can share"
			case 2:
				return "Can edit"
			case 1:
				return "Can view"
			default:
				return "Should not be here"
		}
	}
	this.setElementPermission = function(permission) {
		for (var i = 1; i <= 4; i++) {
			if (i > permission) {
				$('.hide-plevel-' + i).css('display', 'none');
				$('.disable-plevel-' + i).attr('disabled', 'disabled');
			} else {
				$('.hide-plevel-' + i).css('display', '');
				$('.disable-plevel-' + i).removeAttr('disabled');				
			}
		}
	}	
}
