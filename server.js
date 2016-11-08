var express = require("express");
var ejs = require("ejs");
var mongodb = require("mongodb");
var Yelp = require("yelp");
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var bodyParser = require("body-parser");
var parser = bodyParser.urlencoded({extended: false});

var app = express();
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
			var sorting = Number(req.body.sorting);
			yelp.search({
				term: "restaurant", 
				location: req.body.location,
				limit: 20,
				sort: sorting
			}).then(function(data) {
				res.send(data);
				res.end();
			});
			//res.render("results.ejs")
		});
	}
});



// port 8080 used for localhost during development.
var port = Number(process.env.PORT || 8080)
app.listen(port);