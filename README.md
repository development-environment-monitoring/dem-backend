# DEM Backend

## Rodar o projeto

- Desenvolvimento: `npm run start:dev`
- Produção local: `npm run build && npm run start:prod`

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
