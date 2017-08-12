CREATE DATABASE IF NOT EXISTS subito;

CREATE TABLE IF NOT EXISTS soup_calendar (
  id              INT UNSIGNED    NOT NULL  AUTO_INCREMENT,
  day             DATE            NOT NULL,
  soup            VARCHAR(500),
  PRIMARY KEY (id)
);

ALTER TABLE soup_calendar AUTO_INCREMENT=1001;

CREATE OR REPLACE VIEW soup_calendar_view AS (
  SELECT day, GROUP_CONCAT(soup ORDER BY soup ASC SEPARATOR ';') as soups
  FROM soup_calendar
  GROUP BY day
);

CREATE TABLE IF NOT EXISTS subscribers (
  id              INT UNSIGNED    NOT NULL  AUTO_INCREMENT,
  slack_user_id   VARCHAR(9)      NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT Sub_Unique UNIQUE (id, slack_user_id)
);

ALTER TABLE subscribers AUTO_INCREMENT=1001;
