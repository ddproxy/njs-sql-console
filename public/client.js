
window.onload = function() {
	
    var container = document.getElementById("container");
    var table = $("#data");
    var dataObject;
    var head = $("#dataHead");
    var body = $("#dataBody");
    var html = '';
    var columns = Array();

	function renderStat(element, index, array) {
	  html += "<br />[" + index + "] is " + element ;
	}
	
	var socket = io.connect( 'http://' + hostname + ':' + port );

    function query( string ) {
        socket.emit("query", string);
    }
    
    socket.on('reply', function( data ) {
        if(dataObject != null)dataObject.fnDestroy();
        if(typeof columns !== 'undefined' ) columns = [];
        if(typeof aaData !== 'undefined' ) aaData = [];
        if(typeof aoColumns !== 'undefined' ) aoData = [];
        
        
        var AppendToHead = '<tr>';
        var tmp = data[0]; 
        $.each(tmp, function( key, value) {
            AppendToHead += "<th>" + key +"</th>";
            columns.push(key);
        });
        AppendToHead += '</tr>';
        var aoColumns = new Array();
        $.each(columns, function(i,v) {
            aoColumns.push({'sTitle': v});
        });
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
    $("#query").on( 'click', function() {
        var string = $("#string").val();
        query(string);
    });
    $(document).keypress( function( e ) {
        if( e.which == 13 ) {
            e.preventDefault();
            $("#query").trigger( 'click' );
        }
    });
}
