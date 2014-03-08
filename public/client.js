/*************************
 *
 * Client.js
 *
 *  Start communication with socket.io and modify
 *      DOM on results
 *
 *************************/

var container = document.getElementById("container");
var table = $("#data");
var dataObject;
var head = $("#dataHead");
var body = $("#dataBody");
var html = '';
var columns = Array();

var socket = io.connect( 'http://' + hostname + ':' + port );
// TODO: Submit authentication details

// TODO: Catch register event

// TODO: Catch optional sessions

// REVIEW: Should probably move query() somewhere else
function query( string ) {
    socket.emit("query", string);
}

// TODO: Catch session updates
socket.on( 'sessions', function( data ) {
    // Interact
    console.log( data );
});
socket.on( 'rules', function( data ) {
    // Display rules
    console.log( data );
});

socket.on('reply', function( data ) {
    // TODO: Distinguish between subscribed sessions
    if(dataObject != null)dataObject.fnDestroy();
    if(typeof columns !== 'undefined' ) columns = [];
    if(typeof aaData !== 'undefined' ) aaData = [];
    if(typeof aoColumns !== 'undefined' ) aoData = [];
    
    // FIXME: Use Jquery to create elements
    var AppendToHead = '<tr>';
    var tmp = data[0];
    $.each(tmp, function( key, value) {
        AppendToHead += "<th>" + key +"</th>";
        // TODO: Add to new array for autocomplete
        columns.push(key);
    });
    AppendToHead += '</tr>';
    var aoColumns = new Array();
    $.each(columns, function(i,v) {
        aoColumns.push({'sTitle': v});
    });
    // FIXME: Should make this more elegant
    head.empty();
    head.append(AppendToHead);
    var aaData = Array();
    $.each(data, function(i,v) {
        var tmp = new Array();
        $.each(v, function(i,v) {
            tmp.push( v );
        });
        aaData.push(tmp);
    });
    // FIXME: Should make this more elegant too
    body.empty();
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
});
/**********************
 *
 * CodeMirror construction
 *
 *********************/

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
