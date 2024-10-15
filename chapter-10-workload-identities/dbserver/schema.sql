/* Create the trivial database table */
CREATE TABLE products (
  id      VARCHAR(40)   PRIMARY KEY,
  name    VARCHAR(128)  NOT NULL
);

INSERT INTO products(id, name) 
VALUES
  ('f2d15608-7d48-11ed-9a61-0242ac1b0002', 'product one'),
  ('0636ffae-7d49-11ed-9a61-0242ac1b0002', 'product two');

/* Enable the dbclient test pod to connect using mTLS */
CREATE USER dbclient;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO dbclient;

/* Enable the products API to connect using mTLS */
CREATE USER demoapi;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO demoapi;
