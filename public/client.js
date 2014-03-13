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
    html = '',
    dataObject,
    active,
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
 *
 * UI Functions
 *
 * *******************/
// UI Create Query Input
function showLogin() {
    var login = $("<div />", { id: 'login', text: 'Login to Administration'}),
        form = $("<form />", { action: '', method: 'POST' }),
        frmusername = $("<input />", { id: 'username', name: 'username', placeholder: 'Username', type: 'text' }),
        frmpassword = $("<input />", { id: 'password', name: 'password', placeholder: '****', type: 'password' }),
        frmbutton = $("<div />", { id: "submitLogin", text: "Log In" });
    login.append(form, frmusername, frmpassword, $('<br />'), frmbutton);
    $(container).before(login);
    $("#login").dialog({
        autoOpen: true,
        open: function(event, ui) {
            $(this).parent().css('position', 'fixed');
        }
    }).on( 'keypress', function(e) {
        if( e.which == 13 ) {
            $("#submitLogin").trigger( 'click' );
        }
    });;
    $("#submitLogin").button().on( 'click', function(e) {
        e.preventDefault();

        username = $("#username").val();
        var password = $("#password").val();

        authenticate( username, password );
        socket.emit( "admin" , { method: 'register' });
    });
}

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
    $('#'+ active +' .dataHead tr').replaceWith(head);
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
    $('#' + active + ' .dataBody').empty();
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

/**********************
 *
 * Socket Listeners
 *
 * ********************/


// Catch register
socket.on( 'register', function( data ) {
    // If registration is successful
    // save authentication information
    // in auth variable
    if( data.reply && data.key != null ) {
        $("#login").remove();
        generateInput();
        // Auth variable is global and stores the user
        // and the key associated with that user
        auth = { user: data.user, key: data.key };
    }
});
// TODO: Catch session updates
socket.on( 'sessions', function( data ) {
    // Interact
    var tabs = $( "<div />", { id: "tabs", class: "tabs-bottom" }),
        list = $( "<ul />" );

    var rooms = [];
    $.each( data.rooms, function( key, value ) {
        if(key != '' ) {
            key = key.replace(/\//g,'');
            list.append( $( "<li />" ).append( $("<a />" , { href: "#" + key + "-tab" }).html( key ) ) );
            rooms.push(key+'-tab');
        }
    });
    active = rooms[0]; 
    tabs.append( list );
    $(container).append( tabs );
    $.each( rooms, function( key, value ) {
        value = value.replace(/\//g,'');
        $("#tabs").append( $('<div/>', { id: value }) );
        $($("#container > .data")).clone().appendTo($("#"+value));
    });
    // Move tabs
    $( "#tabs" ).tabs();
    $( ".tabs-bottom .ui-tabs-nav, .tabs-bottom .ui-tabs-nav > *").removeClass( "ui-corner-all ui-corner-top" ).addClass( "ui-corner-bottom" );
    $( ".tabs-bottom -ui-tabs-nav" ).appendTo( ".tabs-bottom" );
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

showLogin();
