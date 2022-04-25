# OCD-Web-Client
This repository contains the code of the web client for the OCD service at https://github.com/rwth-acis/REST-OCD-Services

# Quick Set-Up Guide
### Client Configuration at Learning Layers
To set up the Learning layers OIDC login, either use an existing Learning Layers client or register your own at https://api.learning-layers.eu/auth/realms/main/account/ (You'll need a learning layers Account).
The client at learning Layers has to have the following configurations:
* The web clients login page has to be mentioned as a _Redirect URI_
* The _Access Type_ should be public and you should use _Implicit Flow_
* You need to have your clients' origin, e.g. ``http://localhost:8090``, as an allowed _Web Origin_ (Lazy People can just use ``*`` to allow any). Keep in mind that it needs to be the **exact** origin, an extra ``/`` may for example lead to a CORS policy block.

### Adjusting the Files
You will then have to change the _data-clientid_ field to your client id from Learning Layers and the _data-redirecturi_ field to your web clients address. This has to be done in both.
* login.html
* JS/contentHandler.js

Finally, change the values of _baseUrl_ to the services address in the following files so that requests are addressed to it:
* JS/requestHandler.js
* JS/simulation/requestHandler.js
* JS/simulation/jsonRequestHandler.js

Now, the web client should be able to communicate with the OCD service.

# Quickstart with a Docker Container
To build a docker image for the OCD-Web-Client that connects to the WebOCD Service running locally with the default parameters, you can navigate to the OCD-Web-Client directory and execute 
```
docker build -t <image_name> .
```

To run a docker container interactively, based on the above created image that connects to the default address of ``http://localhost:8090`` you can execute

```
docker run -it -p 8090:8090 <image_name> 
```

Now you should be able to navigate to ``http://localhost:8090``, log in with your Learning Layers account, and start using the WebClient with your locally running WebOCD Service instance. 