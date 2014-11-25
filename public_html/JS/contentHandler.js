/* 
 * Loads general content (e.g. header, menu) and provides common functionalities.
 * 
 * requires jQuery 2.1.1
 * requires jquery.session.js
 * requires jquery.tablesorter.js
 * loads navbar.css
 */

/*
 * Redirect to login page if not logged in.
 * Else initialize request sender.
 */

if(window.location.pathname !== "/OCD-Web-Client/login.html") {
    if($.session.get('isLoggedIn') !== 'true') {
            window.location.replace("login.html");
    }
}

/*
 * Set general page content:
 * Header
 * Menu
 */
$(document).ready(function(){
    /*
     * Menu definition.
     */
    var menuString =
            '\
                <div id="menuWrapper">\
                    <div id="menuOuterWrapper">\
                        <div id="menuInnerWrapper">\
                            <ul id="menu">\
                                <li><a href="index.html">Home</a></li>\
                                <li><a href="graphs.html">Graphs</a></li>\
                                <li><a href="covers.html">Covers</a></li>\
                                <li><a href="benchmarks.html">Benchmarks</a></li>\
                                <li><a href="import.html">Import</a></li>\
                                <li><a href="logout.html">Logout</a></li>\
                            </ul>\
                        </div>\
                    </div>\
                </div>\
        ';
    /*
     * Header definition.
     */
    var headerString = 
        '\
            <div id="headerWrapper">\
                <div id="header">\
                    <h1>Overlapping Community Detection</h1>\
                </div>\
            </div>\
        ';
    var navbarStyleString = '<link rel="stylesheet" type="text/css" href="CSS/navbar.css">';
    $('#wrapper').prepend(menuString);
    $('#wrapper').prepend(headerString);
    $('head').append(navbarStyleString);
});

/*
 * Displays an error message.
 * @param {type} message A message string.
 * @returns {undefined}
 */
function showErrorMessage(message) {
    $("#errorMessage").empty();
    $("#errorMessage").append("<p>Error: " + message + "<p>");
    $("#errorMessageWrapper").show();
};

/*
 * Displays an error message marking it as a connection failure.
 * @param {type} message A message string.
 */
function showConnectionErrorMessage(message) {
    $("#errorMessage").empty();
    $("#errorMessage").append("<p>Service Connection Failure: " + message
            + "</p><p>Please refresh the page or reexecute the operation.</p>");
    $("#errorMessageWrapper").show();
};

/*
 * Displays an error message.
 * @param {type} errorXml An error xml.
 */
function showXMLErrorMessage(errorXml) {
    $("#errorMessage").empty();
    var errName = $(errorXml).children("Name").first().text();
    var errId = $(errorXml).children("Id").first().text();
    var errMessage = $(errorXml).children("Message").first().text();
    $("#errorMessage").append(
            '<p>Service Error ' + errName + ' (Id ' + errId + '): '
            + errMessage + '</p>'
    );
    $("#errorMessageWrapper").show();
}

/*
 * Returns an array with the names and values of the
 * query variables of the current url.
 */
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

/*
 * Returns a url variable of a given name.
 */
function getUrlVar(name) {
    return getUrlVars()[name];
}

/* Parses internal system enum names to a more readable format */
function parseEnumName(name) {
    var tmp = name.replace(/_/g, ' ');
    tmp = tmp.toLowerCase();
    tmp = tmp.replace(/(?:^|\s)\S/g, function(firstLetter) { return firstLetter.toUpperCase(); });
    return tmp;
}

/* Transforms enum names from their readable format to the internal system format */
function getEnumName(parsedName) {
    var tmp = parsedName.toUpperCase();
    tmp = tmp.replace(/ /g, '_');
    return tmp;
}

/* Registers event listeners for a collapsable element */
function registerCollapsable(collapsable, displayCallback) {
    /* Click listener */
    $(collapsable).children('.collapsableHeader').find('.collapsableCollapser img').click(function(){
        /* Content */
        var content = $(collapsable).children('.collapsableContent');
        /* Control */
        var collapser = $(collapsable).children('.collapsableHeader').find('.collapsableCollapser');
        /* Display collapsable content */
        if(content.css('display') === "none") {
            if(typeof displayCallback !== 'undefined') {
                displayCallback();
            }
            content.css('display', 'block');
            collapser.children('.collapsableDisplayBtn').css('display', 'none');
            collapser.children('.collapsableCollapseBtn').css('display', 'inline');
        }
        /* Hide collapsable content */
        else {
            content.css('display', 'none');
            collapser.children('.collapsableDisplayBtn').css('display', 'inline');
            collapser.children('.collapsableCollapseBtn').css('display', 'none');
        }
    });
}

/* Initializes a parameters table bound to a select element and provides the corresponding event handlers */
function registerParameterSelect(selectId, paramTableRowId, getOptions) {
    /* Initialization */
    $(selectId).prepend('<option value="' + getSelectOptionVal() + '">--SELECT--</option>');
    /* Change listener on the select element */
    $(selectId).change(function() {
        $(paramTableRowId).find("tbody").empty();
        $(selectId + " option:selected").each(function() {
            if($(this).val() !== getSelectOptionVal()) {
                var selected = $(this).val();
                /* Requests the parameter names for the currently selected option */
                getOptions(selected, function(response) {
                    /* Adds the names to the parameter table */
                    $(response).find("Parameter").each(function() {
                        var paramRow = '<tr><td>' + $(this).find("Name").first().text() + '</td>'
                            + '<td>' + $(this).find("Value").first().text() + '</td>'
                            + '<td><input type="text" class="parameter" name="' + $(this).find("Name").first().text() + '"</td></tr>';
                        $(paramTableRowId).find("tbody").append(paramRow);
                    });
                    /* Displays the parameter table  */
                    if($(paramTableRowId).find("tbody").find("tr").length > 0) {
                        $(paramTableRowId).css("display", "table-row");
                    }
                    else {
                        $(paramTableRowId).css("display", "none");
                    }
                });
            }
            else {
                /* SELECT selected */
                $(paramTableRowId).css("display", "none");
            }
        });
    });
}

/* Standard value for a select option */
function getSelectOptionVal() {
    return "SELECT";
}

/* Transforms a parameter table into xml format */
function getParameterXml(paramTableId) {
    var parametersXml = "<Parameters>";
    $(paramTableId).find(".parameter").each(function() {
        var name = $.trim($(this).attr("name"));
        var val = $.trim($(this).val());
        if(val !== "") {
            parametersXml += '<Parameter>'
                + '<Name>' + name + '</Name>'
                + '<Value>' + val + '</Value>'
                + '</Parameter>';
        }
    });
    parametersXml += '</Parameters>';
    return parametersXml;
}