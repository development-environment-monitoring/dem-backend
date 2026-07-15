# DEM Backend

## Rodar o projeto

- Desenvolvimento: `npm run start:dev`
- Produção local: `npm run build && npm run start:prod`

## Banco de dados

Defina `DB_TYPE` para alternar entre os bancos:

- `DB_TYPE=sqlite` usa SQLite
- `DB_TYPE=postgres` usa PostgreSQL

Variáveis adicionais para PostgreSQL:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSL=true` para habilitar SSL

Exemplo com SQLite:

- `DB_TYPE=sqlite DB_NAME=dem.sqlite npm run start:dev`

Exemplo com PostgreSQL:

- `DB_TYPE=postgres DB_HOST=localhost DB_PORT=5432 DB_USER=postgres DB_PASSWORD=postgres DB_NAME=dem npm run start:dev`

## Rodar os testes

- Testes unitários: `npm test`
- Modo watch: `npm run test:watch`
- Coverage: `npm run test:cov`

## Docker

### Build da imagem

- `docker build -t dem-backend .`

### Rodar o container

- `docker run -p 3026:3026 --name dem-backend dem-backend`

A aplicação expõe a porta `3026` e usa o arquivo SQLite em `/app/data/dem.sqlite` dentro do container.
