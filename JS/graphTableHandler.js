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
function appendGraphRow(table, graphElt, cells, idMultiplex) {
    /* Graph id */
    var id = $(graphElt).find('Id').text();
    if (idMultiplex) {
        var row = "<tr data-graphid='" + id + "' data-parentgraphid='" + idMultiplex + "' class='customGraph hidden'>";
        var row = "<tr data-idmultiplex='" + + idMultiplex + "  class=hidden>";
    }else{
        var row = "<tr>";
    }
    var row = "<tr data-graphid='" + id + "' ";

    /* Graph types */
    var types = [];
    $(graphElt).children('Types').find('Type').each(function() {
        types.push($(this).text());
    });
    var isMultiplex = $.inArray("MULTIPLEX", types) > -1;

    if (isMultiplex) {                                                    // if multiplex
        row += "class='multiplexGraph'>";
    } else if ($.inArray("MULTIPLEX_LAYER", types) > -1) {                // if customgraph that is layer of multiplex graph
        row += "class='customGraph hidden'>";
    } else {                                                              // if "normal" customgraph                       
        row += "class='customGraph'>";
    }

    /* Dropdown for Multiplex Graphs */
    if($.inArray(" ", cells) > -1) {
        if(isMultiplex) {
            row += '<td><img class="icon" src="IMG/open-iconic/svg/caret-right.svg" showLayers data-graphid="' + id + '"></td>';
        }else{
            row += '<td></td>';
        }
    }
    /* Graph name  */
    if($.inArray("Name", cells) > -1) {
        row += createGraphNameCell($(graphElt).find('Name').text(), id, isMultiplex);
    }
    /* Node count */
    if($.inArray("NodeCount", cells) > -1) {
        row += createGraphTableCell($(graphElt).find('NodeCount').text());
    }
    /* Edge count */
    if($.inArray("EdgeCount", cells) > -1) {
        row += createGraphTableCell($(graphElt).find('EdgeCount').text());
    }
    /* Layer count */
    if($.inArray("LayerCount", cells) > -1) {
        if(isMultiplex) {
            row += createGraphTableCell($(graphElt).find('LayerCount').text());
        }else{
            row += createGraphTableCell('<img class="icon" src="IMG/open-iconic/svg/x.svg" alt="n">');
        }
    }
    /* Creation Method */
    if($.inArray("CreationMethod", cells) > -1) {
        row += createGraphTableCell($(graphElt).find('CreationMethod').find('Type').attr('DisplayName'));
    }
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
    /* Multiplex */
    if($.inArray("M", cells) > -1) {
        row += createGraphTableCell(getGraphTrueOrFalseIcon(isMultiplex));
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
    /* Save graph */
    if($.inArray(".txt", cells) > -1) {
        row += createSaveGraphCell();
    }
    /* Select graph */
    if($.inArray("Select", cells) > -1) {
        row += createSelectGraphCell(id);
    }
    row += "</tr>";
    $(table).children('tbody').append(row);
}

$(document).on('click', 'img[showLayers]', function() {
    var graphId = $(this).data('graphid');
    var icon = $(this);
    var caretRight = "IMG/open-iconic/svg/caret-right.svg";
    var caretBottom = "IMG/open-iconic/svg/caret-bottom.svg";
    var alreadyFetched = $('tr[data-parentgraphid="' + multiplexGraphId + '"]').length > 0;

    if (icon.attr('src')===caretRight) { // hidden to visible
        icon.attr('src', caretBottom);
        if (alreadyFetched) { 
            //$('tr.customGraph[data-parentgraphid="' + graphId + '"]').removeClass('hidden');
            $('tr[data-parentgraphid="' + multiplexGraphId + '"]').toggleClass('hidden', !show);
        } else {
            fetchGraphLayers(graphId);
        }  
    } else {                            // visible to hidden
        icon.attr('src', caretRight);
        //$('tr.customGraph[data-parentgraphid="' + graphId + '"]').addClass('hidden');
        $('tr[data-parentgraphid="' + multiplexGraphId + '"]').toggleClass('hidden', !show);
    }
});

function fetchGraphLayers(idMultiplex) {
    sendRequest("get", "multiplexlayers?keyMultiplex=" + idMultiplex, "",
        function(GraphMetasXml) {
            var cells = [" ", "Name", "NodeCount", "EdgeCount", "LayerCount", "CreationMethod", "D", "W", "Z", "N", "L", "M", "Co", "Cn", "CS", "R", ".txt"];
            $(GraphMetasXml).find("Graph").each(function() {
                appendGraphRow($('#graphTable'), $(this), cells, idMultiplex);
            });
            var customGraphs = $('tr.customGraph').filter(`[data-parentgraphid='${multiplexGraphId}']`).detach();
            $(`tr.multiplexGraph[data-graphid='${multiplexGraphId}']`).after(customGraphs).removeClass('hidden');
        },
        function(errorData) {
            showConnectionErrorMessage("Graphs metas of multiplex layers were not received.", errorData);
        }
    );
}

/*
 * Creates standard table cell
 */
function createGraphTableCell(value) {
    return "<td>" + value + "</td>";
}

/* Creates graph name cell */
function createGraphNameCell(name, id, isMultiplex) {
    if (isMultiplex) {
        return '<td class="graphNameCell"><a href="multiplexgraph.html?id='+ id + '">' + name + '</a></td>';
    } else {
        return '<td class="graphNameCell"><a href="graph.html?id='+ id + '">' + name + '</a></td>';
    }
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

/* Creates save graph cell */
function createSaveGraphCell() {
    return '<td>'
        + '<img class="icon iconBtn saveGraph" src="IMG/open-iconic/svg/data-transfer-download.svg" alt="s">'
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
 * Saves a graph in weighted edge list format.
 */
function saveGraph(graphId, graphName, type) {
    
    /* Save request */
    sendRequest("get", "graphs/" + graphId.text() + "?outputFormat=" + type, "",
        /* Response handler */
        function(response) {
			const trimmedName = graphName.text().trim() == "" ? "graph" : graphName.text().trim();
            if(type === "WEIGHTED_EDGE_LIST") {
                const blob = new Blob([response.replace(/,/g,".")],
                    { type: "text/plain;charset=utf-8" });
                saveAs(blob, trimmedName + ".txt");
            } 
        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Graph Weighted Edge List Was not Received!");
        }, "text");
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
        //var isMultiplex = $(this).data('ismultiplex');
        //deleteGraph(id, isMultiplex);
        deleteGraph(id);
    });
    /* Save Graph button handler */
    $('.saveGraph').click(function(){
        var graphId = $(this).parent().siblings().filter('.graphId');
        var graphName = $(this).parent().siblings().filter('.graphNameCell');
        saveGraph(graphId, graphName, "WEIGHTED_EDGE_LIST");
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
