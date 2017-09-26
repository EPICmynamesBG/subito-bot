ALTER TABLE subscribers
DROP FOREIGN KEY `fk_team_id`;

ALTER TABLE subscribers MODIFY `slack_team_id` VARCHAR(9) DEFAULT NULL;

ALTER TABLE subscribers
ADD slack_team_domain VARCHAR(100) NULL DEFAULT NULL;
