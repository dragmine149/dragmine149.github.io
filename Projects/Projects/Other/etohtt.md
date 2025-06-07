# !c Eternal Towers of Hell ~~Tower~~ Badge Tracker
This is a project allowing players of the roblox game [EToH](https://www.roblox.com/games/8562822414/Eternal-Towers-of-Hell) to track their progress of the badges they have completed outside of the game.

The site can be visited here: https://dragmine149.github.io/ETOH/

If you want an example user, then use me (i play this game a lot): https://dragmine149.github.io/ETOH/?user=dragmine149

## Information
This project explains itself here: https://dragmine149.github.io/ETOH/info.html. However to sum it up, the one i've based this off: https://jtoh.info hasn't been updated in a while (a year) and more often that not, fails for some reason. (Within all my local
testing... It has not failed once with my system). Hence what led me to spend 2 months creating this.

The website should run itself, i'll get notified of tower updates via github (email of runs failing) and friends.

## How does it work?
Upon loading a user...
- Check the local database (dexie) for user data
- If we have user data, load the user from storage.
- If we don't have user data, send a request to `https://roblox-proxy.dragmine149.workers.dev/user/` in order to get user data.
- (no data in database), send another request to `https://roblox-proxy.dragmine149.workers.dev/{user_id}/earilest/` in order to see if the user has actually played the game.
- Load the UI
- Update the UI based on data from database
- Send another request to `https://roblox-proxy.dragmine149.workers.dev/badges/{user_id}/all` in order to get aall the badges the user has yet to completed.
- Store the data

And then everything is done via javascript. The only other time data is sent to the server is to update the badges or to get a new user.
