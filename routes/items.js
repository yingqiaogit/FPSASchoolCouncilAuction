/**
 * Created by a on 10/29/2015.
 */

module.exports=function(app){

    var async = require('async');
    var extend = require('extend');

    var item_db = app.locals.dbs.items.handler;


    var store_new_item = function(doc, next,res){

        //store the doc in the queries db
        //the primary key is the id autogenerated

        item_db.insert(doc,null,function(err,body){
            if (!err)
                console.log('stored correctly with information as ' + body);
            else
                console.log(err);
            next(res);
        });
    };

    var retrieve_items = function(res){

        var titles=[];

        item_db.list({include_docs:true},function(err,body){
            if (!err){

                //should contain _id with the title
                body.rows.forEach(function(row){
                    var item = row.doc.doc
                    console.log('doc as ' + JSON.stringify(item));
                    var element = {};
                    element.title = item.title;
                    element.id = row.key;
                    element.primary_url = item.primary_url;
                    titles.push(element);
                });
                res.json({titles:titles});
            }
            else
                res.status(500).send({status:'error'});
        });
    }

    //retrieve all of the titles from the doc
    app.get('/items/list',function(req,res){

       //returns the _id and titles
       retrieve_items(res);
    });

    //retrieve the doc with the _id
    //body
    //{ _id: doc_id}
    app.get('/items/found', function(req,res){

        var doc_id = req.query.id;

        console.log("received id " + doc_id);

        item_db.get(doc_id, {revs_info:true}, function(err,body){
            if (!err){
                //return the found list of the doc

                var selected = {};
                selected = extend(body.doc,{id: body._id});
                if (!body.doc.currentprice)
                    body.doc.currentprice = Number(body.doc.initialprice);
                if (body.bids) {
                    var bids = [];
                    body.bids.forEach(function (current) {
                        var bid = {
                            price: current.price,
                            time: current.formatedtime
                        }
                        bids.push(bid);
                    });
                    selected.bids= bids;
                }
                console.log("selected " + JSON.stringify(selected));
                res.json({selected: selected});
            }else {
                res.status(404).send({status: err});
            }

        } );
    });

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
                body.doc.currentprice = bid.price;
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

    app.post('/items/submit', function(req, res){

        var item_doc = {};

        item_doc.doc = JSON.parse(Object.keys(req.body)[0]);

        item_doc.doc.currentprice = item_doc.doc.initialprice;

        console.log(JSON.stringify(item_doc));

        //store the query in the queries db
        // for one query, currently, there is one document including
        // original query,
        // the recommendations retrieved by concept insights from concept insights
        // the concepts of the query,
        // and the relationship extracted from the query
        item_doc.recordedat=new Date().getTime();

        item_doc.formatedtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        store_new_item(item_doc, retrieve_items, res);

    });
}