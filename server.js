/*******************************
*
* Server.js
*
*	Authenticate users and allow data transport between
*	    server and client.js
*
*	Pass MySql queries to database and return data.
*
********************************/

/*******************************
 *
 * Requirements
 *
 ********************************/
const fs = require("fs");

const MATH = require('mathjs');
const mysql = require("mysql");
const express = require("express");

fs.exists( "public/config.js", function( exists ) {
	if ( exists ) {
		// Report to console of success
		console.log( "Configuration files found for front-end" );
	} else {
		// Report
		console.err( "Configuration file not found for frontend, please read the README for proper configuration" );
		process.exit( 1 );
	}
});

fs.exists( "private/config.json", function( exists ) {
	if ( exists ) {
		// Report to console of success
		console.log( "Configuration files found for back-end" );
	} else {
		// Report
		console.err( "Configuration file not found for backend, please read the README for proper configuration" );
		process.exit( 1 );
	}
});

/*******************
* 
* Retrieving Configuration
*
*******************/

// Load configuration file
var config = require( "./private/config.json" );
var params = require( "./private/params.json" );

/*******************
* 
* MySQL connection
*
*******************/
const dbConfig = {
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
}

let db;
function handleDisconnect() {
    db = mysql.createConnection(dbConfig);

    // Custom error handler
    db.connect(function(err) {
        if(err) {
            console.log("Error when connecting to DB:", err);
            setTimeout(handleDisconnect, 2000);
        }
    });
    db.on( "error", function( err ) {
        console.log("Mysql Error:: " + err.code);
        if(err.code === "PROTOCOL_CONNECTION_LOST") {
            handleDisconnect();
        } else {
            console.log("Error MySql: ", err);
        }
    });

}

handleDisconnect();

/*******************
* 
* Express and Socket.io
*
*******************/


// Require Express and cast to app variable
//var express = require( "express" ); Added to require block
var app = express();

app.use( express.static( __dirname + '/public' ) );

console.log( "Express is returning public pages" );

// Require Socket.io
// config.port comes from config.json object
var io = require( 'socket.io' ).listen( app.listen( config.port ) );

// IO settings
io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1); // Reduce Logging

console.log( "SocketIO is listening to port::" + config.port );

/******************
*
* Cast usable variables
*   TODO: Drop restrictions into config or param JSON
*
*******************/

var badQueries = params.bad,
    ignoreLimit = params.noLimit,
    userList = [],
    roomList = [],
    history = [],
    socketData = [];
console.log( "Now Ready" );

/*************************
*
* Listening to sockets
*   TODO: Drop sockets into sharable sessions
*
**************************/

io.sockets.on( 'connection', function( socket ) {
    // TODO: Authenticate users
    socket.on( 'register', function( data ) {
        console.log( data );
        if( data.pass == config.password) {
            registerSocket( data.user );
            socket.emit( 'rules', { bad: badQueries, noLimit: ignoreLimit });
            var rooms = io.sockets.manager.rooms;
            socket.emit( 'sessions', { rooms: rooms });
            console.log( io.sockets.manager.rooms );
        } else {
            socket.emit( 'register', { reply: false } );
        }
	// TODO: Present optional sessions for sockets to join
	});
    socket.on( 'disconnect', function() {
        // Depreciateing in favor method
        // socket.broadcast.emit( 'sessionUpdate', { action: 'remove', room: socket.room } );
        sessionManagement( socket.room );
    });
    /***************************
     *
     * Function
     *
     * *************************/

    function sessionManagement( room ) {
        setTimeout(function() {
            checkRoom = "/"+room;
            var rooms = Object.keys(io.sockets.manager.rooms);
            console.log(rooms);
            if( rooms.indexOf(checkRoom) > -1 && roomList.indexOf(checkRoom) == -1 ) {
                socket.broadcast.emit( 'sessionUpdate', { action: 'add', room: room } );
                roomList.push(room);
            } else if( rooms.indexOf(checkRoom) == -1 && roomList.indexOf(checkRoom) > -1 ) {
                socket.broadcast.emit( 'sessionUpdate', { action: 'remove', room: room } );
                roomList.splice(roomList.indexOf(room),1);
            }
        }, 1000);
    }
    function registerSocket( user ) {
        var key = Math.random().toString(36).substring(7);
        userList[user] = { key: key };
        socket.emit( 'register', { reply: true, user: user, key: key } );
        socket.room = user;
        socket.join( user );
        sessionManagement( socket.room );
        // Depreciating in favor of method
        //socket.broadcast.emit( 'sessionUpdate', { action: 'add', room: socket.room } );
    }


	/***************************
	*
	* Logged in socket listeners
	*
	****************************/
    socket.on( 'chat', function( data ) {
        if( userList[data.auth.user] != null && userList[data.auth.user].key == data.auth.key ) {
            console.log( data );
            io.sockets.emit('chat', { data: data.auth.user + ": " + data.query } );
        }

    });
    socket.on( 'history', function( data ) {
        if( userList[data.auth.user] != null && userList[data.auth.user].key == data.auth.key ) {
            socket.emit( 'history', { data: history } );
        }
    });
    socket.on( 'query', function( data ) {
        history.push(data.query);
        console.log( "Query" );
        console.log( data );
        var activeSocket = data.session;
        var auth = data.auth;
        data = data.query;
        data = data.replace(/;/g,'');
        var queryC = data.toLowerCase();
        var pass = true;
        if( auth.key !== userList[auth.user].key ) {
            pass = false;
        }

        badQueries.forEach( function( call ) {
            if(queryC.indexOf( call ) != -1) {
                console.log("Caught Illegal call: " + data );
                pass = false;
            }
        });
        var limit = true;
        if(queryC.indexOf( 'limit' ) == -1) {
            ignoreLimit.forEach( function( call ) {
                if(queryC.indexOf( call ) != -1 ) {
                    limit = false;
                }
            });
            if( limit ) data += ' LIMIT 500;'; 
        }
       
        if(pass) {        
            db.query( data, function( err, reply ) {
                if(err) {
                    socket.emit('reply', { 0: { reply: 'Failed Query -- Error :' + err} });
                }
                if(reply) {
                    socketData[activeSocket] = reply;
                    io.sockets.in(activeSocket).emit('reply', reply );
                }
            });
        } else {
            socket.emit('reply', { 0: { reply: 'Failed Query -- Illegal Syntax' } });
        }
    });
    socket.on( 'retrieve', function( data ) {
        if( userList[data.auth.user] != null && userList[data.auth.user].key == data.auth.key ) {
            console.log( data );
            activeSocket = data.data;
            console.log( activeSocket);
            socket.leave(socket.room);
            socket.join(activeSocket);
            console.log( socketData[activeSocket] );
            if(socketData[activeSocket] != null ) socket.emit( 'reply', socketData[activeSocket] );
        }
    } );

});
