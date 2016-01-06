/**
 * Created by a on 1/4/2016.
 */
/* This is the module for handling the messages during biding
 */

module.exports= function(app){

    io = app.locals.io;

    //storing the statuses of rooms
    var rooms={};

    var clients ={};

    var item_db = app.locals.dbs.items.handler;

    io.on('connection', function(socket){

        socket.on('biding', function(data){
            console.log(data);
        });

        socket.on('create', function(room) {
            //get the waiting queue of the room
            console.log("join in the room " + room);

            if (!rooms[room])
                rooms[room] = {
                    queue: [],
                    price: null
                };

            socket.join(room);

            clients[socket.id] = room;

            rooms[room].queue.push(socket.id);

            //retrieve the price from the db
            item_db.get(room, {revs_info: true}, function (err, body) {
                if (!err) {
                    if (!body.doc.currentprice)
                        body.doc.currentprice = Number(body.doc.initialprice);

                    rooms[room].price = body.doc.currentprice;
                    /* broadcast the status of the room to all of the clients in the room
                    */
                    io.sockets.in(room).emit('statusupdate',rooms[room]);
                    console.log("status update as" + JSON.stringify(rooms[room]));
                }
                else{
                    console.log("error in db");
                }
            });
        });

        //default processing handler for disconnect
        socket.on('disconnect', function() {

            var client = {};
            console.log('disconnect from ' + socket.id);

            if (clients[socket.id])
                client.room = clients[socket.id];
            else
                return;

            delete clients[socket.id];

            var room = client.room
            if (rooms[room]) {
                var i = rooms[room].queue.indexOf(socket.id);
                if (i >= 0)
                    rooms[room].queue.splice(i, 1);
            }

            socket.disconnect();

            if (!rooms[room].queue.length) {
                console.log("the room is empty");
                delete rooms[room];
            }
            else {
                if (client.price)
                    rooms[room].price = client.price;
                io.sockets.in(room).emit('statusupdate', rooms[room]);
                console.log("status update as" + JSON.stringify(rooms[room]));
            }
        });

        //for client leaving with message
        socket.on('leave', function(msg){

            var client={};
            console.log('disconnect from ' + socket.id + " with msg " + JSON.stringify(msg));

            if (msg)
            {
                client = msg;
            }else
            {
                if (clients[socket.id])
                    client.room = clients[socket.id];
                else
                    return;
            }

            delete clients[socket.id];

            var room = client.room
            var i = rooms[room].queue.indexOf(socket.id);
            rooms[room].queue.splice(i,1);

            socket.leave(room);

            if (!rooms[room].queue.length) {
                console.log("the room is empty");
                delete rooms[room];
            }
            else
            {
                if (client.price)
                    rooms[room].price = client.price;

                io.sockets.in(room).emit('statusupdate',rooms[room]);
                console.log("status update as" + JSON.stringify(rooms[room]));
            }
        });

    });
};
