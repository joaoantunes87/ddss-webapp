FROM library/postgres

ENV POSTGRES_USER jwt
ENV POSTGRES_PASSWORD jwt
ENV POSTGRES_DB jwt

COPY init-db.sql /docker-entrypoint-initdb.d/

EXPOSE 5432