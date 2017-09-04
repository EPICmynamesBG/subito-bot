# subito-bot
[![Build Status](https://travis-ci.org/EPICmynamesBG/subito-bot.svg?branch=master)](https://travis-ci.org/EPICmynamesBG/subito-bot)
[![Swagger Status](http://online.swagger.io/validator?url=http://dev.brandongroff.com:8080/subito/swagger)](http://online.swagger.io/validator?url=http://dev.brandongroff.com:8080/subito/swagger)


A slash command Slack bot for getting the daily soup selection from Indianapolis' [_Subito_](http://www.subitosoups.com/)

## Usage
```text
/subito - what's on the menu today!
```
<img src="./assets/screenshots/screenshot_1.png" height="120" alt="screenshot_1" />

```text
/subito [today | tomorrow | yesterday | YYYY-MM-DD] - what's on the menu for some day

OR

/subito day [today | tomorrow | yesterday | YYYY-MM-DD]
```
<img src="./assets/screenshots/screenshot_2.png" height="60" alt="screenshot_2" />

```text
/subito subscribe
```
<img src="./assets/screenshots/subscribe_1.png" height="60" alt="subscribe_1" />
<img src="./assets/screenshots/subscribe_2.png" height="60" alt="subscribe_2" />

```text
/subito unsubscribe
```
<img src="./assets/screenshots/unsubscribe.png" height="60" alt="unsubscribe" />

_In Development Commands_
```text
/subito search [soup name/type (ex: gouda)]
```

## Docs

[Localhost Docs](http://localhost:3000/docs)

[Online Docs](http://dev.brandongroff.com:8080/docs)

## Development

### Requirements

 - mysql
 - node/npm (recommend using nvm)
 
#### Setup

- `mysql -e "CREATE DATABASE IF NOT EXISTS subito;" -u root -p`
- `mysql -e "CREATE USER '[username]'@'localhost' IDENTIFIED BY '[password]';" -u root -p`
- `mysql -e "GRANT ALL PRIVILEGES ON subito . * TO '[username]'@'localhost';" -u root -p`
- `mysql -D subito < ddl/ddl.sql -u root -p`

#### Environment

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
TEST_CONSOLE_LOGGING=true
LOGGING_LEVEL=debug
NODE_ENV=development
```

#### Database Changes

Database changes should be added in the `db-migrations/sql` folder. File names should be something like `[migration id]-[hyphen case description]-[up | down].sql`, with a corresponding up and down file. 

Migrations can be ran via `npm run migrate-up:[local | test]`. This command will process and run _all_ up migrations.
`npm run migrate-down:[local | test]` will run _only the last_ migration down script, so undoing a migration will happen one at a time.

### Testing

#### Setup

- `mysql -e "CREATE DATABASE IF NOT EXISTS subito_test;" -u root -p`
- `mysql -e "CREATE USER 'test'@'localhost' IDENTIFIED BY '[password]';" -u root -p`
- `mysql -e "GRANT ALL PRIVILEGES ON subito_test . * TO 'test'@'localhost';" -u root -p`
- `mysql -D subito_test < ddl/ddl.sql -u root -p`
 
