/**
 * Created by a on 6/21/2015.
 */

module.exports= function(app) {

    //JSON structure of the documents in twitterusers signindb
    /*
    {
        user_id: 1123213    //twitter user_id as the primary key
        screen_name: votesavvyrhok  //the screen_name of the user
        user_tokem: uuid    // the user identifier in votesavvyrhok
    }
    */
    //the key of votesavvyrhok app under twitter account votesavvyrhok
    //in twitter application management

    var myConfig = {
        "consumerKey": app.locals.twitterConfig.consumer_key,
        "consumerSecret": app.locals.twitterConfig.consumer_secret,
        "accessToken": app.locals.twitterConfig.access_token_key,
        "accessTokenSecret": app.locals.twitterConfig.access_token_secret,
        "callBackUrl": app.locals.url + "/signintwitters/step2"
    };

    //stores the temporarily information of a user during the signing in procedure
    //for each sign in user, it stores the request token secret and generates a client token
    //the client token is a random number
    var oauthStore = {};

    var twitterLibrary = require('twitter-js-client');

    var twitterHdl = new twitterLibrary.Twitter(myConfig);

    app.get('/signintwitters/step1', function (req, res) {

        var signinUrl = 'https://api.twitter.com/oauth/authenticate?oauth_token=';

        console.log("you are at step 1 now");

        var usertoken={};

        //retrieve the oauth request token
        twitterHdl.getOAuthRequestToken(function (oauth) {
            if (oauth != null) {
                console.log(oauth);

                //store the user tokens in the oauthStore temporarily
                usertoken.token_secret = oauth.token_secret;
                oauthStore[oauth.token] = usertoken;

                //redirect to the Twitter sign in URL
                signinUrl = signinUrl + oauth.token;
                console.log('sign in url: ' + signinUrl);
                console.log('oauthStore: ' + JSON.stringify(oauthStore));
                res.redirect(signinUrl);
            }
            else {
                console.log("error on retrieving request token");
                res.status(500).send("error on retrieving request token");

            }
        });
    });

    app.get('/signintwitters/user/:username', function (req, res) {

            var username = req.params.username;

            var user = twitterHdl.getUser({screen_name: username}, function (error) {
                res.status(500).send("error on retrieving user:" + username);
            }, function (body) {
                console.log(body);
                res.send(body);

            });
        }
    )

    var getOAuthAccessToken = function (oauth, next) {
        twitterHdl.oauth.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
            function (error, oauth_access_token, oauth_access_token_secret, results) {
                if (error) {
                    console.log('ERROR: ' + error);
                    next();
                } else {
                    oauth.access_token = oauth_access_token;
                    oauth.access_token_secret = oauth_access_token_secret;

                    console.log('oauth.token: ' + oauth.token);
                    console.log('oauth.token_secret: ' + oauth.token_secret);
                    console.log('oauth.access_token: ' + oauth.access_token);
                    console.log('oauth.access_token_secret: ' + oauth.access_token_secret);
                    next(oauth,results);
                }
            }
        );
    };

    app.get('/signintwitters/step2', function (req, res) {
        var oauth_token = req.query.oauth_token;

        var oauth_verifier = req.query.oauth_verifier;

        var denied = req.query.denied;

        //the authentication is denied
        if (denied)
        {
            res.redirect('/');
            return;
        }

        console.log("you are at step 2 now");

        console.log("oauthStore: " + JSON.stringify(oauthStore));

        var oauthStep2 = {
            "token": oauth_token,
            "token_secret": oauthStore[oauth_token].token_secret,
            "verifier": oauth_verifier
        }

        console.log("oauthStep2: " + JSON.stringify(oauthStep2));

        getOAuthAccessToken(oauthStep2, function (oauth, results) {
            if (oauth == null) {
                console.log("error on retrieving access token");
                res.status(500).send("error on retrieving request token");
            }
            else {

                //add session management here:
                //currently the session id is the user's user_token
                //session id and user token will be separated eventually
                console.log(JSON.stringify(results));

                res.redirect("/signintwitters/step3?screen_name=" + results.screen_name);

            }
        });
    });

    app.get('/signintwitters/step3', function (req, res) {

        var screen_name = req.query.screen_name;
        console.log("the user " + screen_name + " is signed in");

        var sess = req.session;

        if (sess) {
            sess.screen_name = screen_name;
            if (app.locals.admin.indexOf(screen_name)>=0)
              sess.isAdmin = true;
        }
        else
            console.log("session is not defined");

        //if the user signning up just now
        console.log("user " + screen_name + " has logged in" );

        /*if (app.locals.admin && app.locals.admin.indexOf(screen_name) >=0 )
        {

            //add session management here:
            //currently the session id is the user's user_token
            //session id and user token will be separated eventually
            var sess = req.session;

            sess.screen_name =screen_name;

        }*/

        res.redirect('/');

    });

    app.get('/signintwitters/logout', function (req, res) {

        req.session.destroy(function(err){
            if(err){
                console.log(err);
            }
            else
            {
                res.redirect('/home/index');
            }
        });

    });

}