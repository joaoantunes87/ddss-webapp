# ddss-webapp

Repository example of unsecure web applications and solutions for laboratory lectures of Design and Development of Secure Software subject lectured at Masters in Informatics Security by University of Coimbra.

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
cd .. && docker-compose up
```

Go to http://localhost:3000

### Stop Web Application

```sh
docker-compose down
```

### Persistent Database

// TODO Configure Volume
