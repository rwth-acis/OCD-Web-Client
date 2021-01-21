function signinCallback(result) {
    if(result === "success"){
        $.session.set('accessToken', window.localStorage["access_token"]);
        sendRequest("get", "validate", "",
            /* Response handler. Login succeeded */
            function (data) {
                /* Login Succeeded */
                $.session.set('isLoggedIn', new Boolean(true));
                if(localStorage.getItem("redirect_relogin") !== null)
                {
                    window.location.replace(localStorage.getItem("redirect_relogin"));
                    localStorage.removeItem("redirect_relogin");
                } else {
                    window.location.replace("index.html");
                }
            },
            /* Error handler. Login failed (possibly also due to technical reasons) */
            function(data) {
                showErrorMessage("Login is invalid!");
            });
    } else {
        /* DEBUG */
        /*$.session.set('isLoggedIn', new Boolean(true));
        window.location.replace("index.html");*/
        /* DEBUG */
        // if sign in was not successful, log the cause of the error on the console
        console.log(result);
    }
}
