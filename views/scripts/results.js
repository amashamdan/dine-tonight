$(document).ready(function() {
	$(".results-div").slideDown(800);
	$(".more-info-button").click(function() {
		$(this).parent().siblings(".more-info").fadeToggle();
	})
});