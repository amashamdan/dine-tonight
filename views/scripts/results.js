$(document).ready(function() {
	/* Results appear after the pafe is loaded with slide effect. */
	$(".results-div").slideDown(800);
	/* The Expand information click handler. */
	$(".more-info-button").click(function() {
		/* Find the way to the corresponding more-info div and show it. */
		$(this).parent().siblings(".more-info").slideToggle();
	});
	/* This variable stores which button was clicked since there are 20 of them. */
	var clicked;
	/* "I want to go" button click handler. */
	$(".will-go").click(function() {
		/* Saves the clicked button. */
		clicked = $(this);
		/* AJAX post request with the url including the place's name. */
		$.ajax({
			url: "/action/" + clicked.parents(".result").attr("id"),
			type: "POST",
			/* Specifies which function to call based on status code received from the server. */
			statusCode: {
				201: handle201,
				404: handle404
			}
		});
	});	
	/* Same as above when "Don't wanna go button is clicked." */
	$(".will-not-go").click(function() {
		clicked = $(this);
		$.ajax({
			url: "/cancel/" + clicked.parents(".result").attr("id"),
			type: "POST",
			statusCode: {
				201: handle201,
				404: handle404
			}
		});
	});
	/* Called when status 201 received. Means that changed written successfully to the server. */
	var handle201 = function(data, textStatus, jqXHR) {
		/* Button text is inverted. */
		if (clicked.html() == "Don't wanna go") {
			clicked.html("I want to go");
		} else if (clicked.html() == "I want to go") {
			clicked.html("Don't wanna go");
		}
		/* Button class is toggled between the two classes. */
		clicked.toggleClass("will-go will-not-go");
	}
	/* Called when status 404 is received from the server. It alerts an error message to the user. */
	var handle404 = function(data, textStatus, jqXHR) {
		alert("Changes could not be saved... sorry!");
	}	
});