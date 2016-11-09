$(document).ready(function() {
	$("#search-form").submit(function(e) {
		e.preventDefault();
		if ($("#search-input").val() == "") {
			alert("Please enter a location");
		} else {
			e.target.submit();
		}
	})
	$("#find-me-button").click(function(e) {
		e.preventDefault();

		/* Location lookup using ipinfo api */
		$.getJSON('http://ipinfo.io?callback=?', function(data){
			/* The location is stored in the variable location. */
			console.log(data);
			var location = data.city + " " + data.region;
			$("#search-input").val(location);
			// e.target.submit() doesn't work, seems like problem referencing the form.
			$("#search-form").submit();
		});
	});
});


