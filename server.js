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

// Require FS module to check for configuration files
var fs = require( "fs" );

// Require Math
var MATH = require('mathjs');

// Require crypto
// var crypto = require('crypto');

// Require Mysql Module
var mysql = require("mysql");

var express = require( "express" );

// Check configuration files here

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
// /Insert custom mysql connection information here
var dbConfig = {
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
}


var db;
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

    // Function
    function registerSocket( user ) {
        var key = Math.random().toString(36).substring(7);
        userList[user] = { key: key };
        socket.emit( 'register', { reply: true, user: user, key: key } );
        socket.room = user;
        socket.join( user );
    }


	/***************************
	*
	* Logged in socket listeners
	*
	****************************/
    socket.on( 'query', function( data ) {
        console.log( "Query" );
        console.log( data );
        var activeSocket = data.session;
        var auth = data.auth;
        data = data.query;
        data = data.replace(/;/g,'');
        var queryC = data.toLowerCase();
        var pass = true;
        
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
        //if( userList[auth.user].key != auth.key ) {
        //    pass = false;
        //}

        if(pass) {        
            db.query( data, function( err, reply ) {
                if(err) {
                    console.log("ERR:" + err);
                    socket.emit('reply', { 0: { reply: 'Failed Query -- Error :' + err} });
                }
                if(reply) {
                    console.log( "Sending data to socket :" + activeSocket );
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
