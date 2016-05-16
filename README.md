# Transit Bot
A bot for getting transit information using a natural language interface. It can currently be tested at http://www.codyhoover.com/projects/transitbot

## Transit Sources
Transit Bot can use Google or a Danish service called Rejseplanen to get transit directions between two places. The default is Google, but you can pick which service to use by sending a message that contains the words "google" or "rejseplanen". The bot will confirm your selection and then you can ask for directions.

## Getting Directions
The bot interprets messages using a Microsoft service for processing natural language called [Luis](http://luis.ai). The model hasn't been extensively trained, yet, but it can handle queries such as "How can I get from Vesteport Station to Borups Alle 12, Frederiksberg?"

The more the model is used, the better it will get. So give it a try!

## Areas to improve?
* Making the bot available on Skype, Facebook Messenger, and Slack.
* Improving the capabilities of the model to better respond to queries for basic directions.
* Allowing the bot to find specific modes of transport
* Allowing the bot to search for a certain time (in 10 minutes, at 5, etc.)