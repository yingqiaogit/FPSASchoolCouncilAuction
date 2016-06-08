/**
 * Created by a on 10/29/2015.
 */

var isBidding=function(){

    //if the time is passed May,24th, 6:00pm EST,
    //
    return new Date().getTime() > new Date(2016, 5, 8, 22, 0,0,0).getTime() ? false:true;
};

module.exports=function(app){

    var async = require('async');
    var extend = require('extend');

    var item_db = app.locals.dbs.items.handler;


    var store_item = function(doc, next,req, res){

        //store the doc in the queries db
        //the primary key is the id autogenerated
        if (doc.doc.id)
        {
            //this is an update request
            var key = doc.doc.id;
            item_db.get(key, {revs_info:true}, function(err,body){
               if (!err){

                   doc.doc.status = body.doc.status;
                   body.doc= doc.doc;

                   delete body.doc.id;

                   item_db.insert(body, function(err,body){
                       if(!err)
                           next(req,res);
                       else
                           res.status(404).send({status: err});
                   });
                  }
            });
        }else {
            item_db.insert(doc, null, function (err, body) {
                if (!err)
                    console.log('stored correctly with information as ' + body);
                else
                    console.log(err);

                next(req, res);
            });
        }
    };

    var retrieve_items = function(req,res){

        //the admin can see all of the items
        //other users can see approved item only
        var titles=[];

        var isAdmin = req.session && req.session.isAdmin ? true:false;
        var statusAllowed = isAdmin?['Require Approval','Approved']:['Approved'];

        item_db.list({include_docs:true},function(err,body){
            if (!err){

                //should contain _id with the title
                body.rows.forEach(function(row){
                    var item = row.doc.doc

                    if (statusAllowed.indexOf(item.status)>=0)
                    {
                        var element = {};
                        element.title = item.title;
                        element.id = row.key;
                        element.primary_url = item.primary_url;
                        element.description = item.description;
                        element.quantity = item.quantity;

                        if (req.session && req.session.isAdmin)
                            element.status = item.status;

                        element.facevalue = item.facevalue;
                        element.currentprice = item.currentprice;
                        //if not admin, send price and time only
                        console.log('element as ' + JSON.stringify(element));
                        titles.push(element);
                    }
                });
                res.json({isAdmin: isAdmin,isBidding: isBidding(), titles:titles});
            }
            else
                res.status(500).send({status:'error'});

        });
    }

    //retrieve all of the titles from the doc
    app.get('/items/list',function(req,res){

       //returns the _id and titles
       retrieve_items(req,res);
    });

    //retrieve all of the sponsors from the doc
    app.get('/items/sponsors', function(req,res){

        var statusAllowed = ['Approved'];
        var sponsors=[];

        /*
         * sponsor:{
         *        name:
         *    logo_url:
         * website_url:
         * }
         */

        item_db.list({include_docs:true},function(err,body){
            if (!err){

                //should contain _id with the title
                body.rows.forEach(function(row){
                    var item = row.doc.doc

                    if (statusAllowed.indexOf(item.status)>=0)
                    {
                        if (item.sponsor && Object.keys(item.sponsor).length
                            && item.sponsor.name && item.sponsor.website_url && item.sponsor.logo_url)
                           sponsors.push(item.sponsor);
                    }
                });
                console.log("sponsors " + JSON.stringify(sponsors));

                res.json({sponsors:sponsors});
            }
            else
                res.status(500).send({status:'error'});

        });
    });

    //retrieve the doc with the _id
    //body
    //{ _id: doc_id}
    app.get('/items/found', function(req,res){

        var doc_id = req.query.id;

        console.log("received id " + doc_id);

        var isAdmin = req.session && req.session.isAdmin ? true:false;

        item_db.get(doc_id, {revs_info:true}, function(err,body){
            if (!err){
                //return the found list of the doc

                var selected = {};
                selected = extend(body.doc,{id: body._id});
                if (!selected.quantity)
                    selected.quantity = 1;

                if (body.bids) {
                    var bids = [];
                    body.bids.forEach(function (current) {
                        var bid= {
                            price: current.price,
                            time: current.formatedtime
                        }
                        if (isAdmin){
                            bid.name = current.name;
                            bid.email = current.email;
                            bid.phone = current.phone;
                        }
                        bids.push(bid);
                    });
                    selected.bids= bids;
                }
                console.log("selected " + JSON.stringify(selected));
                res.json({isAdmin: isAdmin, isBidding: isBidding(), selected: selected});
            }else {
                res.status(404).send({status: err});
            }

        } );
    });

    app.post('/items/approve', function(req,res){
        //bid information is contained in the request body
        var approval_doc = JSON.parse(Object.keys(req.body)[0]);
        //retrieve the item from the db
        console.log("approve item as " + JSON.stringify(approval_doc));
        var key = approval_doc.id;
        var status = approval_doc.status;

        //update the status of the item
        item_db.get(key, {revs_info:true}, function(err,body){
            if (!err){
                //return the found list of the doc
                console.log('body as' + JSON.stringify(body));

                body.doc.status = status;
                //store the document back to the server

                item_db.insert(body, function(err,body){
                    if(!err)
                        retrieve_items(req,res);
                    else
                        res.status(404).send({status: err});
                });

            }else {
                res.status(404).send({status: err});
            }
        } );

    });

    var bidComparator = function(aBid, bBid){
        return aBid.price-bBid.price;
    }

    app.post('/items/bid', function(req,res){
        //bid information is contained in the request body
        bid_doc = JSON.parse(Object.keys(req.body)[0]);
        //retrieve the item from the db
        console.log("bid item as " + JSON.stringify(bid_doc));
        var key = bid_doc.id;
        var bid = bid_doc.bid;

        bid.recordedat=new Date().getTime();

        bid.formatedtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        //push the bid into bids
        item_db.get(key, {revs_info:true}, function(err,body){
            if (!err){
                //return the found list of the doc
                console.log('body as' + JSON.stringify(body));

                if (!body.bids)
                    body.bids=[];

                body.bids.push(bid);

                //store the document back to the server

                item_db.insert(body, function(err,body){
                  if(!err)
                      res.status(200).send({status:"ok"});
                  else
                      res.status(404).send({status: err});
                });

            }else {
                res.status(404).send({status: err});
            }
        } );

    });

    //add a new item
    app.post('/items/submit', function(req, res){

        var item_doc = {};

        item_doc.doc = JSON.parse(Object.keys(req.body)[0]);

        //store the query in the queries db
        // for one query, currently, there is one document including
        // original query,
        // the recommendations retrieved by concept insights from concept insights
        // the concepts of the query,
        // and the relationship extracted from the query
        item_doc.recordedat = new Date().getTime();
        item_doc.formatedtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        console.log("new item as " + JSON.stringify(item_doc));
        store_item(item_doc, retrieve_items, req, res);
    });

    //delete an item
    app.delete('/items/:id', function(req, res) {


        var key = req.params.id;

        //store the query in the queries db
        // for one query, currently, there is one document including
        // original query,
        // the recommendations retrieved by concept insights from concept insights
        // the concepts of the query,
        // and the relationship extracted from the query
        //db delete

        console.log('key is ' + key);

        item_db.get(key, {revs_info: true}, function (err, body) {
            if (!err) {
                console.log("delete body: " + JSON.stringify(body));

                item_db.destroy(key, body._rev, function (err, body) {
                    if (!err)
                        retrieve_items(req, res);
                    else
                        res.status(404).send({status: err});
                });
            } else
                res.status(404).send({status: err});

        });
    });
}