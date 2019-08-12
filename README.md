# ddss-webapp
DDSS: Unsecure Web App

# Docker
### Start Web Application
**Note: Port 3000 must not being used**

```sh
docker build -t ddss-webapp .
```

```sh
cd postgres-database-docker && docker build -t ddss-database .
```

```sh
cd postgres-database-docker && docker build -t ddss-database .
```

```sh
cd .. && docker-compose up
```

Go to http://localhost:3000

### Stop Web Application
```sh
docker-compose down
```

### Persistent Database
// TODO Configure Volume
