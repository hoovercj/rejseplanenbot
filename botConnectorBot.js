/*-----------------------------------------------------------------------------
A bot for managing a users to-do list.  See the README.md file for usage 
instructions.
-----------------------------------------------------------------------------*/

require('dotenv').config({silent: true});
var restify = require('restify');
var builder = require('botbuilder');
var index = require('./dialogs/index')

// Create bot and add dialogs
var bot = new builder.BotConnectorBot({ 
    appId: process.env.BOT_CONNECTOR_APP_ID, 
    appSecret: process.env.BOT_CONNECTOR_APP_SECRET 
});
bot.add('/', index);

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());

server.get('/echo/:name', function (req, res, next) {
  res.send(req.params);
  return next();
});

server.listen(process.env.port || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});