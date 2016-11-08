$(document).ready(function() {
	$("#search-form").submit(function(e) {
		e.preventDefault();
		if ($("#search-input").val() == "") {
			alert("Please enter a location");
		} else {
			e.target.submit();
		}
	})
});