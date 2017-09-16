CREATE TABLE IF NOT EXISTS team_integrations (
  team_id               VARCHAR(9)      UNIQUE NOT NULL,
  team_domain           VARCHAR(100)    NOT NULL,
  created_at            TIMESTAMP       DEFAULT current_timestamp,
  slack_slash_token     TEXT            NOT NULL,
  slack_webhook_url     TEXT            NOT NULL,
  metadata              TEXT            DEFAULT NULL,
  PRIMARY KEY (team_id),
  CONSTRAINT Sub_Unique UNIQUE (team_domain)
);
