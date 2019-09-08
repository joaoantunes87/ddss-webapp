/* schema */
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

/* seeds */
INSERT INTO ddss_user
VALUES ('jcfa@dei.pt', '123456', 'João');

INSERT INTO ddss_user
VALUES ('jcfa+2@dei.pt', '123456', 'João 002');

INSERT INTO payment (user_email, card_number, validity, security_code)
VALUES ('jcfa@dei.pt', '4444 3333 2222 1111', '05/22', '123');

INSERT INTO payment (user_email, card_number, validity, security_code)
VALUES ('jcfa+2@dei.pt', '9999 8888 7777 6666', '12/22', '987');