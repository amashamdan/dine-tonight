$(document).ready(function() {
	var positionTop = $(window).height() - $(".footer").height();
	$(".footer").css({"position": "fixed", "top": positionTop});
});