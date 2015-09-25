VERSION=0.1
TAG=pp-engine
REGISTRY=registry.corp.snips.net:5000
DOCKER_SERVER=dev3.corp.snips.net:4243
DOCKER=docker -H $(DOCKER_SERVER)

ENV=-e MONGODB_HOST=dev3.corp.snips.net

.PHONY: build push run shell

install:
	npm install
	cd frontend && npm install && bower install

server:
	MONGODB_HOST=dev3.corp.snips.net PRIVATE_MONGODB_HOST=prod2.corp.snips.net node server

build:
	cd frontend && gulp build
	$(DOCKER) build -t "$(REGISTRY)/$(TAG):$(VERSION)" .

push:
	$(DOCKER) push "$(REGISTRY)/$(TAG):$(VERSION)"

run:
	$(DOCKER) run -t \
	    -i "$(REGISTRY)/$(TAG):$(VERSION)"
shell:
	$(DOCKER) run -t \
		$(ENV) \
		-v /home/shared/pois/:/opt/data \
		-i "$(REGISTRY)/$(TAG):$(VERSION)" sh

.PHONY: deploy logs follow status stop start

deploy: 
	sky service restart $(TAG)

publish: build push deploy
