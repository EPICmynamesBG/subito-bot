ALTER TABLE subscribers
DROP COLUMN search_term;

CREATE OR REPLACE VIEW integration_subscriber_view AS (
  SELECT subscribers.id,
    subscribers.slack_user_id,
    subscribers.slack_username,
    subscribers.slack_team_id,
    team_integrations.team_domain AS slack_team_domain,
    team_integrations.slack_slash_token,
    team_integrations.slack_webhook_url
  FROM subscribers
  INNER JOIN team_integrations ON (subscribers.slack_team_id = team_integrations.team_id)
);
