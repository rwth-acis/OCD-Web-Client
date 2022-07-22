/*
 * Handles the content of graph tables.
 *
 * requires jQuery
 * requires requestHandler.js
 */

/*
 * Creates a table row for a graph element.
 * Is passed the table, the graph element and the identifiers for the information to be displayed.
 */
function appendGraphRow(table, graphElt, cells) {
    var row = "<tr>";
    /* Graph id */
    var id = $(graphElt).find('Id').text();
    row += createGraphIdCell(id);
    /* Graph name  */
    if($.inArray("Name", cells) > -1) {
        row += createGraphNameCell($(graphElt).find('Name').text(), id);
    }
    /* Node count */
    if($.inArray("NodeCount", cells) > -1) {
        row += createGraphTableCell($(graphElt).find('NodeCount').text());
    }
    /* Edge count */
    if($.inArray("EdgeCount", cells) > -1) {
        row += createGraphTableCell($(graphElt).find('EdgeCount').text());
    }
    /* Graph types */
    var types = [];
    $(graphElt).children('Types').find('Type').each(function() {
        types.push($(this).text());
    });
    /* Directed */
    if($.inArray("D", cells) > -1) {
        row += createGraphTableCell(getGraphTrueOrFalseIcon($.inArray("DIRECTED", types) > -1));
    }
    /* Weighted */
    if($.inArray("W", cells) > -1) {
        row += createGraphTableCell(getGraphTrueOrFalseIcon($.inArray("WEIGHTED", types) > -1));
    }
    /* Zero edge weights */
    if($.inArray("Z", cells) > -1) {
        row += createGraphTableCell(getGraphTrueOrFalseIcon($.inArray("ZERO_WEIGHTS", types) > -1));
    }
    /* Negative edge weights */
    if($.inArray("N", cells) > -1) {
        row += createGraphTableCell(getGraphTrueOrFalseIcon($.inArray("NEGATIVE_WEIGHTS", types) > -1));
    }
    /* Loops */
    if($.inArray("L", cells) > -1) {
        row += createGraphTableCell(getGraphTrueOrFalseIcon($.inArray("SELF_LOOPS", types) > -1));
    }
    /* Dynamic Graphs */
    if($.inArray("DY", cells) > -1) {
        row += createGraphTableCell(getGraphTrueOrFalseIcon($.inArray("DYNAMIC", types) > -1));
    }
    /* Show corresponding covers */
    if($.inArray("Co", cells) > -1) {
        row += createShowGraphCoversCell();
    }
    /* Show corresponding centralities */
    if($.inArray("Cn", cells) > -1) {
        row += createShowGraphCentralitiesCell();
    }
    /* Show corresponding cooperation simulations */
    if($.inArray("CS", cells) > -1) {
        row += createShowCooperationSimulationsCell();
    }
    /* Delete graph */
    if($.inArray("R", cells) > -1) {
        row += createGraphDeleteCell();
    }
    /* Select graph */
    if($.inArray("Select", cells) > -1) {
        row += createSelectGraphCell(id);
    }

    /* Dynamic graph order*/
    if($.inArray("Order", cells) > -1) {
        row += createOrderGraphCell(id);
    }

    row += "</tr>";
    $(table).children('tbody').append(row);
}
/*
 * Creates standard table cell
 */
function createGraphTableCell(value) {
    return "<td>" + value + "</td>";
}

/* Creates graph name cell */
function createGraphNameCell(name, id) {
    return '<td><a href="graph.html?id='+ id + '">' + name + '</a></td>';
}

/* Creates graph id cell */
function createGraphIdCell(value) {
    return '<td class="hidden graphId">' + value + '</td>';
}

/* Creates delete graph cell */
function createGraphDeleteCell() {
    return '<td>'
        + '<img class="icon iconBtn delGraph" src="IMG/open-iconic/svg/trash.svg" alt="r">'
        + '</td>';
}

/* Creates show graph cell */
function createShowGraphCell() {
    return '<td>'
        + '<img class="icon iconBtn showGraph" src="IMG/open-iconic/svg/eye.svg" alt="g">'
        + '</td>';
}

/* Creates select graph cell */
function createSelectGraphCell(id) {
    return '<td>'
        + '<input type="radio" name="graphSelect" value="' + id + '">'
        + '</td>';
}

/* Creates order graph cell*/
function createOrderGraphCell(id){
    return '<td><input type="number" name="dynamicGraphOrder"></td>';
}

/* Creates show covers cell */
function createShowGraphCoversCell() {
    return '<td>'
        + '<img class="icon iconBtn showGraphCovers" src="IMG/open-iconic/svg/eye.svg" alt="co">'
        + '</td>';
}

/* Creates show centralities cell */
function createShowGraphCentralitiesCell() {
    return '<td>'
        + '<img class="icon iconBtn showGraphCentralities" src="IMG/open-iconic/svg/eye.svg" alt="cn">'
        + '</td>';
}

/* Creates show cooperation cell */
function createShowCooperationSimulationsCell() {
    return '<td>'
        + '<img class="icon iconBtn showCooperationSimulations" src="IMG/open-iconic/svg/eye.svg" alt="cn">'
        + '</td>';
}

/* Returns a true/false icon based on boolean input */
function getGraphTrueOrFalseIcon(isTrue) {
    if(isTrue) {
        return '<img class="icon" src="IMG/open-iconic/svg/check.svg" alt="y">';
    }
    else
        return '<img class="icon" src="IMG/open-iconic/svg/x.svg" alt="n">';
}

/*
 * Deletes a graph.
 */
function deleteGraph(id) {
    /* Requests deletion */
    sendRequest("delete", "graphs/" + id.text() , "",
        /* Response handler */
        function(confirmXml) {
            var page = (typeof pageNumber === 'undefined') ? 0 : pageNumber;
            var newUrl = "graphs.html?page=" + page;
            window.location.href = newUrl;
        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Graph could not be deleted.", errorData);
    });
}

/*
 * Shows a graph.
 */
function showGraph(id) {
    window.location.href = "graph.html?id=" + id.text();
}

/*
 * Shows graph covers.
 */
function showGraphCovers(id) {
    window.location.href = "covers.html?graphId=" + id.text();
}

/*
 * Shows graph centralities.
 */
function showGraphCentralities(id) {
    window.location.href = "centralities.html?graphId=" + id.text();
}

/*
 * Shows cooperation simulations.
 */
function showCooperationSimulations(id) {
    window.location.href = "cooperation_simulations.html?graphId=" + id.text();
}

/*
 * Shows graph simulations.
 */
function showGraphSimulations(id) {
    window.location.href = "covers.html?graphId=" + id.text();
}

/*
 * Registers event handlers.
 */
function registerGraphTable() {
    /* Delete graph button handler */
    $('.delGraph').click(function(){
        var id = $(this).parent().siblings().filter('.graphId');
        deleteGraph(id);
    });
    /* Show graph button handler */
    $('.showGraph').click(function(){
        var id = $(this).parent().siblings().filter('.graphId');
        showGraph(id);
    });
    /* Show covers button handler */
    $('.showGraphCovers').click(function(){
        var id = $(this).parent().siblings().filter('.graphId');
        showGraphCovers(id);
    });
    /* Show centralities button handler */
    $('.showGraphCentralities').click(function(){
        var id = $(this).parent().siblings().filter('.graphId');
        showGraphCentralities(id);
    });
    /* Show cooperation simulations button handler */
    $('.showCooperationSimulations').click(function(){
        var id = $(this).parent().siblings().filter('.graphId');
        showCooperationSimulations(id);
    });
}
