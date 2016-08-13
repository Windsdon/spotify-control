'use strict';
const EventEmitter = require('events');
const async = require('async');
const extend = require('extend');
var r = require('request').defaults({
    rejectUnauthorized: false,
    method: "GET",
    headers: {
        Origin: "https://embed.spotify.com",
        Referer: "https://embed.spotify.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
    }
});

module.exports = class SpotifyControl extends EventEmitter {
    constructor(options) {
        super();
        this.url = options.url || "https://127.0.0.1";
        this.port = options.port || null;
        this.csrf = options.csrf || null;
        this.token = options.token;
        this.qs = {
            ref: "https://open.spotify.com"
        };

        if(!this.token) {
            throw new Error("No OAuth token provided");
        }
    }

    connect() {
        var self = this;
        return new Promise((resolve, reject) => {
            if(!self.port) {
                self.findPort().then(step1, reject);
            } else {
                // make sure it's async
                setTimeout(function() {
                    step1(self.port)
                }, 1);
            }

            function step1(port) {
                self.port = port;
                if(!self.csrf) {
                    self.getCSRF().then(step2, reject);
                } else {
                    step2(self.csrf);
                }
            }

            function step2(csrf) {
                self.csrf = csrf;
                // we are all set!
                resolve(self);
            }
        });
    }

    startListener(events, after) {
        var self = this;
        if(events && typeof(events) != "string" && typeof(events.join) == "function") {
            events = events.join(",");
        }
        this.listenerRunning = true;
        async.whilst(() => self.listenerRunning, (callback) => {
            self.status(events, after || 60).then(data => {
                self.emit("event", data);
                callback();
            }, callback);
        });
        return this;
    }

    stopListener() {
        this.listenerRunning = false;
    }

    play(uri, context) {
        return this.request("/remote/play.json", {
            uri: uri,
            context: context || uri
        });
    }

    pause(status) {
        return this.request("/remote/pause.json", {
            pause: status
        });
    }

    status(returnOn, returnAfter) {
        if(returnOn && typeof(returnOn) != "string" && typeof(returnOn.join) == "function") {
            returnOn = returnOn.join(",");
        }

        return this.request("/remote/status.json", {
            returnon: returnOn,
            returnafter: returnAfter
        });
    }

    request(path, qs, port) {
        extend(true, qs, this._qs, {
            oauth: this.token,
            csrf: this.csrf
        });
        var p = port | this.port;
        var url = `${this.url}:${p}${path}`;
        return new Promise((resolve, reject) => {
            r({
                url: url,
                qs: qs
            }, (err, res, body) => {
                if(err) {
                    return reject(err);
                }
                try {
                    var b = JSON.parse(body);
                    if(b.error) {
                        return reject(b);
                    }
                    resolve(b);
                } catch(e) {
                    reject(e);
                }
            });
        });
    }

    findPort() {
        var self = this;
        var start = 4370;
        var end = 4380;
        return new Promise((resolve, reject) => {
            var current = start;
            var found = false;
            async.whilst(function() {
                var q = (!found && current <= end);
                return q;
            }, (cb) => {
                self.request("/simplecsrf/token.json", {}, current).then(() => {
                    found = true;
                    resolve(current);
                    cb();
                }, () => {
                    current++;
                    if(current > end) {
                        reject(new Error("Can't find Spotify server port"));
                    }
                    cb();
                });
            });
        })
    }

    getCSRF() {
        var self = this;
        return new Promise((resolve, reject) => {
            self.request("/simplecsrf/token.json", {}).then((data) => {
                resolve(data.token);
            }, reject);
        });
    }
}
