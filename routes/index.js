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
           var tx = req.query.tx? req.query.tx:null;

           var note = 'Welcome!'

           if (tx)
               if (tx == 'success')
                   note =  "Your gift has been received. We appreciate.";
               else if (tx== "cancel")
                   note = "Your transaction has been cancelled."
               else
                   note = "Your transaction has failed."

           res.render('app/giftregistry.html', {note: note,
               screen_name: screenName });

       }

       if (page == 'silentauction') {
           console.log("retrieve the auction page");
           res.render('app/silentauction.html', {screen_name: screenName});
       }

       /*
       if (page == 'index') {
           console.log("retrieve the auction page");
           res.render('app/index_original.html', {screen_name: screenName});
       }
       */
   });

};

