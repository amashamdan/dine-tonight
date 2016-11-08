$(document).ready(function() {
	console.log("HI")
	var counter = 0;
	$(".result").each(function(i) {
		var result = $(this);
		setTimeout(function() {
			$(result).slideDown(300);
		}, 300 * counter);
		counter++;
	});
});