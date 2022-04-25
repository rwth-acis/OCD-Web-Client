FROM alpine:3.14
COPY . /usr/src/webocdclient
WORKDIR /usr/src/webocdclient
RUN apk update && apk add bash
RUN apk add --update nodejs npm
RUN npm install
EXPOSE 8090
CMD ["node_modules/.bin/http-server", "-p 8090"]