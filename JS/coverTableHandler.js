/*
 * Handles the content of cover tables.
 *
 * requires jQuery
 * requires requestHandler.js
 * requires contentHandler.js
 */

/*
 * Creates a table row for a cover element.
 * Is passed the table, the cover data and the identifiers of the data to be displayed.
 */
function appendCoverRow(table, coverElt, cells) {
    var row = "<tr>";
	/* Graph Id */
    var graphId = $(coverElt).find('GraphId').text();
    row += createCoverGraphIdCell(graphId);
    /* Cover Id */
    var coverId = $(coverElt).find('CoverId').text();
    row += createCoverIdCell(coverId);
    /* Cover name */
    if($.inArray("Name", cells) > -1) {
        row += createCoverNameCell($(coverElt).children('Name').text(), coverId, graphId);
    }
    /* Graph name */
    if($.inArray("Graph", cells) > -1) {
        row += createGraphNameCell($(coverElt).find('Graph').find('Name').text(), graphId);
    }
    /* Creation method */
    if($.inArray("CreationMethod", cells) > -1) {
        var type = $(coverElt).find('CreationMethod').find('Type').text();
        row += createCoverTableCell(parseEnumName(type));
    }
    /* Community count */
    if($.inArray("Communities", cells) > -1) {
        if($(coverElt).find('Status').first().text() !== "COMPLETED") { //There are two Statuses: the first one is for the cover, the second would be for a metric
            row += createCoverTableCell("PENDING");
        } else {
            row += createCoverTableCell($(coverElt).find('CommunityCount').text());
        }
    }
    /* Delete cover */
    if($.inArray("R", cells) > -1) {
        row += createDeleteCoverCell();
    }
    /* Save cover XML*/
    if($.inArray(".xml", cells) > -1) {
        row += createSaveXMLCoverCell();
    }
    /* Save cover Membership Matrix*/
    if($.inArray(".txt", cells) > -1) {
        row += createSaveMatrixCoverCell();
    }
    /* Select cover */
    if($.inArray("Select", cells) > -1) {
        row += createSelectCoverCell(coverId);
    }
    row += "</tr>";
    $(table).children('tbody').append(row);
}
/*
 * Creates standard table cells
 */
function createCoverTableCell(value) {
    return "<td>" + value + "</td>";
}

function createCoverNameCell(name, coverId, graphId) {
    return '<td class="coverName"><a href="#" class="showCover"> ' + name + '</a> </td>';
}

function createGraphNameCell(name, graphId) {
    return '<td><a href="graph.html?id='+ graphId + '">' + name + '</a> </td>';
}

/*
 * Creates cover id cell
 */
function createCoverIdCell(value) {
    return '<td class="hidden coverId">' + value + '</td>';
}
/* Creates graph id cell */
function createCoverGraphIdCell(value) {
    return '<td class="hidden graphId">' + value + '</td>';
}

/* Creates select cover cell */
function createSelectCoverCell(id) {
    return '<td>'
        + '<input type="radio" name="coverSelect" value="' + id + '">'
        + '</td>';
}

/* Creates delete cover cell */
function createDeleteCoverCell() {
    return '<td>'
        + '<img class="icon iconBtn delCover" src="IMG/open-iconic/svg/trash.svg" alt="r">'
        + '</td>';
}

/* Creates save XML cover cell */
function createSaveXMLCoverCell() {
    return '<td>'
        + '<img class="icon iconBtn saveXMLCover" src="IMG/open-iconic/svg/data-transfer-download.svg" alt="s">'
        + '</td>';
}

/* Creates save Matrix cover cell */
function createSaveMatrixCoverCell() {
    return '<td>'
        + '<img class="icon iconBtn saveMatrixCover" src="IMG/open-iconic/svg/data-transfer-download.svg" alt="s">'
        + '</td>';
}

/* Creates show cover cell */
function createShowCoverCell() {
    return '<td>'
        + '<img class="icon iconBtn showCover" src="IMG/open-iconic/svg/eye.svg" alt="g">'
        + '</td>';
}

/* Creates show graph cell */
function createShowCoverGraphCell() {
    return '<td>'
        + '<img class="icon iconBtn showCoverGraph" src="IMG/open-iconic/svg/eye.svg" alt="g">'
        + '</td>';
}

/*
 * Deletes a cover.
 */
function deleteCover(coverId, graphId) {
    /* Delete request */
    sendRequest("delete", "covers/" + coverId.text() + "/graphs/" + graphId.text(), "",
        /* Response handler */
        function(confirmXml) {
            var page = (typeof pageNumber === 'undefined') ? 0 : pageNumber;
            var newUrl = "covers.html?page=" + page;
            window.location.href = newUrl;
        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Cover could not be deleted.", errorData);
    });
}

/*
 * Saves a cover.
 */
function saveCover(coverId, graphId, coverName, type) {
    /* Save request */
    sendRequest("get", "covers/" + coverId.text() + "/graphs/" + graphId.text() + "?outputFormat=" + type, "",
        /* Response handler */
        function(response) {
			const trimmedName = coverName.text().trim() == "" ? "cover" : coverName.text().trim();
            if(type === "DEFAULT_XML") {
                const blob = new Blob([response],
                    {type: "text/xml"});
                saveAs(blob, trimmedName + ".xml");
            } else if(type === "LABELED_MEMBERSHIP_MATRIX") {
                const blob = new Blob([response],
                    { type: "text/plain;charset=utf-8" });
                saveAs(blob, trimmedName + ".txt");
            }
        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Membership Matrix was not received.");
        }, "text");
}

/*
 * Shows a cover.
 */
function showCover(coverId, graphId) {
    window.location.href = "cover.html?coverId=" + coverId.text() + "&graphId=" + graphId.text();
}

/*
 * Shows a graph.
 */
function showCoverGraph(graphId) {
    window.location.href = "graph.html?id=" + graphId.text();
}

/*
 * Registers event handlers.
 */
function registerCoverTable(tableid) {
    if(typeof tableid === 'undefined') {
        tableid = 'body';
    }
    /* Delete button handler */
    $(tableid).find('.delCover').click(function(){
        var coverId = $(this).parent().siblings().filter('.coverId');
        var graphId = $(this).parent().siblings().filter('.graphId');
        deleteCover(coverId, graphId);
    });
    /* Save XML button handler */
    $(tableid).find('.saveXMLCover').click(function(){
        var coverId = $(this).parent().siblings().filter('.coverId');
        var coverName = $(this).parent().siblings().filter('.coverName');
        var graphId = $(this).parent().siblings().filter('.graphId');
        saveCover(coverId, graphId, coverName, "DEFAULT_XML");
    });
    /* Save Membership Matrix button handler */
    $(tableid).find('.saveMatrixCover').click(function(){
        var coverId = $(this).parent().siblings().filter('.coverId');
        var coverName = $(this).parent().siblings().filter('.coverName');
        var graphId = $(this).parent().siblings().filter('.graphId');
        saveCover(coverId, graphId, coverName, "LABELED_MEMBERSHIP_MATRIX");
    });
    /* Show cover button handler */
    $(tableid).find('.showCover').click(function(){
        var coverId = $(this).parent().siblings().filter('.coverId');
        var graphId = $(this).parent().siblings().filter('.graphId');
        showCover(coverId, graphId);
    });
    /* Show graph button handler */
    $(tableid).find('.showCoverGraph').click(function(){
        var graphId = $(this).parent().siblings().filter('.graphId');
        showCoverGraph(graphId);
    });
}
