/**
 * Created by a on 11/10/2015.
 * The item with bids is as
 * id:
 * initAt:
 * bids:
 */

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

            body.doc.currentprice = bid.price;
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