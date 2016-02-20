/**
 * Created by a on 9/30/2015.
 */

module.exports=function(app){

   app.get('/', function(req,res){

       var screenName = (req.session && req.session.screen_name)? req.session.screen_name:null;

       console.log("screenName is " + screenName);

       res.render('app/index.html', {screen_name: screenName});
   });

   app.get('/home/:page', function(req,res) {

       var screenName = (req.session && req.session.screen_name) ? req.session.screen_name : null;

       var page = req.params.page;

       if (page == 'giftregistry') {
           console.log("retrieve the gift page");
           res.render('app/giftregistry.html', {screen_name: screenName});
       }
       if (page == 'silentauction') {
           console.log("retrieve the auction page");
           res.render('app/silentauction.html', {screen_name: screenName});
       }

   });

};

