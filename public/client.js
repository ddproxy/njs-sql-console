/*************************
 *
 * Client.js
 *
 *  Start communication with socket.io and modify
 *      DOM on results
 *
 *************************/

var container = document.getElementById("container"),
    table = $("#data"),
    body = $("#dataBody"),
    html = '',
    dataObject,
    auth,
    columns = Array();

/**********************
 *
 * Socket Connection
 *
 * ********************/

var socket = io.connect( 'http://' + hostname + ':' + port );

/**********************
 *
 * CodeMirror construction
 *  Wrap CodeMirror and event listeners to function
 *      so it can be activated after the UI is built.
 *
 *********************/
function activateQuery() {
    var mime = 'text/x-mysql';
    var editor = CodeMirror.fromTextArea(document.getElementById('string'), {
        mode: mime,
        indentWithTabs: true,
        smartIndent: true,
        matchBrackets: true,
        extraKeys: {
            "Enter": function ( i ) {
                // Trigger #query click event
                $("#query").trigger( 'click' );
            }
        }
    }).on( 'change',function( cm ) {
        // Update #string to formed query
        $("#string").val( cm.getValue() );
    });

    /*********************
     *
     * Listeners
     *
     * *******************/

    // TODO: Look into combining these event listeners
    $("#query").button().on( 'click', function() {
        var string = $("#string").val();
        query(string);
    });
    $(document).keypress( function( e ) {
        if( e.which == 13 ) {
            e.preventDefault();
            $("#query").trigger( 'click' );
        }
    });
} // end function activateQuery

/**********************
 *
 * Functions
 *
 * ********************/

// Query the database via the socket
function query( string ) {
    socket.emit("query", {
        auth: auth,
        query: string
        }
    );
}

// Authenticate with the socket
function authenticate( user, pass ) {
    // Socket
    socket.emit( "register", {
        user: user,
        pass: pass
        }
    );
}

// Change socket room
function room( room ) {
    // Socket
    socket.emit( "room", {
        auth: auth,
        room: room
        }
    );
}
/*********************
 * UI Functions
 * *******************/
// UI Create Query Input
function generateInput() {
    // Use Jquery to create inputs
    var input = $('<textarea/>').attr('id','string'),
        button = $('<div/>').attr('id','query').append('Query');
    $(container).after(input,button);
    // Start query listeners
    activateQuery();
}
// UI Render Table
function renderTable( data ) {
    // TODO: Distinguish between subscribed sessions
    if(dataObject != null)dataObject.fnDestroy();
    if(typeof columns !== 'undefined' ) columns = [];
    if(typeof aaData !== 'undefined' ) aaData = [];
    if(typeof aoColumns !== 'undefined' ) aoData = [];
    
    // Use Jquery to create elements
    var head = [];
    var tmp = data[0];
    var aoColumns = [];
    // Generate the header row
    $.each(tmp, function( key, value) {
        head.push($('th').append(key));
        columns.push(key);
    });
    head = $('tr').append( head );
    $('#dataHead tr').replaceWith(head);
    // End generate header row
    // Generate column data for DataTables
    $.each(columns, function(i,v) {
        aoColumns.push({'sTitle': v});
    });
    // Generate data for DataTables
    var aaData = Array();
    $.each(data, function(i,v) {
        var tmp = new Array();
        $.each(v, function(i,v) {
            tmp.push( v );
        });
        aaData.push(tmp);
    });
    // End DataTables data generation
    // Wipe table for new data
    body.empty();
    // Initiate DataTable
    dataObject = table.dataTable( {
        "bProcess":true,
        "bDestroy":true,
        "aaData": aaData,
        "sDom": 'T<"H"Clfr>t<"F"ip>',
        "aoColumns": aoColumns,
        "sScrollX": "100%",
        "bLengthChange": true,
        "iDisplayLength": 25,
        "aLengthMenu": [[25, 50, 100, -1], [25, 50, 100, "All"]],
        "bJQueryUI": true,
        "oTableTools": {
            "aButtons": [
                "copy",
                {
                        "sExtends": "csv",
                        "sTitle": "export"
                },{
                        "sExtends": "xls",
                        "sTitle": "export"
                }
        ],
            "sSwfPath": "//cdnjs.cloudflare.com/ajax/libs/datatables-tabletools/2.1.5/swf/copy_csv_xls.swf"
        }
    });
}

// TODO: Submit authentication details

/**********************
 *
 * Socket Listeners
 *
 * ********************/


// TODO: Catch register event
socket.on( 'register', function( data ) {
    // If registration is successful
    // save authentication information
    // in auth variable
    if( data.reply && data.key != null ) {
        // Auth variable is global and stores the user
        // and the key associated with that user
        auth = { user: data.user, key: data.key };
    }
});
// TODO: Catch session updates
socket.on( 'sessions', function( data ) {
    // Interact
    console.log( data );
});
// Catch rules
socket.on( 'rules', function( data ) {
    // Display rules
    console.log( data );
});
// Catch query reply
socket.on('reply', function( data ) {
    renderTable( data );    
});

generateInput();
