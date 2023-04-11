/*
 * Handles the content of graph sequence tables.
 *
 * requires jQuery
 * requires requestHandler.js
 */

/*
 * Creates a table row for a graph sequence element.
 * Is passed the table, the graph sequence element and the identifiers for the information to be displayed.
 */
function appendGraphSequenceRow(table, graphSequenceElt, cells) {
    var row = "<tr>";
    /* Graph id */
    console.log("SEQUENCE META ELEM:", $(graphSequenceElt))
    var id = $(graphSequenceElt).attr("Id");
    row += createGraphSequenceIdCell(id);
    /* Graph name  */
    if($.inArray("Name", cells) > -1) {
        row += createGraphSequenceNameCell($(graphSequenceElt).find('Name').text(), id);
    }

    /* Creation Method */
    if($.inArray("CreationMethod", cells) > -1) {
        row += createGraphSequenceTableCell(getGraphSequenceTrueOrFalseIcon($(graphSequenceElt).find('TimeOrdered').text()));
    }
    /* Show corresponding cooperation simulations */
    if($.inArray("Gr", cells) > -1) {
        row += createShowGraphsCell();
    }
    /* Delete graph sequence */
    if($.inArray("R", cells) > -1) {
        row += createGraphSequenceDeleteCell();
    }
    /* Select graph sequence*/
    if($.inArray("Select", cells) > -1) {
        row += createSelectGraphSequenceCell(id);
    }
    row += "</tr>";
    $(table).children('tbody').append(row);
}
/*
 * Creates standard table cell
 */
function createGraphSequenceTableCell(value) {
    return "<td>" + value + "</td>";
}

/* Creates graph name cell */
function createGraphSequenceNameCell(name, id) {
    return '<td><a href="graphSequence.html?id='+ id + '">' + name + '</a></td>';
}

/* Creates graph id cell */
function createGraphSequenceIdCell(value) {
    return '<td class="hidden graphSequenceId">' + value + '</td>';
}

/* Creates delete graph cell */
function createGraphSequenceDeleteCell() {
    return '<td>'
        + '<img class="icon iconBtn delGraphSequence" src="IMG/open-iconic/svg/trash.svg" alt="r">'
        + '</td>';
}

/* Creates show graph cell */
function createShowGraphsCell() {
    return '<td>'
        + '<img class="icon iconBtn showGraph" src="IMG/open-iconic/svg/eye.svg" alt="g">'
        + '</td>';
}

/* Creates select graph cell */
function createSelectGraphSequenceCell(id) {
    return '<td>'
        + '<input type="radio" name="graphSelect" value="' + id + '">'
        + '</td>';
}

/* Returns a true/false icon based on boolean input */
function getGraphSequenceTrueOrFalseIcon(val) {
    if(val === true || val === "true") {
        return '<img class="icon" src="IMG/open-iconic/svg/check.svg" alt="y">';
    }
    else
        return '<img class="icon" src="IMG/open-iconic/svg/x.svg" alt="n">';
}

/*
 * Deletes a graph sequence.
 */
function deleteGraphSequence(id) {
    /* Requests deletion */
    sendRequest("delete", "sequences/" + id.text() , "",
        /* Response handler */
        function(confirmXml) {
            var page = (typeof pageNumber === 'undefined') ? 0 : pageNumber;
            var newUrl = "graphSequences.html?page=" + page;
            window.location.href = newUrl;
        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Graph sequence could not be deleted.", errorData);
        });
}

/*
 * Shows a graph.
 */
function showGraphs(id) {
    window.location.href = "graphs.html?id=" + id.text();
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
 * Registers event handlers.
 */
function registerGraphSequenceTable() {
    /* Delete graph sequence button handler */
    $('.delGraphSequence').click(function(){
        var id = $(this).parent().siblings().filter('.graphSequenceId');
        deleteGraphSequence(id);
    });
    /* Show graphs button handler */
    $('.showGraphs').click(function(){
        var id = $(this).parent().siblings().filter('.graphId');
        showGraphs(id);
    });
    // /* Show covers button handler */
    // $('.showGraphCovers').click(function(){
    //     var id = $(this).parent().siblings().filter('.graphId');
    //     showGraphCovers(id);
    // });
    // /* Show centralities button handler */
    // $('.showGraphCentralities').click(function(){
    //     var id = $(this).parent().siblings().filter('.graphId');
    //     showGraphCentralities(id);
    // });
    /* Show cooperation simulations button handler */
    // $('.showCooperationSimulations').click(function(){
    //     var id = $(this).parent().siblings().filter('.graphId');
    //     showCooperationSimulations(id);
    // });
}