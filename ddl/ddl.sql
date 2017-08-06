CREATE TABLE IF NOT EXISTS Subscribers (
  id              INT UNSIGNED    NOT NULL  AUTO_INCREMENT=1001,
  slack_user_id   VARCHAR(9)      NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT Sub_Unique UNIQUE (id, slack_user_id)
);
