# Docker 1.1.2
FROM ubuntu:14.04
MAINTAINER Pierre Merienne <pierre.merienne@gmail.com>

# Install node.js and git 
RUN apt-get update  --yes
RUN apt-get install --yes --force-yes nodejs npm git git-core
RUN ln -s /usr/bin/nodejs /usr/bin/node

# Install forever (A simple CLI tool for ensuring that a given script runs continuously)
RUN npm install forever -g

# Download web-app
ADD . /opt/pp-engine
RUN cd /opt/pp-engine && npm install
RUN ln -s /opt/pp-engine/rankings.json /rankings.json

# Start web-app
EXPOSE 3000
WORKDIR /opt/pp-engine
CMD forever /opt/pp-engine/server.js


