# Run Elsa Data Stack Local

A quick note on how to run Elsa Data stack on the local.

## Backend

```shell
git clone https://github.com/umccr/elsa-data.git
cd elsa-data/application/backend
```

```shell
bun install
bun run gel project init
bun run gel project info
bun run gel instance list
bun run gel instance status -I backend
bun run gel migration status
bun run gel migrate
bun run gel list types
bun run geltypes
bun run dev:bare
```

```shell
bun run gel ui
```

```shell
bun run gel instance stop
bun run gel instance destroy --force
```

## Frontend

```shell
cd elsa-data/application/frontend
```

```shell
npm i
npm run dev:watch
```

http://localhost:3000/datasets
