ALTER TABLE subscribers
DROP COLUMN slack_team_domain;

ALTER TABLE subscribers MODIFY `slack_team_id` VARCHAR(9) NOT NULL;

ALTER TABLE subscribers
ADD CONSTRAINT `fk_team_id`
FOREIGN KEY (slack_team_id) REFERENCES team_integrations(team_id)
ON UPDATE CASCADE ON DELETE CASCADE;
