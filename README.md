# Purpose
This package handles the communication to a Spotify client, allowing you to play,
pause and watch events such as play, pause and next track.

This is possible because the Spotify is a webserver that can be controlled using
http requests. You can see more details [here](https://medium.com/@bengreenier/hijacking-spotify-web-control-5014b0a1a360#.2iwgihgsz).

# Install
```
npm install --save spotify-control
```
# Example

```javascript
const SpotifyControl = require('spotify-control');

var spotify = new SpotifyControl({
    token: "YOUR_SPOTIFY_TOKEN"
});

spotify.connect().then(v => {
    console.log("Started");
    spotify.play("spotify:track:4LYt31Tg51qsQqWOaZn4C6", "spotify:artist:5byg90wTxATnhB6kK253DF").then(v => {
        console.log("Played");
        spotify.startListener(["play", "pause"]).on("event", data => {
            console.log(JSON.stringify(data, null, 4));
        });
    }, err => {
        console.error(err);
    });
}, err => {
    console.error("Failed to start: " + err.message);
})
```

# Getting the Token
You can get your token by visiting https://open.spotify.com/token on your web browser,
assuming you are logged-in.

```
{
    "t": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXX"
}
```

I haven't tested if normal OAuth tokens from applications work in this context.
Possibly, the scope in question is `streaming`
([list of scopes](https://developer.spotify.com/web-api/using-scopes/#list-of-scopes)), which
_"is currently only available to Spotify native SDKs"_

# Issues
If you find a problem, fell free to submit it at https://github.com/Windsdon/spotify-control/issues
or make a pull request.

# Reference

## **SpotifyControl(options)** _constructor_
`options`: object
```javascript
{
    token: String, // required
    url: String || "https://127.0.0.1",
    port: Number || null,
    csrf: String || null
}
```

If not given, port and csrf are gathered on `.connect()`.

Be sure url starts with `https://`

## `Promise` **spotify.connect()**
Finds the port from range 4370-4380 by testing the connection, and then
gets the CSRF token. The Promise is resolved when it successfully connects
and is ready for commands, and rejects when it fails.

## `Promise` **spotify.play(uri, _[context]_)**
Plays a track. URI can be a playlist, track, album or artist.
If no context is given, uri is used (it will be a playlist with a single song).

The Promise resolves with an object, which looks something like
```javascript
{
    "version": 9,
    "client_version": "1.0.34.146.g28f9eda2",
    "playing": true,
    "shuffle": false,
    "repeat": false,
    "play_enabled": true,
    "prev_enabled": true,
    "next_enabled": true,
    "track": {
      "track_resource": {
        "name": "Tomorrow",
        "uri": "spotify:track:4LYt31Tg51qsQqWOaZn4C6",
        "location": {
          "og": "https://open.spotify.com/track/4LYt31Tg51qsQqWOaZn4C6"
        }
      },
      "artist_resource": {
        "name": "Fight The Fade",
        "uri": "spotify:artist:5byg90wTxATnhB6kK253DF",
        "location": {
          "og": "https://open.spotify.com/artist/5byg90wTxATnhB6kK253DF"
        }
      },
      "album_resource": {
        "name": "What We Know",
        "uri": "spotify:album:02boXTIOEJOhGMzVDEKoXp",
        "location": {
          "og": "https://open.spotify.com/album/02boXTIOEJOhGMzVDEKoXp"
        }
      },
      "length": 263,
      "track_type": "normal"
    },
    "context": {
    },
    "playing_position": 0.004,
    "server_time": 1471121694,
    "volume": 1,
    "online": true,
    "open_graph_state": {
      "private_session": false,
      "posting_disabled": true
    },
    "running": true
}
```

Formats:
* `spotify:track:_id_`
* `spotify:artist:_id_`
* `spotify:album:_id_`
* `spotify:user:_user_:playlist:_id_`

You can get this URI by right-clicking most things:

![Context Menu](http://i.imgur.com/kFIcVXl.png)

## `Promise` **spotify.status(_[returnOn, returnAfter]_)**

The Promise resolves with an object similar to the one from `.play()`

`returnOn`: Array or String

The list of events that trigger an event. The ones I know of are login,logout,play,pause,error,ap

`returnAfter`: Number

Number of seconds until it finishes the request. This is part of the
API, and needs to be present if returnOn is present.

## `Promise` **spotify.pause(status)**

Pauses or resumes playback

`status`: Boolean

true for paused, false for playing

## `self` **spotify.startListener(returnOn, returnAfter)**

The same as `.status(returnOn, returnAfter)`, but called on a loop
until `.stopListener()` is called. Emits an event named `event` every time
something happens or the timeout is over.

## **spotify.stopListener()**

Stops the listener loop.

## `Promise` **spotify.request(path, qs _[, port]_)**

Make a custom call. The Promise resolves with a JSON-parsed object.
