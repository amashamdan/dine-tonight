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
		$.getJSON('https://ipinfo.io', function(data){
			/* The location is stored in the variable location. */
			var location = data.city;
			$("#search-input").val(location);
			// e.target.submit() doesn't work, seems like problem referencing the form.
			$("#search-form").submit();
		});
	});
	document.getElementById('share').onclick = function() {
		FB.ui({
	    	method: 'share',
	    	display: 'popup',
	    	href: "http://fine-dining.herokuapp.com"
		}, function(response){});
	}
});


