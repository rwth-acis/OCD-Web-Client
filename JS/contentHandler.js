/*
 * Loads general content (e.g. header, menu) and provides common functionalities.
 *
 * requires jQuery 2.1.1
 * requires jquery.tablesorter.js
 * loads navbar.css
 */

/*
 * Redirect to login page if not logged in.
 * Else initialize request sender.
 */
var path = window.location.pathname.split('/');
if(path[path.length - 1] !== "login.html") {
    if(path[path.length - 1] !== "logout.html") {
        localStorage.setItem("redirect_relogin", window.location.href);
    }
    if(sessionStorage.getItem('isLoggedIn') !== 'true') {
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
            <nav class="navbar navbar-expand-lg navbar-light bg-faded" role="navigation" id="topNav">\
              <button class="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">\
                <span class="navbar-toggler-icon"></span>\
              </button>\
              <a class="navbar-brand" href="index.html">Network Analysis</a>\
              <div class="collapse navbar-collapse" id="navbarText">\
                <ul class="navbar-nav mr-auto">\
                  <li class="nav-item"><a class="nav-link" href="graphs.html">Networks</a></li>\
                  <li class="nav-item"><a class="nav-link" href="covers.html">Community Detection</a></li>\
                  <li class="nav-item"><a class="nav-link" href="benchmarks.html">Benchmarks</a></li>\
                  <li class="nav-item"><a class="nav-link" href="cooperation_simulations.html">Simulations</a></li>\
    			  <li class="nav-item"><a class="nav-link" href="centralities.html">Centrality</a></li>\
                </ul>\
                <ul class="navbar-nav navbar-right">\
                  <li class="nav-item"><a class="nav-link" href="import.html">Import</a></li>\
                  <li class="nav-item"><a class="nav-link" href="logout.html">Logout</a></li>\
                </ul>\
              </div>\
            </nav>\
        ';

    $('body').prepend(menuString);
});

/*
 * Displays an error message.
 * @param {type} message A message string.
 * @returns {undefined}
 */
function showErrorMessage(message) {
    $("#errorMessage").empty();
    $("#errorMessage").html(writeAlertError("Error!", message));
    $("#errorMessageWrapper").hide();
    $("#errorMessageWrapper").fadeIn(100);
};

/*
 * Displays an warning message.
 * @param {type} message A message string.
 * @returns {undefined}
 */
function showWarning(message) {
    $("#errorMessage").empty();
    $("#errorMessage").html(writeAlertWarning("Warning!", message));
    $("#errorMessageWrapper").hide();
    $("#errorMessageWrapper").fadeIn(100);
};

/*
 * Displays an info message.
 * @param {type} message A message string.
 * @returns {undefined}
 */
function showInfo(message) {
    $("#errorMessage").empty();
    $("#errorMessage").html(writeAlertInfo("Info ", message));
    $("#errorMessageWrapper").hide();
    $("#errorMessageWrapper").fadeIn(100);
};

/*
 * Displays an success message.
 * @param {type} message A message string.
 * @returns {undefined}
 */
function showSuccess(message) {
    $("#errorMessage").empty();
    $("#errorMessage").html(writeAlertInfo("Success!", message));
    $("#errorMessageWrapper").hide();
    $("#errorMessageWrapper").fadeIn(100);
};

/*
 * Displays an error message marking it as a connection failure.
 * @param {type} message A message string.
 * @param {type} errorData The error code, original request and potential message in a combined string separated by whitespace
 */
function showConnectionErrorMessage(message, errorData) {
    $("#errorMessage").empty();

    const code = errorData.substring(0,3);
    if(code === "401") {
        var po = document.createElement('script');
        po.type = 'text/javascript';
        po.async = true;
        po.src = 'JS/oidc-signInCallback.js';
        var s = document.getElementsByTagName('script')[0];
        var po2 = document.createElement('script');
        po2.type = 'text/javascript';
        po2.async = true;
        po2.src = 'JS/oidc-button.js';
        s.parentNode.insertBefore(po, s);
        s.parentNode.insertBefore(po2, s);

        localStorage.setItem("redirect_relogin", window.location.href);

        $("#errorMessage").html(writeAlertWarning("Service Connection Failure!", message
            + "<p>Log-In expired. Please log into the service again.</p>"
            + "<button type=\"button\" class=\"btn btn-light\"><form class=\"oidc_button\">\n" +
            "        <!-- OpenID Connect Information -->\n" +
            "        <!-- for local host: data-clientid=\"15cdbd81-f6c1-4862-bb7a-7344deed3aaa\" -->\n" +
            "        <!-- for server host: data-clientid=\"9c04fe4a-2b6b-436b-9896-83383377c497\" -->\n" +
            "        <!-- for testserver host: data-clientid=\"95bb04f6-122a-475d-8eed-209d7449a048\" -->\n" +
            "        <!-- for ginkgo host: data-clientid=\"59b76233-35fc-47f1-a54b-101f4fcef4d9\" -->\n" +
            "        <!-- http://learning-layers.eu/wp-content/themes/learninglayers/images/logo.png\" -->\n" +
            "        <!-- Testserver: data-redirecturi=\"http://ocd-web-client.duckdns.org/login.html\" -->\n" +
            "        <!-- Server ginkgo from rwth: https://ginkgo.informatik.rwth-aachen.de/OCDWebClient/login.html -->\n" +
            "        <span class=\"oidc-signin\"\n" +
            "              data-callback=\"signinCallback\"\n" +
            "              data-name=\"Learning Layers\"\n" +
            "              data-logo=\"http://results.learning-layers.eu/images/learning-layers.svg\"\n" +
            "              data-server=\"https://api.learning-layers.eu/o/oauth2\"\n" +
            "              data-clientid=\"localtestclient\"\n" +
            "              data-redirecturi=\"http://localhost:8090/login.html\"\n" +
            "              data-scope=\"openid email profile\">\n" +
            "        </span>\n" +
            "    </form> </button>"));
    }
    else
    {
        const doc = $.parseXML(errorData.substring(errorData.indexOf("<?xml")));
        $("#errorMessage").html(writeAlertWarning("Service Connection Failure!", message
            + "<p style=\"margin-top:12px;margin-bottom:0\">" + $(doc).find("Message").text() + "</p>"
            + "<p>Please refresh the page or reexecute the operation.</p>"));
    }
    $("#errorMessageWrapper").hide();
    $("#errorMessageWrapper").fadeIn(100);
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
    $("#errorMessageWrapper").hide();
    $("#errorMessageWrapper").fadeIn(100);
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
    tmp = tmp.replace(/Xml|[mM]l|Xgmml/g, function(str) { return str.toUpperCase(); });
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
    $(collapsable).children('.collapsableHeader').click(function(){
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

/* Initializes a graph types row bound to a select element and provides the corresponding event handlers */
function registerGraphTypes(selectId, graphTypeDivId, getOptions) {
    /* Change listener on the select element */
    $(selectId).change(function() {
        $(graphTypeDivId).html("");
        $(selectId + " option:selected").each(function() {
            if($(this).val() !== getSelectOptionVal()) {
                var selected = $(this).val();
                /* Requests the parameter names for the currently selected option */
                getOptions(selected, function(response) {
                    /* Check if the option has graph types */
                    var graphTypeString = ''//'<div class="col-sm-4 col-form-label">'

                    graphTypeString += '<div class="row mb-4 border-bottom">'
                        + '<label class = "col-sm-4" > ' + 'Compatible Graph Types' +' </label>'
                        + '<span class="graphTypes col">';

                    graphTypeString += '<span class="badge badge-info mr-1">'
                        + 'Undirected'
                        + '</span>';

                    if($(response).find("Name").size() > 0) {
                        /* Adds the graph types to the form */
                        $(response).find("Name").each(function() {
                            var graphType = '<span class="badge badge-info mr-1">'
                                + $(this).attr("displayName")
                                + '</span>'

                            graphTypeString += graphType;
                        });
                    }

                    graphTypeString += '</span></div>'

                    /* Write the graph type string into the graph type div */
                    $(graphTypeDivId).html(graphTypeString);
                });
            }
        });
    });
}

/* Returnes select element with one option for every entry of arr */
function workWithArr(arr,name, val) {
    if(arr.indexOf(val) > -1) {
        var paramRow = '<div class="form-group row">'
        + '<label class="col-sm-4 col-form-label">' + name  +'</label>'
        + '<div class="col-sm-8">'
        + '<input type="text" class="form-control parameter" name="' + name +'" placeholder="' + val + '">'
        + '</div></div>'
    } else {
        var paramRow = '<div class="form-group row">'
        + '<label class="col-sm-4 col-form-label">' + name  +'</label>'
        + '<div class="col-sm-8">'
        + '<input type="text" class="form-control parameter" name="' + name +'" placeholder="' + val + '">'
        + '</div></div>'
    }

    return paramRow;
}

/* Initializes a parameters table bound to a select element and provides the corresponding event handlers */
function registerParameterSelect(selectId, paramDivId, getOptions, getEnum) {
    var weightFunctionArr = [];
    var rankingFunctionArr = [];
    /* Initialization */
    $(selectId).prepend('<option value="' + getSelectOptionVal() + '">--SELECT--</option>');
    /* Change listener on the select element */
    $(selectId).change(function() {
        $(paramDivId).html("");
        $(selectId + " option:selected").each(function() {
            if($(this).val() !== getSelectOptionVal()) {
                var selected = $(this).val();
                /* Requests the parameter names for the currently selected option */
                getOptions(selected, function(response) {
                    /* Check if the option has parameters */
                    if($(response).find("Parameter").size() > 0) {
                        var parameterString = '';
                       /* Adds the parameters to the form */
                        $(response).find("Parameter").each(function() {
                            var paramVal = $(this).find("Value").first().text();
                            var paramName = $(this).find("Name").first().text();
                            var handle = true;
                            if(String(selected) === "RANK_REMOVAL_AND_ITERATIVE_SCAN_ALGORITHM") {
                                /* Requests weightFunction parameter values */
                                getEnum(selected, "weightFunction", function(response) {
                                    console.log("WEIGHT FUNCTION EXECUTED!");
                                    if($(response).size() > 0) {
                                        $(response).find("Name").each(function () {
                                            if(!weightFunctionArr.includes($(this).first().text())) {
                                                weightFunctionArr.push($(this).first().text());
                                            }
                                        });
                                        if(weightFunctionArr.indexOf(paramVal) != -1) {
                                            console.log("SELECT: ", paramName);
                                            var paramRow = '<div class="form-group row">'
                                            + '<label class="col-sm-4 col-form-label">' + paramName +'</label>'
                                            + '<div class="col-sm-8">'
                                            + '<select class="form-control parameter" name="' + paramName + '">'
                                            weightFunctionArr.forEach((val) => {
                                                optionRow = '<option '
                                                if(val === "EDGE_RATIO") {
                                                    optionRow += 'selected';
                                                }
                                                optionRow += ' value="' + val + '">' + val + '</option>';
                                                paramRow += optionRow;
                                            });
                                            paramRow += '</select></div></div>';

                                            parameterString += paramRow;
                                            handle = false;

                                        } else if (handle) {
                                            console.log("DO NOTHING!");
                                        }
                                        /* Write the parameter string into the parameter form */
                                        $(paramDivId).html(parameterString);
                                    }
                                });
                                /* Requests rankingFunction parameter values */
                                getEnum(selected, "rankingFunction", function(response) {
                                    console.log("RANKING FUNCTION EXECUTED!");
                                    if($(response).size() > 0) {
                                        $(response).find("Name").each(function () {
                                            rankingFunctionArr.push(String($(this).first().text()));
                                        });
                                        if(rankingFunctionArr.indexOf(paramVal) != -1 && handle) {
                                            console.log("SELECT: ", paramName);
                                            var paramRow = '<div class="form-group row">'
                                            + '<label class="col-sm-4 col-form-label">' + paramName  +'</label>'
                                            + '<div class="col-sm-8">'
                                            + '<input type="text" class="form-control parameter" name="' + paramName +'" placeholder="' + paramVal + '">'
                                            + '</div></div>'
                                            parameterString += paramRow;
                                            handle = false;
                                        } else if(handle) {
                                            console.log("INPUT: ", paramName);
                                            var paramRow = '<div class="form-group row">'
                                               + '<label class="col-sm-4 col-form-label">' + paramName  +'</label>'
                                               + '<div class="col-sm-8">'
                                               + '<input type="text" class="form-control parameter" name="' + paramName +'" placeholder="' + paramVal + '">'
                                               + '</div></div>'

                                            parameterString += paramRow;
                                            handle = false;
                                        }
                                        /* Write the parameter string into the parameter form */
                                        $(paramDivId).html(parameterString);
                                    }
                                });
                            } else {
                                console.log("DEFAULT: ", paramName);
                                var paramRow = '<div class="form-group row">'
                                    + '<label class="col-sm-4 col-form-label">' + $(this).find("Name").first().text()  +'</label>'
                                    + '<div class="col-sm-8">'
                                    + '<input type="text" class="form-control parameter" name="' + $(this).find("Name").first().text() +'" placeholder="' + $(this).find("Value").first().text() + '">'
                                    + '</div></div>'

                                parameterString += paramRow;
                                handle = false;

                                /* Write the parameter string into the parameter form */
                                $(paramDivId).html(parameterString);
                            }
                        });
                  }
                });
            }

        });
    });
}

/* Standard value for a select option */
function getSelectOptionVal() {
    return "SELECT";
}

/* Transforms a parameter table into xml format */
function getParameterXml(paramDivId) {
    var parametersXml = "<Parameters>";
    $(paramDivId).find(".parameter").each(function() {
        var name = $.trim($(this).attr("name"));
        var val = $.trim($(this).attr("placeholder"));
        if($(this).val()) {
            val = $.trim($(this).val());
        }
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

/* Add parameters from an xml file to a table */
function addParameters(element, tableid) {
    var parameterName = element.find('ParameterName');
    parameterName = parameterName.text();
    var value = parseFloat(element.find('ParameterValue').text());
    var row = '<tr>'
        + '<td>' + parameterName + '</td>'
        + '<td>' + value + '</td>'
        + '</tr>';
    $(tableid + " tbody").append(row);
}

/* Get Information Divs */
function writeAlertInfo(strong, string) {
    return '<div class="alert alert-info"><strong>'+ strong +'</strong> ' + string + '</div>';
}

function writeAlertSuccess(strong, string) {
    return '<div class="alert alert-success"><strong>'+ strong +'</strong> ' + string + '</div>';
}

function writeAlertWarning(strong, string) {
    return '<div class="alert alert-warning"><strong>'+ strong +'</strong> ' + string + '</div>';
}

function writeAlertError(strong, string) {
    return '<div class="alert alert-danger"><strong>'+ strong +'</strong> ' + string + '</div>';
}

/* Disable submit button and add loading spinner */
function buttonSubmitStart(buttonId) {
    let submitButton = document.getElementById(buttonId)
    submitButton.disabled = true;

    if(submitButton.querySelector(".submitIcon") !== null) {
        submitButton.querySelector(".submitIcon").outerHTML =
            "<span class=\"submitIcon submitSpinner spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\" height=\"100%\" style=\"margin-bottom:90%\"></span>";
    } else {
        let submitText = "";
        if (submitButton.querySelector(".submitText").textContent === "Simulate") {
            submitText = "Simulating";
        } else if (submitButton.querySelector(".submitText").textContent === "Submit") {
            submitText = "Submitting";
        } else {
            submitText = "Running";
        }

        submitButton.querySelector(".submitText").textContent = submitText;
        submitButton.querySelector(".submitSpinner").hidden = false;
    }
}

/* Enable submit button and remove loading spinner */
function buttonSubmitEnd(buttonId) {
    let submitButton = document.getElementById(buttonId)
    submitButton.disabled = false;

    if(submitButton.querySelector(".submitIcon") !== null) {
        submitButton.querySelector(".submitIcon").outerHTML =
            "<img class=\"submitIcon\" src=\"IMG/open-iconic/svg/media-play.svg\" alt=\"Run\" height=\"100%\" style=\"margin-bottom:90%;margin-left: 15%\">";
    } else {
        let submitText = "";
        if (submitButton.querySelector(".submitText").textContent === "Simulating") {
            submitText = "Simulate";
        } else if (submitButton.querySelector(".submitText").textContent === "Submitting") {
            submitText = "Submit";
        } else {
            submitText = "Run";
        }

        submitButton.querySelector(".submitText").textContent = submitText;
        submitButton.querySelector(".submitSpinner").hidden = true;
    }
}

/*getHeadLine */
function getHeadLine(header, description) {
return '<div class="jumbotron">\
  <h1 display-6>'+ header +'</h1>\
  <p>'+ description +'</p>\
</div>';
}
