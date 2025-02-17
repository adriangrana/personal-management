.PHONY: run

run:
	docker compose build
	docker compose up -d 

recreate-front:
	docker compose up -d --force-recreate frontend  

recreate-back:
	docker compose up -d --force-recreate backend  