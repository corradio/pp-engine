# Docker 1.1.2
FROM ubuntu:14.04
MAINTAINER Pierre Merienne <pierre.merienne@gmail.com>
EXPOSE 8080

# Install node.js and git 
RUN apt-get update  --yes
RUN apt-get install --yes --force-yes nodejs npm git git-core
RUN ln -s /usr/bin/nodejs /usr/bin/node

# Install forever (A simple CLI tool for ensuring that a given script runs continuously)
RUN npm install forever -g

# Download web-app
# RUN git clone git@github.com:tristandeleu/pp-engine.git
RUN mkdir -p /opt/pp-engine/
ADD server.js /opt/pp-engine/server.js

# Start web-app
CMD forever /opt/pp-engine/server.js


