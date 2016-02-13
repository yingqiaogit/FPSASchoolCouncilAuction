/**
 * Created by a on 9/30/2015.
 */

module.exports=function(app){

   app.get('/', function(req,res){

       var username = (req.session && req.session.screen_name)? req.session.screen_name:null;

       res.render('app/index_original.html', {username: username});

   });

   app.get('/giftregistry', function(req,res) {

       var username = (req.session && req.session.screen_name) ? req.session.screen_name : null;

       res.render('app/giftregistry_original.html', {username: username});

   });

    app.get('/silentauction', function(req,res) {

        var username = (req.session && req.session.screen_name) ? req.session.screen_name : null;

        res.render('app/silentauction_original.html', {username: username});

    });


};

