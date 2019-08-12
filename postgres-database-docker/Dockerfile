FROM library/postgres

ENV POSTGRES_USER ddss
ENV POSTGRES_PASSWORD ddss
ENV POSTGRES_DB ddss

COPY init-db.sql /docker-entrypoint-initdb.d/

EXPOSE 5432