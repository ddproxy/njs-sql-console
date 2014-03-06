node-MySql-Interface
====================

Interact with your database with raw queries.
#Installation

- run sudo npm install to install node\_modules
- copy config.js.example to config.json for both public and private directories
- modify config.js's to reflect your server and ports

#Configuration

private/config.json
    {
	    "port": "3702",                     // Default port 3702
	    "hostname": "localhost",            // Loopback
	    "host": "database.hostname.com",    // Database location (aws endpoints should work)
    	"user": "user",                     // Database user
    	"password": "password",             // Database password
    	"database": "schema"                // Database schema
    }
public/config.js
    var port = 3702;                        // Must match private/config.json
    var hostname = "www.hostname.com";       // Externally accessable URL

#Use

###CLI
    node server.js

Point your browser to www.hostname.com:3702/

