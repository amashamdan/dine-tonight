var express = require("express");
/* Module to redirect http calls to https. */
var secure = require('express-force-https');
var ejs = require("ejs");
var mongodb = require("mongodb");
var Yelp = require("yelp");
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var bodyParser = require("body-parser");
var parser = bodyParser.urlencoded({extended: false});

var app = express();
/* For redirecting http to https. */
app.use(secure);
/* mongodb variable. */
var MongoClient = mongodb.MongoClient;
var mongoUrl = process.env.NIGHTLIFE;
/* Serve style and script files. */
app.use("/stylesheets", express.static(__dirname + "/views/stylesheets"));
app.use("/scripts", express.static(__dirname + "/views/scripts"));
/* For facebook login. From facebook documentation. */
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
/* Next 8 lines also from facebook documentation for faceboook login. */
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
/* Yelp instance. Saves information needed to use yelp API. */
var yelp = new Yelp({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	token: process.env.TOKEN,
	token_secret: process.env.TOKEN_SECRET
});
/* Coonect to mongo when the server is started. */
MongoClient.connect(mongoUrl, function(err, db) {
	if (err) {
		res.end("Failed to connect to Database.")
	} else {
		/* Variable which stores the search results from Yelp. */
		var resultsGlobal = [];
		/* Stores the searched city. */
		var cityGlobal;
		/* Collection in the database is restaurants. */
		var restaurants = db.collection("restaurants");
		/* get request to homepage */
		app.get("/", function(req, res) {
			/* index.ejs is rendered. */
			res.render("index.ejs");
		});
		/* get request to /results. This happens after login when user is redirected here and should see the same search results without having to search again. */
		app.get("/results", function(req, res) {
			/* Calls function renderResults. undefined here is the error parameter. */
			renderResults(req, res, undefined, req.user, req.user.displayName, resultsGlobal, cityGlobal, restaurants);
		});
		/* post request to /results. When a search is initiated. */
		app.post("/results", parser, function(req, res) {
			/* If the user selected a sorting type it is saved in sorting variable. Otherwise sorting is set to 1, which is sort by distance. */
			if (req.body.sorting) {
				var sorting = Number(req.body.sorting);
			} else {
				var sorting = 1;
			}
			/* Call yelp api and search for restaurant. limit 20 means load 20 results. */
			yelp.search({
				term: "restaurant", 
				location: req.body.location,
				limit: 20,
				sort: sorting
			}).then(function(data) {
				/* When response is received, data will extracted and saved in results array, which is declared below. */
				var results = [];
				/* Loop through each restaurant in data.businesses and extract data. */
				for (var item in data.businesses) {
					/* results array will consist of objects. Each object represents a restaurant. Data for each retaurant temporarily stored in business object. */
					var business = {};
					/* All information extracted for each retaurant. */
					business.name = data.businesses[item].name;
					business.rating = data.businesses[item].rating;
					business.reviews = data.businesses[item].review_count;
					business.url = data.businesses[item].url;
					business.phone = data.businesses[item].phone;
					business.snippet = data.businesses[item].snippet_text;
					business.image = data.businesses[item].image_url;
					business.status = data.businesses[item].is_closed;
					business.address = data.businesses[item].location.display_address;
					/* The retaurant is pushed to results array. */
					results.push(business);
				}
				/* Results and city are stored in respective variables. */
				resultsGlobal = results;
				cityGlobal = req.body.location;
				/* If the user is logged in, renderResults function is called because it needs to checks user's information. */
				if (req.user) {
					renderResults(req, res, undefined, req.user, req.user.displayName, resultsGlobal, cityGlobal, restaurants);
				} else {
					/* If no user is logged in, no need to check for any information and the results can be rendered directly.
					user is set to undefined or an error will results in results.js because user will generate reference error. So it's given a falsey value. */
					var user = undefined;
					/* The error here means if an error related to Yelp was received. */
					res.render("results.ejs", {results: results, error: undefined, user: user});
				}
			/* If call to Yelp results in an error, that error is saved and passed to results.ejs. */
			}).catch(function(err) {
				var errorText = JSON.parse(err.data).error.text;
				res.render("results.ejs", {results: undefined, errorText: errorText, user: undefined});
			});
		});
		/* post request initiated when the user clicks "I want to go" button. */
		app.post("/action/:name", function(req, res) {
			/* database is updated. Documents are search for matching user and city. */
			restaurants.update(
				{"name": req.params.name, "city": cityGlobal},
				/* If found, the count (number of people going) is incremented, and the username is added to the people's list. */
				{"$inc": {"count": 1}, "$addToSet": {"people": req.user.displayName}},
				/* If no document is found a new one is created. */
				{"upsert": true},
				/* When updating is done */
				function(err, results) {
					/* If a document is modified or a document is added, 201 code is ent to client. Otherwise 404 code is sent. */
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
		/* post request initiated when the user clicks "Don't wanna go button." */
		app.post("/cancel/:name", function(req, res) {
			/* The document matching username and city is lookedup. */
			restaurants.update(
				{"name": req.params.name, "city": cityGlobal},
				/* count reduced and name deleted from people's list. */
				{"$inc": {"count": -1}, "$pull": {"people": req.user.displayName}},
				/* 201 is sent when modification done. If nothing is changed 404 is sent. */
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
		/* The last page variable used during login to store the page which initited login, the client will be redirected to the same page after login. */
		var lastPage = "/";
		/* Called during login as middleware to store the Referer page. */
		function savePage(req, res, next) {
			lastPage = req.header("Referer");
			next();
		}
		/* request initiated when login button is clicked. Calls savePage to store the current page. */
		app.get("/login", savePage, passport.authenticate('facebook'));
		/* login return request. */
		app.get('/login/return', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
    			/* redirects the user to the last page where the request originated from. */
    			res.redirect(lastPage);
  		});
		/* Facebook logout request. */
  		app.get('/logout', function(req, res){
		    req.logout();
		    res.redirect("/");
		});
	}
});
/* This function compares the results with the information in the database.
For each results that is found in the database, the list people is loaded. Then Another check is made to see which places in the result the user has already decided to go to. This check is made to decided which button to show to the user: "I want to go" ot "Don't want to go." */
function renderResults(req, res, error, user, username, resultsGlobal, cityGlobal, restaurants) {
	/* Restaurants in the database are retreived: */
	restaurants.find({}).toArray(function(error, allItems){
		/* Loops through the search results. */
		for (var result in resultsGlobal) {
			/* Initially, for each result, the people list is set to the shown text. */
			resultsGlobal[result].people = ["None so far, be the first and click on 'I want to go'"];
			/* A nested loop loops through the restaurants saved in the database and finds which search results are in the database. For eacg restaurant in the database, the list of people is loaded given that is has at least a name in it. */
			for (var item in allItems) {
				if (resultsGlobal[result].name == allItems[item].name) {
					if (allItems[item].people.length > 0) {
						resultsGlobal[result].people = allItems[item].people;
					}
				}
			}
		}
		/* All restaurants matching the city and username are loaded. */
		restaurants.find({"city": cityGlobal, "people": username}).toArray(function(err, items) {
			/* isGoing property fir each retaurant is set false (meaning the current user is not going). */
			for (var restaurant in resultsGlobal) {
				resultsGlobal[restaurant].isGoing = false;
			}
			/* The retaurants retreived from the database are compared with the search results. When a match is found, isGoing is set to true which means the user is going. (Remember the items here all include the current user). */
			for (var item in items) {
				for (var restaurant in resultsGlobal) {
					if (resultsGlobal[restaurant].name == items[item].name) {
						resultsGlobal[restaurant].isGoing = true;
					} 
				}
			}
			/* Results are rendered. */
			res.render("results.ejs", {results: resultsGlobal, error: error, user: user});
		});
	});
}

// port 443 used for localhost during development.
var port = Number(process.env.PORT || 443)
app.listen(port);