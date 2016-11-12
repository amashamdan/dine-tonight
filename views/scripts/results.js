$(document).ready(function() {
	$(".results-div").slideDown(800);
	$(".more-info-button").click(function() {
		$(this).parent().siblings(".more-info").slideToggle();
	});

	var clicked;
	$(".will-go").click(function() {
		clicked = $(this);
		$.ajax({
			url: "/action/" + clicked.parents(".result").attr("id"),
			type: "POST",
			statusCode: {
				201: handle201,
				404: handle404
			}
		});
	});	

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

	var handle201 = function(data, textStatus, jqXHR) {
		if (clicked.html() == "Don't wanna go") {
			clicked.html("I want to go");
		} else if (clicked.html() == "I want to go") {
			clicked.html("Don't wanna go");
		}
		clicked.toggleClass("will-go will-not-go");
	}

	var handle404 = function(data, textStatus, jqXHR) {
		alert("Changes could not be saved... sorry!");
	}	

});