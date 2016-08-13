const SpotifyControl = require('./index.js');

var spotify = new SpotifyControl({
    token: "YOUR_SPOTIFY_TOKEN"
});

spotify.connect().then(client => {
    console.log("Started");
    spotify.play("spotify:track:4LYt31Tg51qsQqWOaZn4C6", "spotify:artist:5byg90wTxATnhB6kK253DF").then(v => {
        console.log("Played");
        spotify.startListener(["play", "pause"]).on("event", data => {
            console.log(JSON.stringify(data, null, 4));
        });
        setTimeout(function() {
            spotify.pause(true);
        }, 3000);
        setTimeout(function() {
            spotify.pause(false);
        }, 6000);
    }, err => {
        console.error(err);
    });
}, err => {
    console.error("Failed to start: " + err.message);
})
