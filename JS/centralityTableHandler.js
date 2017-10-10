/*
 * Handles the content of centrality tables.
 *
 * requires jQuery
 * requires requestHandler.js
 * requires contentHandler.js
 */

/*
 * Creates a table row for a centrality map element.
 * Is passed the table, the centrality map data and the identifiers of the data to be displayed.
 */
function appendCentralityMapRow(table, mapElt, cells) {
    var row = "<tr>";
    /* centrality map Id */
    var mapId = $(mapElt).find('CentralityMapId').text();
    if($.inArray("CentralityMapId", cells) > -1) {
        row += createVisibleMapIdCell(mapId);
    }
    else {
        row += createMapIdCell(mapId);
    }
    /* Graph Id */
    var graphId = $(mapElt).find('GraphId').text();
    row += createMapGraphIdCell(graphId);
    /* Creation method */
    if($.inArray("Centrality Measure", cells) > -1) {
        var type = $(mapElt).find('CreationMethod').find('Type').text();
        row += createCentralityTableCell(parseEnumName(type));
    }
    /* Graph name */
    if($.inArray("Graph", cells) > -1) {
        row += createCentralityTableCell($(mapElt).find('Graph').find('Name').text());
    }
    if($.inArray("Execution Time", cells) > -1) {
        row += createCentralityTableCell($(mapElt).find('ExecutionTime').text());
    }
    /* Show centrality map */
    if($.inArray("C", cells) > -1) {
        row += createShowCentralityMapCell();
    }
    /* Show graph */
    if($.inArray("G", cells) > -1) {
        row += createShowCentralityMapGraphCell();
    }
    /* Delete centrality map */
    if($.inArray("R", cells) > -1) {
        row += createDeleteCentralityMapCell();
    }
    row += "</tr>";
    $(table).children('tbody').append(row);
}

/*
 * Creates standard table cells
 */
function createCentralityTableCell(value) {
    return "<td>" + value + "</td>";
}

/*
 * Creates centrality map id cell
 */
function createMapIdCell(value) {
    return '<td class="hidden mapId">' + value + '</td>';
}

/*
 * Creates visible centrality map id cell
 */
function createVisibleMapIdCell(value) {
    return '<td class="mapId">' + value + '</td>';
}

/* Creates graph id cell */
function createMapGraphIdCell(value) {
    return '<td class="hidden graphId">' + value + '</td>';
}

/* Creates delete centrality map cell */
function createDeleteCentralityMapCell() {
    return '<td>'
        + '<img class="icon iconBtn delCentralityMap" src="IMG/open-iconic/svg/trash.svg" alt="r">'
        + '</td>';
}

/* Creates show centrality map cell */
function createShowCentralityMapCell() {
    return '<td>'
        + '<img class="icon iconBtn showCentralityMap" src="IMG/open-iconic/svg/eye.svg" alt="g">'
        + '</td>';
}

/* Creates show graph cell */
function createShowCentralityMapGraphCell() {
    return '<td>'
        + '<img class="icon iconBtn showCentralityMapGraph" src="IMG/open-iconic/svg/eye.svg" alt="g">'
        + '</td>';
}

/*
 * Deletes a centrality map.
 */
function deleteCentralityMap(mapId, graphId) {
    /* Delete request */
    sendRequest("delete", "centrality/" + mapId.text() + "/graphs/" + graphId.text(), "",
        /* Response handler */
        function(confirmXml) {
            var page = (typeof pageNumber === 'undefined') ? 0 : pageNumber;
            var newUrl = "centrality_maps.html?page=" + page;
            window.location.href = newUrl;
        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Centrality map could not be deleted.");
    });
}

/*
 * Shows a centrality map.
 */
function showCentralityMap(mapId, graphId) {
    window.location.href = "centrality_map.html?mapId=" + mapId.text() + "&graphId=" + graphId.text();
}

/*
 * Shows a graph.
 */
function showCentralityMapGraph(graphId) {
    window.location.href = "graph.html?id=" + graphId.text();
}

/*
 * Registers event handlers.
 */
function registerCentralityTable(tableid) {
    if(typeof tableid === 'undefined') {
        tableid = 'body';
    }
    /* Delete button handler */
    $(tableid).find('.delCentralityMap').click(function(){
        var mapId = $(this).parent().siblings().filter('.mapId');
        var graphId = $(this).parent().siblings().filter('.graphId');
        deleteCentralityMap(mapId, graphId);
    });
    /* Show centrality map button handler */
    $(tableid).find('.showCentralityMap').click(function(){
        var mapId = $(this).parent().siblings().filter('.mapId');
        var graphId = $(this).parent().siblings().filter('.graphId');
        showCentralityMap(mapId, graphId);
    });
    /* Show graph button handler */
    $(tableid).find('.showCentralityMapGraph').click(function(){
        var graphId = $(this).parent().siblings().filter('.graphId');
        showCentralityMapGraph(graphId);
    });
}
