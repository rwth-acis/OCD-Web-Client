/*
 * Extends the Service API to facilitate service communication.
 *
 * requires base64.js
 * requires moduleHelper.js
 * requires serviceAPI.js
 * requires contentHandler.js
 */
 (function() {
   this.module("i5", function() {
     return this.module("las2peer", function() {
       return this.module("jsAPI", function() {
           return this.module("json", function() {
         /*
           Enum for various supportet login types.
           For now only BASIC Auth is supported.
          */
         var LoginTypes;
         LoginTypes = {
           NONE: 0,
           HTTP_BASIC: 1,
           OIDC: 2
         };
         this.LoginTypes = LoginTypes;

         /*
           Login class manages login related tasks, e.g. base64 encoding etc.
          */
         this.Login = (function() {
           function Login(loginType) {
             this.loginType = loginType;
           }

           Login.prototype.setUserAndPassword = function(user, password) {
             this.user = user;
             this.password = password;
           };

           Login.prototype.getBasicAuthLogin = function() {
             return Base64.encode(this.user + ":" + this.password);
           };

           Login.prototype.setAccessToken = function(accessToken) {
             this.accessToken = accessToken;
           };

           Login.prototype.getAccessToken = function() {
             return String(this.accessToken);
           };

           return Login;

         })();

         /*
           Simple class for request objects.
          */
         this.Request = (function() {
           function Request(method, uri, content, callback, errorCallback, mimeType) {
             this.method = method;
             this.uri = uri;
             this.content = content;
             this.callback = callback;
             this.errorCallback = errorCallback;
             if (errorCallback === null) {
               errorCallback = function() {};
             }
             this.mimeType = mimeType;
           }

           return Request;

         })();

         /*
           Provides an easy way to send ajax requests.
          */
         return this.RequestSender = (function() {

           /*
             Constructor takes a uri to the service and a login object to manage logins automatically.
             Additionally an ajax object can be given as a parameter to override default some values.
            */
           function RequestSender(baseURI, login, newBaseAjaxObj) {
             this.baseURI = baseURI;
             this.login = login;
             this.baseAjaxObj = {
               crossDomain: true,
               beforeSend: function(xhr) {
                 if (login.loginType === LoginTypes.HTTP_BASIC) {
                   return xhr.setRequestHeader("Authorization", "Basic " + login.getBasicAuthLogin());
                 }
                 else if (login.loginType === LoginTypes.OIDC) {
                   xhr.setRequestHeader("Authorization", "Basic " + login.getBasicAuthLogin());
                   return xhr.setRequestHeader("access-token", login.getAccessToken());
                 }
               }
             };
             if (newBaseAjaxObj !== null) {
               $.extend(true, this.baseAjaxObj, newBaseAjaxObj);
             }
           }


           /*
             Sends a request to the given uri with the given method and content data.
             Two callbacks can be passed (the first for a successfull response, the second for error notification).
             The errorCallback is optional.
            */
           /*
            * adaption: set optional mime type, defaults to xml
            */
           RequestSender.prototype.sendRequest = function(method, URI, content, callback, errorCallback, mimeType) {
             var newAjax, requestURI;
             if (this.baseURI !== null) {
               requestURI = encodeURI(this.baseURI + "/" + URI);
             } else {
               requestURI = URI;
             }
             newAjax = {
               url: requestURI,
               method: method.toUpperCase(),
               data: content,
               contentType: mimeType,
               error: function(xhr, errorType, error) {
                 var errorText;
                 errorText = error;
                 if ((xhr.responseText !== null) && xhr.responseText.trim().length > 0) {
                   errorText = xhr.responseText;
                 }
                 if (xhr.status === 0) {
                   errorText = "WebConnector does not respond";
                 }
                 if (errorCallback !== null) {
                   return errorCallback(xhr.status + " " + method + " " + requestURI + "\n" + errorText);
                 }
               },
               success: function(data, status, xhr) {
                 return callback(xhr.responseText);
               }
             };
             $.extend(true, newAjax, this.baseAjaxObj);
             return $.ajax(newAjax);
           };


           /*
             Wrapper method to use sendRequest with a Request object.
            */

           RequestSender.prototype.sendRequestObj = function(requestObj) {
             return this.sendRequest(requestObj.method, requestObj.uri, requestObj.content, requestObj.callback, requestObj.errorCallback, requestObj.mimeType);
           };


           /*
             Sends requests in a given array synchronously (order is maintained, usefull if operations depend on each other's completion).
             When all requests are finished callback is called.
             Basically use pipe chaining of jQuery.
            */

           RequestSender.prototype.sendRequestsSync = function(requestObjArray, callback) {
             var chain, i, k, promise, temp_login, temp_url, _len;
             chain = $.Deferred();
             promise;
             temp_login = this.login;
             temp_url = this.baseURI;
             temp_ajax = this.baseAjaxObj;
             for (i = 0, _len = requestObjArray.length; i < _len; i++) {
               k = requestObjArray[i];
               if (i === 0) {
                 promise = chain;
               }
               promise = promise.pipe(function() {
                 var reqSender;
                 reqSender = new RequestSender(temp_url, temp_login, temp_ajax);//for new valid context
                 return reqSender.sendRequestObj(requestObjArray.shift());
               });
             }
             promise.then(function() {
               return callback();
             });
             return chain.resolveWith(requestObjArray);
           };


           /*
             Sends requests in a given array asynchronously (order is arbitrary).
             When all requests are finished callback is called.
            */

           RequestSender.prototype.sendRequestsAsync = function(requestObjArray, callback) {
             var k, requests, i, _len;
             requests = [];
             for (i = 0, _len = requestObjArray.length; i < _len; i++) {
               k = requestObjArray[i];
               requests.push(this.sendRequestObj(k));
             }
             return $.when.apply(void 0, requests).then(function() {
               return callback();
             });
           };

           return RequestSender;

         })();
       });
     });
   });
   });
 }).call(this);
 /* Base URL of the Cooperation & Defection Service */
 var BaseUrl = "http://127.0.0.1:8080/ocd";
 //var baseUrl = "http://ocd-web-client.duckdns.org:7070/ocd"
 //Server ginkgo from rwth: http://ginkgo.informatik.rwth-aachen.de:8080/ocd

/* API */
var apiJson = i5.las2peer.jsAPI.json;

/*
 * Sends a request using the service api.
 * If an error is returned, the error is displayed.
 */
function sendJsonRequest(method, url, content, callback, errorcallback, mimeType) {

    /* Login */
    var login = new apiJson.Login(api.LoginTypes.OIDC);
    login.setAccessToken(localStorage.getItem('access_token'));
    login.setUserAndPassword(localStorage.getItem("user"), localStorage.getItem("pass"));

    /* Request sender */
    var requestSender = new apiJson.RequestSender(BaseUrl, login);
    /* Request */
    var request = createRequest(method, url, content, callback, errorcallback, mimeType);
    requestSender.sendRequestObj(request);
};


/*
 * Creates a request using the service api.
 * Adds an additional check whether an error xml is returned.
 */
function createRequest(method, url, content, callback, errorcallback, mimeType) {

    return new apiJson.Request(method, url, content, callback,
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
