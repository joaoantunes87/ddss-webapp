/* schema */
DROP TABLE IF EXISTS ddss_user;
CREATE TABLE ddss_user(
   user_id SERIAL PRIMARY KEY,
   email VARCHAR (50) NOT NULL,
   name VARCHAR (50) NOT NULL,
   hashed_password VARCHAR (512) NOT NULL,
   salt VARCHAR (512) NOT NULL
);