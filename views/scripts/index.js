$(document).ready(function() {
	/* Search form submit handler */
	$("#search-form").submit(function(e) {
		e.preventDefault();
		/* Checks if a location is entered or not. */
		if ($("#search-input").val() == "") {
			alert("Please enter a location");
		} else {
			/* Resume form submission. */
			e.target.submit();
		}
	})
	/* Find me button handler. */
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
	/* Share button click handler. From facebook documentaion. */
	document.getElementById('share').onclick = function() {
		FB.ui({
	    	method: 'share',
	    	display: 'popup',
	    	href: "https://fine-dining.herokuapp.com"
		}, function(response){});
	}
});


