/**
 * Created by a on 1/4/2016.
 */
/* This is the module for handling the messages during biding
 * Two membership: room and bidding queue
 * The membership of room is managed by the socket library itself and the rooms variable
 * The membership of queue is managed with the room.queue
 * rooms=[
 * {
 *    roomID: {
 *      queue:
  *     lastbid:
  *         {
  *           price:
  *           time:
 *      }
 *  }
 */
//two cases here: leaving with a bid, or leaving without a bid
var rooms={};

var clients ={};

var itemDB;

var mylib = require('../mylib.js');

var io;

var leaveQueue = function(client){

    var pos = isInQueue(client);

    var room = clients[client.id];

    if (pos >= 0) {
        rooms[room].queue.splice(pos, 1);
        return true;
    }

    return false;
};

var isInQueue = function(client){

    var pos = -1;

    if (clients[client.id])
    {
        var room = clients[client.id]

        if (rooms[room])
            pos = rooms[room].queue.indexOf(client.id);

    }

    return pos;
}

/*just leave room, the client is not in queue
 *in the case a client is in queue, he has to leave the queue first
 *client is the socket of the client
 */
var leaveRoom = function (client){

    //leave the room first
    var roomId = clients[client.id];

    delete clients[client.id];

    client.leave(roomId);

    //cleaning the room if the room is empty
    var curRoom = io.sockets.adapter.rooms[roomId];

    if (!curRoom) {
        console.log("the room is empty");
        delete rooms[roomId];
    }
};

var statusChangeNotification = function(room,status){

    rooms[room].status = status;
    io.sockets.in(room).emit('statusupdate',rooms[room]);
    console.log("status update as" + JSON.stringify(rooms[room]));
    rooms[room].status = "Init";
};

module.exports= function(app){

    io = app.locals.io;

    itemDB = app.locals.dbs.items.handler;

    //storing the statuses of rooms

    io.on('connection', function(clientSocket){

       clientSocket.on('joinroom', function(room){

            console.log("join in the room " + room);

            clientSocket.join(room);

            clients[clientSocket.id] = room;

            //open a room if there is no room
            if (!rooms[room]) {
                rooms[room] = {
                    queue: [],
                    status: "Init",
                    lastbid: {
                        price: null,
                        time: null
                    }
                };

                var lastbid = {};
                itemDB.get(room, {revs_info: true}, function (err, body) {
                    if (!err) {
                        if (!body.bids) {
                            lastbid.price = Number(body.doc.currentprice);
                            lastbid.formatedtime = body.doc.formatedtime;
                        } else {
                            lastbid= body.bids[body.bids.length-1];
                        }

                        rooms[room].lastbid.price = lastbid.price;
                        rooms[room].lastbid.time = lastbid.formatedtime;

                        // send a status update message to the newcommer
                        clientSocket.emit('statusupdate', rooms[room]);
                    }
                    else {
                        console.log("error in db");
                    }
                });
            } else
                clientSocket.emit('statusupdate', rooms[room]);
        });

        clientSocket.on('joinbid', function(room) {

            //get the waiting queue of the room
            rooms[room].queue.push(clientSocket.id);

            //update the status to the room
            statusChangeNotification(room,"BidMemberChange");

        });

        //default processing handler for disconnect
        clientSocket.on('disconnect', function() {

            console.log('disconnect from ' + clientSocket.id);

            var room = clients[clientSocket.id];

            //if the client is in bidding queue
            var statusUpdate = leaveQueue(clientSocket);

            leaveRoom(clientSocket);

            clientSocket.disconnect();

            if (statusUpdate && rooms[room]) {
                statusChangeNotification(room, "BidMemberChange");
            }
        });

        //for client leaving the room with message
        clientSocket.on('leaveroom', function(){

            console.log('disconnect from ' + clientSocket.id);

            leaveRoom(clientSocket);
        });

        //for client leaving the biding queue with message
        clientSocket.on('leavebid', function(bid){

            console.log('leave biding queue from ' + clientSocket.id + "with bid" + JSON.stringify(bid));

            var room = clients[clientSocket.id];

             var status = leaveQueue(clientSocket)?"BidMemberChange":rooms[room].status;
            //a client may leave with a bid
            if (bid)
                //store the biding information in the db then
            {
                /* The bid=
                 * {
                 *  id: the id of the item
                 *  price:  the price from the bidder
                 *  emailAddress: the email address of the bidder
                 */



                bid.recordedat=new Date().getTime();

                bid.formatedtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

                var key = bid.id;

                delete bid.id;

                console.log(" with bid " + JSON.stringify(bid));

                mylib.writebid(itemDB, bid, key);

                rooms[room].lastbid.price = bid.price;
                rooms[room].lastbid.time = bid.formatedtime;
                status="PriceChange";
            }
            statusChangeNotification(room, status);
        });
    });
};
