/*************************
 *
 * CustomEvent shim
 *
 * ***********************/

(function () {
      function CustomEvent ( event, params ) {
              params = params || { bubbles: false, cancelable: false, detail: undefined };
                  var evt = document.createEvent( 'CustomEvent' );
                      evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
                          return evt;
                             };

        CustomEvent.prototype = window.Event.prototype;

          window.CustomEvent = CustomEvent;
})();

/*************************
 *
 * Client.js
 *
 *  Start communication with socket.io and modify
 *      DOM on results
 *
 *************************/

var container = document.getElementById("container"),
    html = '',
    dataObject,
    active,
    rooms = [],
    session,
    auth,
    tabs;

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
        query: string,
        session: session
    }
    );
}
// Send chat to socket
function chat( string ) {
    socket.emit("chat", {
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

// Add tab
function addTab( room ) {
    var tabTemplate = "<li><a href='#{href}'>#{label}</a></li>",
        li = $( tabTemplate.replace( /#{href\}/g, "#" +room+"-tab").replace( /#\{label\}/g, room) );
    tabs.find( ".ui-tabs-nav" ).append ( li );
    tabs.append( $("<div />", { id: room + "-tab" }).append( $("#container > .data").clone() ) );
    tabs.tabs( "refresh" );
}
// Remove tab
function removeTab( room ) {
    tabs.find( "#"+room+"-tab" ).remove();
    $( "[aria-controls='"+room+"-tab']" ).remove();
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
        button = $('<div/>').append(
            $('<div/>', {id: 'button' }).append(
                $('<div/>', {id: 'query'}).append('Query'),
                $('<div/>', {id: 'panel'}).append(
                        $('<a/>', {
                            href:'#side-panel',
                            class: 'menu-link'
                        }).append('&#9776;')
                    ).button()
            )
        );
    $(container).after(input,button);
    // Start query listeners
    activateQuery();
    var panel = $('<div />', {
        id: 'side-panel',
        class: 'panel' }).append(
                $('<h3 />').append('Chat'),
                $('<div />', { id: 'chat', style: 'padding: 1em;' } ).append(
                    $('<div/>', { id: 'chat-content', style: 'font-size: 75%;' } ),
                    $('<textarea/>', {id: 'chat-box', style: 'width: 100%;' } ),
                    $('<div/>').append(
                            $('<div/>', { id: 'send-chat', style: 'width: 100%;'} ).append('Send').button().on(
                                'click', function() {
                                    var string = $("#chat-box").val();
                                    $("#chat-box").val('');
                                    chat(string);
                                })

                        )
                ),
                $('<h3 />').append('History').on('click', function() {
                    socket.emit('history', { auth: auth, data: true } );
                }),
                $('<div />').attr('id','history').append('Testing'),
                $('<h3 />').append('Settings'),
                $('<div />').attr('id','settings').append('Testing')
            );
    $(container).after(panel);
    var chatMirror = CodeMirror.fromTextArea(document.getElementById('chat-box'), {
        mime: 'text/plain',
        disableSpellCheck: false,
        textWrapping: true,
        indentWithTabs: true,
        smartIndent: true,
        extraKeys: {
            "Enter": function ( i ) {
                i.setValue('');
                // Trigger #send-chat click event
                $("#send-chat").trigger( 'click' );
            }
        }
    }).on( 'change',function( cm ) {
        // Update #chat-box to formed query
        $("#chat-box").val( cm.getValue() );
    });
    $("#chat-box").on( 'keypress', function(e,ui) {
        if( e.which == 13) {
            e.preventDefault()
            $("#send-chat").trigger( 'click' );
        }
    });

    $('#side-panel').accordion( {
        heightStyle: "content",
        collapsible: true
    } );
    $('#panel').bigSlide( {
        menu: '#side-panel',
        side: 'right'
    });
}
// UI Render Table
function renderTable( data ) {
    var tables = $.fn.dataTable.fnTables(true);
    $(tables).each(function () {
        $(this).dataTable().fnClearTable(); 
        $(this).dataTable().fnDestroy();
    });
   
    // TODO: Tag updated tabs
    if(typeof columns !== 'undefined' ) columns = [];
    if(typeof aaData !== 'undefined' ) aaData = [];
    if(typeof aoColumns !== 'undefined' ) aoData = [];
   
    // Use Jquery to create elements
    var head = [],
        columns = [],
        tmp = data[0],
        aoColumns = [],
        table = $("#" + active + " .data");
    // Generate the header row
    $.each(tmp, function( key, value) {
        columns.push( key );
        head.push($('<th/>').append(key));
    });

    head = $('<tr/>').append( head );
    $('#'+ active + ' table.data thead.dataHead').empty();
    $('#'+ active + ' table.data thead.dataHead').append( head );
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
        
        // Auth variable is global and stores the user
        // and the key associated with that user
        auth = { user: data.user, key: data.key };
        // Now auth is set, gen the page
        generateInput();
    }
});
// Catch chat messages
socket.on( 'chat', function( data ) {
    msg = data.data;
    msg = msg.replace( auth.user, '<span style="color: rgb(126, 201, 230);">' + auth.user + '</span>');
    $('#chat-content').append( $('<p/>').html( msg ) );
    $('#chat-content').scrollTop($("#chat-content")[0].scrollHeight);
} );
// Catch history update
socket.on( 'history', function( data ) {
    console.log( data );
    $("#history").html('');
    $.each( data.data , function( key, value ) {
        $('#history').append( $('<p/>').html(value) );
    });
});
// TODO: Catch session updates
socket.on( 'sessionUpdate', function( data ) {
    if( data.action == 'add' && rooms.indexOf(data.room + "-tab") == -1 ) {
        addTab( data.room );
    } else if( data.action == 'remove' && data.room != auth.user + "-tab" ) {
        rooms.slice(rooms.indexOf(data.room + "-tab"),1);
        removeTab( data.room );
    }
});

socket.on( 'sessions', function( data ) {
    // Interact
    tabs = $( "<div />", { id: "tabs", class: "tabs-bottom" });
    var list = $( "<ul />" );
    $.each( data.rooms, function( key, value ) {
        if(key != '' ) {
            key = key.replace(/\//g,'');
            list.append( $( "<li />" ).append( $("<a />" , { href: "#" + key + "-tab" }).html( key ) ) );
            rooms.push(key+'-tab');
        }
    });
    // Set default active room
    active = auth.user + '-tab'; 
    session = active.replace(/\-tab/g,'');
    tabs.append( list );
    $(container).append( tabs );
    $.each( rooms, function( key, value ) {
        value = value.replace(/\//g,'');
        $("#tabs").append( $('<div/>', { id: value }) );
        $($("#container > .data")).clone().appendTo($("#"+value));
    });
    aind = $( "#" + active ).index('li');
    // Move tabs
    $( "#tabs" ).tabs({
        activate: function( e, ui) {
            $("#"+active+" > .data").replaceWith( $($("#container > .data")).clone() );
            active = ui.newTab.find('a').attr('href').replace(/#/g,'');
            session = active.replace(/\-tab/g,'');
            $("#"+active+" > .data").replaceWith( $($("#container > .data")).clone() );
            socket.emit('retrieve', { auth: auth, data: session } );
        },
        active: aind 
    });
    $( ".tabs-bottom .ui-tabs-nav, .tabs-bottom .ui-tabs-nav > *").removeClass( "ui-corner-all ui-corner-top" ).addClass( "ui-corner-bottom" );
    $( ".tabs-bottom -ui-tabs-nav" ).appendTo( ".tabs-bottom" );
});
// Catch rules
socket.on( 'rules', function( data ) {
    // Display rules
    var rules = $('<p/>');
    $.each(data, function( key, value) {
        rules.append($('<h4/>').append(key));
        $.each(value, function( key, value) {
            rules.append($('<p/>').append(value));
        });
    });
    $('#settings').html(rules);
});
// Catch query reply
socket.on('reply', function( data ) {
    renderTable( data );    
});

showLogin();
