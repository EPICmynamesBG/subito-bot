# subito-bot
[![Build Status](https://travis-ci.org/EPICmynamesBG/subito-bot.svg?branch=master)](https://travis-ci.org/EPICmynamesBG/subito-bot)

A slash command Slack bot for getting the daily soup selection from Indianapolis' _Subito_

## Usage
```text
/subito - what's on the menu today!
```
[![screnshot1](./assets/screenshots/screenshot_1.png)](./assets/screenshots/screenshot_1.png)

```text
/subito [tomorrow | yesterday | YYYY-MM-DD] - what's on the menu for some other day
```
[![screnshot2](./assets/screenshots/screenshot_2.png)](./assets/screenshots/screenshot_2.png)

## Development

### Requirements

 - mysql
 - node/npm (recommend using nvm)
 
 _Setup_

- `mysql -e "CREATE DATABASE IF NOT EXISTS subito;" -u root -p`
- `mysql -e "CREATE USER '[username]'@'localhost' IDENTIFIED BY '[password]';" -u root -p`
- `mysql -e "GRANT ALL PRIVILEGES ON subito . * TO '[username]'@'localhost';" -u root -p`
- `mysql -D subito < ddl/ddl.sql -u root -p`

_Environment_

While defaults exist, many things (like connecting to a database) will not work unless
you've set up a local environment (.env) file in the project's root directory. Below is an
example/template you should use.
```text
DATABASE_HOST=localhost
DATABASE_USER=subito
DATABASE_PASSWORD=[password]
DATABASE_NAME=subito
PORT=3000
SLACK_SLASH_TOKEN=[token]
SLACK_INTEGRATIONS_APIKEY=[apikey]
SLACK_IMPORTS_APIKEY=[apikey]
SLACK_APP_SECRET=[secret]
SLACK_WEBHOOK_URL=[url]
TEST_DATABASE_HOST=localhost
TEST_DATABASE_USER=test
TEST_DATABASE_PASSWORD=[test password]
TEST_DATABASE_NAME=subito_test
NODE_ENV=development
```

### Testing

_Setup_

- `mysql -e "CREATE DATABASE IF NOT EXISTS subito_test;" -u root -p`
- `mysql -e "CREATE USER 'test'@'localhost' IDENTIFIED BY '[password]';" -u root -p`
- `mysql -e "GRANT ALL PRIVILEGES ON subito_test . * TO 'test'@'localhost';" -u root -p`
- `mysql -D subito_test < ddl/ddl.sql -u root -p`
 
