CREATE TABLE IF NOT EXISTS oauth_integrations (
  team_id               VARCHAR(9)      UNIQUE NOT NULL,
  team_name             TEXT            NOT NULL,
  token                 TEXT            NOT NULL,
  installer_user_id     TEXT            NOT NULL,
  app_id                TEXT            NOT NULL,
  app_user_id           TEXT            NOT NULL,
  domain                TEXT            DEFAULT NULL,
  created_at            TIMESTAMP       NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (team_id)
);
