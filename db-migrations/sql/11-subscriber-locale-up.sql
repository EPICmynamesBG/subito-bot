ALTER TABLE subscribers
ADD COLUMN `notify_time` TIME DEFAULT '10:00:00';

CREATE OR REPLACE VIEW integration_subscriber_view AS (
  SELECT subscribers.id,
    subscribers.slack_user_id,
    subscribers.slack_username,
    subscribers.slack_team_id,
    subscribers.search_term,
    subscribers.notify_time,
    oauth_integrations.domain AS slack_team_domain,
    oauth_integrations.bot_token AS slack_slash_token,
    oauth_integrations.webhook_url AS slack_webhook_url
  FROM subscribers
  INNER JOIN oauth_integrations ON (subscribers.slack_team_id = oauth_integrations.team_id)
);
