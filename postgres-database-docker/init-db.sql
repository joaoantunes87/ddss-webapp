DROP TABLE IF EXISTS ddss_user;
CREATE TABLE ddss_user(
   email VARCHAR (50) PRIMARY KEY,
   password VARCHAR (50) NOT NULL,
   name VARCHAR (50) NOT NULL
);

DROP TABLE IF EXISTS user_session;
CREATE TABLE user_session(
   session_id VARCHAR (50) PRIMARY KEY,
   user_email VARCHAR (50) UNIQUE
);

DROP TABLE IF EXISTS payment;
CREATE TABLE payment(
   payment_id SERIAL PRIMARY KEY,
   user_email VARCHAR (50),
   card_number VARCHAR (50),
   validity VARCHAR (5),
   security_code VARCHAR (3)
);
