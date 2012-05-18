//
//	Resize height-floating and width-floating elements when the window resizes
//

$(document).ready(function() {
	$(window).resize(function() {
		$('body').css('height', $(window).height() - 80);
		$('.height-floating').each(function() {
			var that = this;
			var parentHeight = parseInt($(that).parent().innerHeight());
			var siblingsHeight = 0;
			$(that).siblings('.height-fixed').each(function() {
				var sib = this;
				if ($(sib).css('display') !== 'none') {
					siblingsHeight += (parseInt($(sib).outerHeight(true)));
				}
			});
			// Adjust height
			$(that).css('height', parentHeight - siblingsHeight);
		});
		$('.width-floating').each(function() {
			var that = this;
			var parentWidth = parseInt($(that).parent().innerWidth()) - parseInt($(that).parent().css('padding-right')) - parseInt($(that).parent().css('padding-left'));
			var siblingsWidth = 0;
			$(that).siblings('.width-fixed').each(function() {
				var sib = this;
				if ($(sib).css('display') !== 'none') {
					siblingsWidth += (parseInt($(sib).outerWidth(true)));
				}
			});
			// Adjust width
			$(that).css('width', parentWidth - siblingsWidth);
		});

	});
	
	$(window).resize();
});