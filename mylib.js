/**
 * Created by a on 11/10/2015.
 * The item with bids is as
 * id:
 * initAt:
 * bids:
 */

var bidComparator=function(aBid, bBid){
    return aBid.price-bBid.price;
};

var writeBidToTable= function(itemDB, bid, key){

    console.log("bid item as " + JSON.stringify(bid) + "with key as " + key);

    /*push the bid into bids
    *     bid:
    *       {
    *          price:
    *          time:
    *       }
    */

    itemDB.get(key, {revs_info:true}, function(err,body){
        if (!err){
            if (!body.bids)
                body.bids=[];

            body.bids.push(bid);

            //current price is the lowest price at top #quantity
            body.bids.sort(bidComparator);

            if (!body.doc.quantity||body.doc.quantity == 1)
                body.doc.currentprice = body.bids[body.bids.length-1].price;
            else
                if (body.bids.length >= body.doc.quantity){
                    body.doc.currentprice = body.bids[body.bids.length-body.doc.quantity].price;
                }

            //store the document back to the server

            //return the found list of the doc
            console.log('body as' + JSON.stringify(body));

            itemDB.insert(body, function(err,body){
                if(!err)
                    console.log('bid success')
                else
                    console.log('bid error')
            });

        }else {
            console.log('bid error')
        }
    } );
};

module.exports.writebid = writeBidToTable;