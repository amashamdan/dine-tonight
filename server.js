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

passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    /* Do not redirect to root. return root uses another function needed for authentication, that function cannot work with root. */
    callbackURL: 'http://localhost:443/login/return'
  },
  function(accessToken, refreshToken, profile, cb) {
  	/* Comments below from Passport example code. */
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
  }));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());

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
		var resultsGlobal = [];
		var cityGlobal;
		var restaurants = db.collection("restaurants");
		app.get("/", function(req, res) {
			res.render("index.ejs");
		});

		app.get("/results", function(req, res) {
			renderResults(req, res, undefined, req.user, req.user.displayName, resultsGlobal, cityGlobal, restaurants);
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

				resultsGlobal = results;
				cityGlobal = req.body.location;
				if (req.user) {
					//var user = req.user;
					renderResults(req, res, undefined, req.user, req.user.displayName, resultsGlobal, cityGlobal, restaurants);
				} else {
					var user = undefined;
					res.render("results.ejs", {results: results, error: undefined, user: user});
				}

			}).catch(function(err) {
				var errorText = JSON.parse(err.data).error.text;
				res.render("results.ejs", {results: undefined, errorText: errorText, user: undefined});
			});
		});

		app.post("/action/:name", function(req, res) {
			restaurants.update(
				{"name": req.params.name, "city": cityGlobal},
				{"$inc": {"count": 1}, "$push": {"people": req.user.displayName}},
				{"upsert": true},
				function(err, results) {
					if (results.result.nModified == 1 || "upserted" in results.result) {
						res.status(201);
						res.end();
					} else {
						res.status(404);
						res.end();
					}
				}
			);
		});

		app.post("/cancel/:name", function(req, res) {
			restaurants.update(
				{"name": req.params.name, "city": cityGlobal},
				{"$inc": {"count": -1}, "$pull": {"people": req.user.displayName}},
				function(err, results) {
					if (results.result.nModified == 1) {
						res.status(201);
						res.end();
					} else {
						res.status(404);
						res.end();
					}
				}
			);
		})

		var lastPage = "/";
		function savePage(req, res, next) {
			lastPage = req.header("Referer");
			next();
		}

		app.get("/login", savePage, passport.authenticate('facebook'));

		app.get('/login/return', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
    			/* redirects the user to the last page where the request originated from. */
    			res.redirect(lastPage);
  		});
	}
});

function renderResults(req, res, error, user, username, resultsGlobal, cityGlobal, restaurants) {
	restaurants.find({"city": cityGlobal, "people": username}).toArray(function(err, items) {
		for (var restaurant in resultsGlobal) {
			resultsGlobal[restaurant].isGoing = false;
		}
		for (var item in items) {
			for (var restaurant in resultsGlobal) {
				if (resultsGlobal[restaurant].name == items[item].name) {
					resultsGlobal[restaurant].isGoing = true;
				} 
			}
		}
		res.render("results.ejs", {results: resultsGlobal, error: error, user: user});
	});
}

// port 8080 used for localhost during development.
var port = Number(process.env.PORT || 443)
app.listen(port);