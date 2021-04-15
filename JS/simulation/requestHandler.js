/*
 * Extends the Service API to facilitate service communication.
 *
 * requires base64.js
 * requires moduleHelper.js
 * requires serviceAPI.js
 * requires contentHandler.js
 */

 /* Base URL of the Cooperation & Defection Service */
 var BaseUrl = "http://127.0.0.1:8080/ocd";
 //Server ginkgo from rwth: http://ginkgo.informatik.rwth-aachen.de:8080/ocd
 //var baseUrl = "http://ocd-web-client.duckdns.org:7070/ocd"

/* API */
var api = i5.las2peer.jsAPI;

/*
 * Sends a request using the service api.
 * If an error is returned, the error is displayed.
 */
function sendRequest(method, url, content, callback, errorcallback, mimeType) {

    /* Login */
    var login = new api.Login(api.LoginTypes.OIDC);
    login.setAccessToken(localStorage.getItem('access_token'));
    login.setUserAndPassword(localStorage.getItem("user"), localStorage.getItem("pass"));

    /* Request sender */
    var requestSender = new api.RequestSender(BaseUrl, login);
    /* Request */
    var request = createRequest(method, url, content, callback, errorcallback, mimeType);
    requestSender.sendRequestObj(request);
};

/*
 * Sends requests asynchronously using the service api.
 */
function sendRequestsAsync(requestObjArray, callback) {
    /* Login */
    var login = new api.Login(api.LoginTypes.OIDC);
    login.setAccessToken(localStorage.getItem('access_token'));
    login.setUserAndPassword(localStorage.getItem("user"), localStorage.getItem("pass"));
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

    return new api.Request(method, url, content, callback,
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
