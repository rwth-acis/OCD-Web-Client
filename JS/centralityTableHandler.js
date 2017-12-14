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
    /* Centrality map Id */
    var mapId = $(mapElt).find('CentralityMapId').text();
    var graphId = $(mapElt).find('GraphId').text();
    var graphName = $(mapElt).find('GraphName').text();
    if($.inArray("CentralityMapId", cells) > -1) {
        row += createVisibleMapIdCell(mapId);
    }
    else {
        row += createMapIdCell(mapId);
    }
    /* Graph Id */
    row += createMapGraphIdCell(graphId);
    /* Name */
    if($.inArray("Name", cells) > -1) {
        row += createMapNameCell($(mapElt).find('Name').text(), mapId, graphId);
    }
    /* Graph name */
    if($.inArray("Graph", cells) > -1) {
        row += createGraphNameCell(graphName, graphId);
    }
    if($.inArray("Creation Method", cells) > -1) {
        row += createCentralityTableCell(parseEnumName($(mapElt).find('CreationMethod').find('Type').text()));
    }
    if($.inArray("Execution Time", cells) > -1) {
        row += createCentralityTableCell($(mapElt).find('ExecutionTime').text());
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

/* Creates centrality map name cell */
function createMapNameCell(name, mapId, graphId) {
    return '<td><a href="centrality.html?mapId='+ mapId + '&graphId=' + graphId + '">' + name + '</a></td>';
}

/* Creates graph name cell */
function createGraphNameCell(name, id) {
    return '<td><a href="graph.html?id='+ id + '">' + name + '</a></td>';
}

/* Creates delete centrality map cell */
function createDeleteCentralityMapCell() {
    return '<td>'
        + '<img class="icon iconBtn delCentralityMap" src="IMG/open-iconic/svg/trash.svg" alt="r">'
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
            var url = window.location.href.split('/');
            if(url[url.length-1].includes("centrality.html")) {
                window.location.href = "centralities.html";
            }
            else {
                window.location.reload();
            }
        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Centrality map could not be deleted.");
    });
}

/*
 * Deletes a centrality map without reloading the page afterwards.
 */
function deleteCentralityMapWithCallback(mapId, graphId, callback) {
    /* Delete request */
    sendRequest("delete", "centrality/" + mapId.text() + "/graphs/" + graphId.text(), "",
        /* Response handler */
        function(confirmXml) {
            var page = (typeof pageNumber === 'undefined') ? 0 : pageNumber;
            callback();
        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Centrality map could not be deleted.");
    });
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
}

/*
 * Initialized centrality values table with the given id by adding all the
 * values from the given XML element, either using the precise values
 * or rounding to 4 decimal places.
 */
function initValuesTable(element, tableid, precise) {
    $(element).find("Node").each(function() {
        var nodeName = $(this).find('Name');
        nodeName = nodeName.text();
        var value = parseFloat($(this).find('Value').text());
        if(!precise) {
            value = value.toFixed(4);
        }
        var row = '<tr>'
            + '<td>' + nodeName + '</td>'
            + '<td>' + value + '</td>'
            + '</tr>';
        $(tableid + " tbody").append(row);
    });
    $(tableid).tablesorter({sortList: [[1,1], [0,0]]});
}
