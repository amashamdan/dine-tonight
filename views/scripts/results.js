$(document).ready(function() {
	$(".will-go").each(function(i) {
		$(this).parent().attr("href", "/action/" + $(this).parents(".result").attr("id"));
	});
	$(".will-not-go").each(function(i) {
		$(this).parent().attr("href", "/cancel/" + $(this).parents(".result").attr("id"));
	});
	$(".results-div").slideDown(800);
	$(".more-info-button").click(function() {
		$(this).parent().siblings(".more-info").fadeToggle();
	})
});