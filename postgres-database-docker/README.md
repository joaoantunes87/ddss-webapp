# MSI DDSS - Postgresql Database

This code is to be used in the scope of the _DDSS_ course.

**Important:** these sources are merely suggestions of implementations.
You should modify everything you deem as necessary and be responsible for all the content that is delivered.

_The contents of this repository do not replace the proper reading of the assignment description._

## Requirements

- To execute this project it is required to have installed:
  - Docker

## Development

Use, only if you need to have database running in separate. The executables in the root are preparared to start the database and connect it with Web Application.

It could be useful to have it running in separate for the Java example, where it is not possible for you to change code being executed by Docker and access does changes without starting docker components again.

## Database Connection

- **User**: ddss
- **Password**: ddss
- **Database name**: ddss
- **Host**: localhost:5432

## Setup and Run

To build the docker image you should run:

```sh
sh build.sh
```

To run the container:

```sh
sh run.sh
```

- _note: modifying the `run.sh` script to include -dit will make the container work in background. But dont forget to use `stop.sh` to stop/remove it later._

To stop the container:

```sh
sh stop.sh
```
