/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

require('dotenv').load();

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var https = require('https');
var JSON = require('JSON');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function () {

  // print a message when the server starts listening
  console.log('server starting on ' + appEnv.url);
});

// development error handler
// will print stacktrace

//use a cloudant db to install the other data of disaster information
//add a cloudant service to the instance
//init the db
//store the meta data of the document in the db
var cloudant_db= {
   dbs: {
     items: {
       name: "items",
       handler: null
     }
   }
};

var cloudant;

var async = require('async');

function useDatabase(next) {
  async.forEach(Object.keys(cloudant_db.dbs), function (db, callback) {
    cloudant.db.create(cloudant_db.dbs[db].name, function (err, res) {
      if (err) {
        console.log('database ' + cloudant_db.dbs[db].name + ' already created');
      } else {
        console.log('database ' + cloudant_db.dbs[db].name + ' is created');
      }
      cloudant_db.dbs[db].handler = cloudant.use(cloudant_db.dbs[db].name);

      callback();
    });
  }, function (err) {

    //create the index on answers db here,
    //the index is upon the field of user_token;
    next();
  });
}

var set_app = function(){
  app.locals.dbs = cloudant_db.dbs;
  require('./routes/index')(app);
  require('./routes/items')(app);
}

function initializeDatabase(callback) {

  if (process.env.VCAP_SERVICES) {
    var vcapServices = JSON.parse(process.env.VCAP_SERVICES);

    if (vcapServices.cloudantNoSQLDB) {

      var credentials = vcapServices.cloudantNoSQLDB[0].credentials;

      cloudant_db.host = credentials.host;
      cloudant_db.port = credentials.port;
      cloudant_db.user = credentials.username;
      cloudant_db.password = credentials.password;
      cloudant_db.url = credentials.url;

      cloudant = require('cloudant')(cloudant_db.url);

      useDatabase(callback);
    } else {
      console.log("no cloudant service is binded");
    }
  } else {

    if (process.env.cloudant_hostname && process.env.cloudant_username && process.env.cloudant_password) {
      cloudant_db.host = process.env.cloudant_hostname;
      cloudant_db.user = process.env.cloudant_username;
      cloudant_db.password = process.env.cloudant_password;

      cloudant = require('cloudant')({
        hostname: cloudant_db.host,
        account: cloudant_db.user,
        password: cloudant_db.password
      });

      useDatabase(callback);
    }
  }
}

initializeDatabase(set_app);

// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
 var err = new Error('Not Found');
 err.status = 404;
 next(err);
 });

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
*/
