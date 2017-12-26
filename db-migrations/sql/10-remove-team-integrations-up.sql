ALTER TABLE subscribers
DROP FOREIGN KEY `fk_team_id`;

ALTER TABLE subscribers
DROP INDEX `fk_team_id`;

ALTER TABLE subscribers
ADD CONSTRAINT `fk_oauth_team_id`
FOREIGN KEY (`slack_team_id`) REFERENCES oauth_integrations(`team_id`)
ON UPDATE CASCADE ON DELETE CASCADE;

DROP TABLE team_integrations;
