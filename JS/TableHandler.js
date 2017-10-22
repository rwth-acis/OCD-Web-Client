/*
 * Basic Table Handler
 *
 * requires jQuery
 * requires requestHandler.js
 * requires contentHandler.js
 */

function TableHandler(table) {

  this.table = table;

/*
 * Creates a table row for a element.
 *
 */
function appendRow(element, cells) {
    var row = "<tr>";

    row += "</tr>";
    $(table).children('tbody').append(row);
}

/*
 * Creates standard table cells
 */
function createCell(value) {
    return "<td>" + value + "</td>";
}

/*
 * Creates link table cells
 */
function createLinkCell(value, link) {
    return '<td><a href="'+ link + '">' + value + '</a> </td>';
}

/*
 * Creates id cell
 */
function createIdCell(className, idValue) {
    return '<td class="hidden ' + className + '">' + idValue + '</td>';
}

/*
* Creates select cell
*/
function createSelectCell(name, idValue) {
    return '<td>'
        + '<input type="radio" name="'+ name +'" value="' + idValue + '">'
        + '</td>';
}

/*
* Creates delete cover cell
*/
function createDeleteCell(className) {
    return '<td>'
        + '<img class="icon iconBtn ' + className +'" src="IMG/open-iconic/svg/trash.svg" alt="r">'
        + '</td>';
}

}
