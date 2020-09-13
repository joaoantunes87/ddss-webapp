# JWT REST API DEMO

## Requirements:

- Docker

To execute locally without docker

- Node 12.8+
- Yarn 1.22+
- Postgressql 8+

## Execute with Docker

```sh
./run.sh
```

The server with our REST API was start at http://localhost:3000

## Run locally without docker

### Setup Database

You need to create a local database using postgres-database-docker/init-db-sql.

The database connection data used by default is:

```javascript
const DB_CONNECTION = {
  user: "jwt",
  database: "jwt",
  password: "jwt",
  host: process.env.DB_HOST || "localhost",
  port: 5432,
};
```

### Install dependecies

```sh
yarn install
```

### Start server

```sh
yarn start
```

The server with our REST API was start at http://localhost:3000

## Demo

Use postman or another tool to do http requests:

### Register user

POST localhost:3000/sign-up/

body:

```json
{
  "name": "Joao Antunes",
  "email": "jcfa@dei.uc.pt",
  "password": "123456"
}
```

You should receive as response 204. If so, your user was created.

### Login user

POST localhost:3000/sign-up

body:

```json
{
  "name": "Joao Antunes",
  "email": "jcfa@dei.uc.pt"
}
```

You will receive a token as response, to be used on further requests to prove you are authenticated. The token created will expire in one minute:

Example:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTU5OTk4MTQ3NSwiZXhwIjoxNTk5OTgxNTM1fQ.jjtzVbH4_5TlZltgtR-Zx6ZHRHdyL1mUq3q90sV0d7c"
}
```

### Further request

Add your token to Authorization header while requesting your account details:

GET localhost:3000/me

You should receive something like:

```json
{
  {"name":"Joao Antunes"}
}
```

However if one minute as passed after token has been created you will receive a 401 Unauthorized response.

Try it after token has expired.
