NodeJS MySql Console Interface
====================

Interact with your database with single queries.
Reply's are returned to a auto-generated Datatable. (CDN)
Queries are 'formatted' by CodeMirror (CDN)

__Features__
* Each user gets a tab
* When a new user logs in, a new tab is created
* When a user leaves the system, their tab is destroyed
* Each tab is a shared session
    * Sessions will update across all clients
    * Session data is retrieved when tab is clicked

##### Dependencies
__CDN__
 - DataTables
 - DataTables - Table Tools
 - CodeMirror

# Installation

- run sudo npm install to install node\_modules
- copy config.js.example to config.json for both public and private directories
- modify config.js's to reflect your server and ports

# Configuration

#### private/config.json
    {
    "port": "3702",                     // Default port 3702
    "hostname": "localhost",            // Loopback
    "host": "database.hostname.com",    // Database location (aws endpoints should work)
    "user": "user",                     // Database user
    "password": "password",             // Database password
    "database": "schema"                // Database schema
    }
    
#### public/config.js
    var port = 3702;                        // Must match private/config.json
    var hostname = "www.hostname.com";       // Externally accessable URL

# Use

### CLI
    node server.js

### Browser
Point your browser to www.hostname.com:3702/
Use any username and the password stored in private/config.json
