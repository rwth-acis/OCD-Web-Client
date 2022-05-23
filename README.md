# OCD-Web-Client
This repository contains the code of the web client for the OCD service at https://github.com/rwth-acis/REST-OCD-Services. As the WebClient only acts as the UI of WebOCD, you will need to have an instance of the service running as well.

# Quick Set-Up Guide
### Client Configuration at Learning Layers
To set up the Learning layers OIDC login, either use an existing Learning Layers client or register your own at https://auth.las2peer.org/auth/realms/main/account/ (You'll need a learning layers Account).
The client at learning Layers has to have the following configurations:
* The web clients login page has to be mentioned as a _Redirect URI_
* The _Access Type_ should be public and you should use _Implicit Flow_
* You need to have your clients' origin, e.g. ``http://localhost:<your-port>``, and ``https://api.learning-layers.eu/*`` as an allowed _Web Origin_ (Lazy People can just use ``*`` to allow any). Keep in mind that it needs to be the **exact** origin, an extra ``/`` may for example lead to a CORS policy block.

### Adjusting the Files
You will then have to change the _data-clientid_ field to your client id from Learning Layers and the _data-redirecturi_ field to your web clients address (usually something like ``http://localhost:<your-port>``). This has to be done in both.
* login.html
* JS/contentHandler.js

Finally, change the values of _baseUrl_ to the [services](https://github.com/rwth-acis/REST-OCD-Services) address in the following files so that requests are addressed to it:
* JS/requestHandler.js
* JS/simulation/requestHandler.js
* JS/simulation/jsonRequestHandler.js

Finally, dont forget to run ``npm install`` to get all the needed packages. 

You can then for example use the http-server package dependency of the web client to have the server running: Do ``./node_modules/.bin/http-server -p <your-port>`` (or ``npx http-server -p <your-port>``) from the root directory of the project and optionally add ``-c-1`` to disable caching. Now, the web client should be able to communicate with the OCD service and be reachable under ``http://localhost:<your-port>``.
