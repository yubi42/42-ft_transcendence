ENV_FILE = --env-file src/.env
COMPOSE = -f ./src/docker-compose.yml
COMPOSE_CMD = docker compose ${COMPOSE} ${ENV_FILE}

all: 
	@${COMPOSE_CMD} build --no-cache
	mkdir -p /home/${USER}/data/lobby_db

up:
	@${COMPOSE_CMD} up || true

run: all up

down:
	@${COMPOSE_CMD} down

clean: down
	docker system prune -f

fclean:
	@${COMPOSE_CMD} down -v
	docker system prune -f --volumes

re:	fclean run

fclean-local: fclean
	sudo rm -rf /home/${USER}/data/lobby_db

fclean-local-run: fclean-local run

		
.PHONY: all up run down clean fclean re reset