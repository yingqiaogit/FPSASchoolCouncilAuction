/**
 * Created by a on 1/4/2016.
 */
/* This is the module for handling the messages during biding
 */

module.exports= function(app){

    io = app.locals.io;

    //setting up the handler

    io.on('connection', function(socket){
        socket.emit('welcome',{hello: 'world'} );
        socket.on('biding', function(data){
            console.log(data);
        });

    });




};
