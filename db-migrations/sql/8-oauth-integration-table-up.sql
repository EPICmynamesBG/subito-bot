CREATE TABLE IF NOT EXISTS oauth_integrations (
  team_id               VARCHAR(9)      UNIQUE NOT NULL,
  team_name             TEXT            NOT NULL,
  token                 TEXT            NOT NULL,
  bot_token             TEXT            NOT NULL,
  scope                 TEXT            NOT NULL,
  installer_user_id     TEXT            NOT NULL,
  domain                TEXT            DEFAULT NULL,
  webhook_url           TEXT            DEFAULT NULL,
  webhook_channel       TEXT            DEFAULT NULL,
  webhook_config_url    TEXT            DEFAULT NULL,
  created_at            TIMESTAMP       NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (team_id)
);
