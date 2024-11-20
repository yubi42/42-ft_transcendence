ENV_FILE = --env-file src/.env
COMPOSE = -f ./src/docker-compose.yml
COMPOSE_CMD = docker compose ${COMPOSE} ${ENV_FILE}

all: 
	@${COMPOSE_CMD} build

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

re:	fclean all

reset:	fclean all
		
.PHONY: all up run down clean fclean re reset