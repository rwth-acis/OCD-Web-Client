/*
 * Extends the Service API to facilitate service communication.
 * 
 * requires b64.js
 * requires moduleHelper.js
 * requires serviceAPI.js
 * requires jquery.session.js
 * requires contentHandler.js
 */

/* Base URL of the OCD Service */
var baseUrl = "https://api.learning-layers.eu/ocd";
//var baseUrl = "http://127.0.0.1:8080/ocd";
/* Base URL of the Viewer Service */
var viewerBaseUrl = "https://api.learning-layers.eu/ocdViewer";
//var viewerBaseUrl = "http://127.0.0.1:8080/ocdViewer";
/* API */
var api = i5.las2peer.jsAPI;

/*
 * Sends a request using the service api.
 * If an error xml is returned, the error is displayed.
 */
function sendRequest(method, url, content, callback, errorcallback, mimeType) {
    /* Login */
    var login = new api.Login(api.LoginTypes.HTTP_BASIC);
    login.setUserAndPassword($.session.get('userName'), $.session.get('userPw'));
    /* Request sender */
    var requestSender = new api.RequestSender(baseUrl, login);
    /* Request */
    var request = createRequest(method, url, content, callback, errorcallback, mimeType);
    requestSender.sendRequestObj(request);
};

function sendViewerRequest(method, url, content, callback, errorcallback, mimeType) {
    /* Login */
    var login = new api.Login(api.LoginTypes.HTTP_BASIC);
    login.setUserAndPassword($.session.get('userName'), $.session.get('userPw'));
    /* Request sender */
    var requestSender = new api.RequestSender(viewerBaseUrl, login);
    /* Request */
    var request = createRequest(method, url, content, callback, errorcallback, mimeType);
    requestSender.sendRequestObj(request);
};

/*
 * Sends requests asynchronously using the service api.
 */
function sendRequestsAsync(requestObjArray, callback) {
    /* Login */
    var login = new api.Login(api.LoginTypes.HTTP_BASIC);
    login.setUserAndPassword($.session.get('userName'), $.session.get('userPw'));
    /* Request sender */
    var requestSender = new api.RequestSender(baseUrl, login);
    /* Asynchronous request */
    requestSender.sendRequestsAsync(requestObjArray, callback);
}

/* 
 * Creates a request using the service api.
 * Adds an additional check whether an error xml is returned.
 */
function createRequest(method, url, content, callback, errorcallback, mimeType) {
    return new api.Request(method, url, content,
        function(data) {
            checkForErrorXML(data, callback);
        },
        errorcallback, mimeType);
}

/*
 * Checks whether an error xml is returned.
 */
function checkForErrorXML(data, successCallback) {
    if($(data).is("Error")) {
        /* 
         * Error xml was returned.
         * Displays the error message via the content handler.
         */
        showXMLErrorMessage(data);
    }
    else {
        /*
         * No error xml was returned.
         * Executes the callback function.
         */
        successCallback(data);
    }
}