Hack Jack Web
===================

This project is a web server that interprets Jack In The Box receipt codes from POST requests, 
performs web scraping on JackListens.com, and returns a valid code for redemption. 

You can visit the live site [here](https://sheltered-thicket-46039.herokuapp.com/). 

## Running 

```bash
phantomjs hackjacksite.js
```

## Deploying

This can be deployed to heroku with the [phantomjs buildpack](https://github.com/stomita/heroku-buildpack-phantomjs).

```bash
# Create the new heroku app using the buildpack.
heroku create --stack cedar --buildpack http://github.com/stomita/heroku-buildpack-phantomjs.git

# Deploy the app to the heroku site.
git push heroku master
```

## Credits
Much thanks to [Ben Foxall](https://github.com/benfoxall/phantomjs-webserver-example) for his PhantomJS server example code.
And another big thanks to those supporting the [PhantomJS heroku buildpack](https://github.com/stomita/heroku-buildpack-phantomjs).

## About
*Contact - charliea.miller@gmail.com