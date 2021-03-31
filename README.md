# OCD-Web-Client
This repository contains the code of the web client for the OCD service.

# Quick Set-Up Guide
### Client Configuration at Learning Layers
To set up the Learning layers OIDC login, either use an existing Learning Layers client or register your own at https://api.learning-layers.eu/o/oauth2/.
At login, Learning Layers has to be able to refer back to your client with the following configurations:
* The web clients login page has to be mentioned as a _Redirect URI_
* The _Grant Type_ must be implicit and the _Scope_ has to include openid, email and profile
* The _Response Type_ has to only be a token

### Adjusting the Files
You will then have to change the _data-clientid_ field to your client id from Learning Layers and the _data-redirecturi_ field to your web clients address. This has to be done in both
* login.html
* JS/contentHandler.js

Finally, change the values of _baseUrl_ to the services address in the following files so that requests are addressed to it:
* JS/requestHandler.js
* JS/simulation/requestHandler.js
* JS/simulation/jsonRequestHandler.js

Now, the web client should be able to communicate with the OCD service.
