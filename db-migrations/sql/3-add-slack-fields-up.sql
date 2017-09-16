ALTER TABLE subscribers
ADD slack_team_id VARCHAR(9) NULL DEFAULT NULL;

ALTER TABLE subscribers
ADD slack_team_domain VARCHAR(100) NULL DEFAULT NULL;
