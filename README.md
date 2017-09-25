Hack Jack Web
===================

This project is a web server that interprets Jack In The Box receipt codes from POST requests, performs web scraping on JackListens.com, and returns a valid code for redemption. 

## Running

	Cite whoever I got this from

```bash
phantomjs hackjacksite.js
```

## Deploying

This can be deployed to heroku with the [phantomjs buildpack](https://github.com/stomita/heroku-buildpack-phantomjs).

```bash
# create a new heroku app
heroku create --stack cedar --buildpack http://github.com/stomita/heroku-buildpack-phantomjs.git

# deploy
git push heroku master
```

## About
*Contact - charliea.miller@gmail.com