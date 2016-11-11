var express = require("express");
var secure = require('express-force-https');
var ejs = require("ejs");
var mongodb = require("mongodb");
var Yelp = require("yelp");
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var bodyParser = require("body-parser");
var parser = bodyParser.urlencoded({extended: false});

var app = express();
app.use(secure);
var MongoClient = mongodb.MongoClient;
var mongoUrl = process.env.NIGHTLIFE;

app.use("/stylesheets", express.static(__dirname + "/views/stylesheets"));
app.use("/scripts", express.static(__dirname + "/views/scripts"));

var yelp = new Yelp({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	token: process.env.TOKEN,
	token_secret: process.env.TOKEN_SECRET
});

MongoClient.connect(mongoUrl, function(err, db) {
	if (err) {
		res.end("Failed to connect to Database.")
	} else {
		var restaurents = db.collection("restaurents");
		app.get("/", function(req, res) {
			res.render("index.ejs");
		});

		app.post("/results", parser, function(req, res) {
			if (req.body.sorting) {
				var sorting = Number(req.body.sorting);
			} else {
				var sorting = 1;
			}
			
			yelp.search({
				term: "restaurant", 
				location: req.body.location,
				limit: 20,
				sort: sorting
			}).then(function(data) {
				var results = [];
				for (var item in data.businesses) {
					var business = {};
					business.name = data.businesses[item].name;
					business.rating = data.businesses[item].rating;
					business.reviews = data.businesses[item].review_count;
					business.url = data.businesses[item].url;
					business.phone = data.businesses[item].phone;
					business.snippet = data.businesses[item].snippet_text;
					business.image = data.businesses[item].image_url;
					business.status = data.businesses[item].is_closed;
					business.address = data.businesses[item].location.display_address;
					results.push(business);
				}
				res.render("results.ejs", {results: results, error: undefined});
			}).catch(function(err) {
				var errorText = JSON.parse(err.data).error.text;
				res.render("results.ejs", {results: undefined, errorText: errorText});
			});
		});
	}
});



// port 8080 used for localhost during development.
var port = Number(process.env.PORT || 443)
app.listen(port);