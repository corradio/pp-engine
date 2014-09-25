VERSION=0.1
TAG=pp-engine
REGISTRY=registry.corp.snips.net:5000
DOCKER_SERVER=dev3.corp.snips.net:4243
DOCKER=docker -H $(DOCKER_SERVER)

ENV=-e MONGODB_HOST=dev2.corp.snips.net

.PHONY: build push run shell

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
		-i "$(REGISTRY)/$(TAG):$(VERSION)" zsh

## MAESTRO
MAESTRO=python -u -m maestro -f ../infrastructure/maestro_config.yaml

.PHONY: deploy logs follow status stop start

deploy: stop start

logs:
	$(MAESTRO) logs $(TAG)

follow:
	$(MAESTRO) logs -F $(TAG)

status:
	$(MAESTRO) status $(TAG)

stop:
	$(MAESTRO) stop $(TAG)

start:
	$(MAESTRO) start -r $(TAG)

publish: build push deploy
