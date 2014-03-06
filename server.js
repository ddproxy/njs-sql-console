/*******************************
*
* Auth.js
*
*	Authenticate users information is correct and save to array uspaCache,
*	 counts how many times each user loads a new page and the most recent
*	 timestamp.
*
*	Broadcast new information to admin.js admin.php to display activity
*	 and most recent timestamp. On each page call, cast data as update
*	 and append to table with new data.
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

/*******************
* 
* MySQL connection
*
*******************/

var db = mysql.createConnection({
	host: config.host,
	user: config.user,
	password: config.password,
	database: config.database
});

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
*
*******************/
var badQueries = new Array(),
    ignoreLimit = new Array();
    badQueries.push('insert','delete','update','replace','drop','alter','create','grant');
    ignoreLimit.push('explain','show');
console.log( "Now Ready" );

/*************************
*
* Listening to sockets
*
**************************/

io.sockets.on( 'connection', function( socket ) {
	socket.on( 'register', function( data ) {
	
	});

	/***************************
	*
	* Administrator functions
	*
	****************************/
    function processRow( row ) {
        socket.emit( 'row', row );
    }
    socket.on( 'query', function( data ) {
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

        if(pass) {        
            db.query( data, function( err, reply ) {
                if(err) {
                    console.log("ERR:" + err);
                    socket.emit('reply', { 0: { reply: 'Failed Query -- Error :' + err} });
                }
                if(reply) {
                    socket.emit('reply', reply );
                }
            });
        } else {
            socket.emit('reply', { 0: { reply: 'Failed Query -- Illegal Syntax' } });
        }
    });

});
