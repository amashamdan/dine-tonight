var express = require("express");
var ejs = require("ejs");
var mongodb = require("mongodb");
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;

var app = express();
var MongoClient = mongodb.MongoClient;
var mongoUrl = process.env.NIGHTLIFE;

app.use("/stylesheets", express.static(__dirname + "/views/stylesheets"));
app.use("/scripts", express.static(__dirname + "/views/scripts"));

MongoClient.connect(mongoUrl, function(err, db) {
	if (err) {
		res.end("Failed to connect to Database.")
	} else {
		var restaurents = db.collection("restaurents");
		app.get("/", function(req, res) {
			res.render("index.ejs");
		})
	}
});



// port 8080 used for localhost during development.
var port = Number(process.env.PORT || 8080)
app.listen(port);