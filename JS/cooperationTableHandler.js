/*
 * Handles the content of cover tables.
 *
 * requires jQuery
 * requires requestHandler.js
 * requires contentHandler.js
 * requires TableHandler.js
 */

 function CooperationTableHandler(table) {

   TableHandler.call(this, table);
}

CooperationTableHandler.prototype.appendRow = function (element, cells) {

    var row = "<tr>";
    /* Simulation Id */
    var simulationId = $(element).find('SimulationId').text();
    row += createIdCell(simulationId, "simulationId");

    /* Simulation name */
    if($.inArray("Name", cells) > -1) {
        row += createCell($(coverElt).children('Name').text());
    }

    /* Delete cover */
    if($.inArray("R", cells) > -1) {
        row += createDeleteCell("deleteSimulation");
    }

    row += "</tr>";
    $(table).children('tbody').append(row);
}

/*
 * Deletes a Simulation.
 */
CooperationTableHandler.prototype.delete = function (simulationId) {
    /* Delete request */
    sendRequest("delete", "simulation/" + simulationId.text(), "",
        /* Response handler */
        function(confirmXml) {

        },
        /* Error handler */
        function(errorData) {
            showConnectionErrorMessage("Cover could not be deleted.");
    });
}

/*
 * Registers event handlers.
 */
CooperationTableHandler.prototype.registerTable = function (tableid) {
    if(typeof tableid === 'undefined') {
        tableid = 'body';
    }
    /* Delete button handler */
    $(tableid).find('.delSimulation').click(function(){
        var simulationId = $(this).parent().siblings().filter('.simulationId');
        deleteCover(simulationId);
    });
}
 }
