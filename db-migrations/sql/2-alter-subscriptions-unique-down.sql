ALTER TABLE `subscribers`
DROP INDEX `Sub_Unique`;

ALTER TABLE `subscribers`
ADD CONSTRAINT `Sub_Unique` UNIQUE (`id`, `slack_user_id`);
