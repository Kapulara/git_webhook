"use strict";

var express = require('express');
var bodyParser = require('body-parser')
var fs = require('fs');
var _ = require("underscore");
var Promise = require('bluebird')
const EventEmitter = require('events');
const spawn = require('child_process').spawn;

class myevents extends EventEmitter {};

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.post("/", function(req, res) {
//     WebHook.handle(req.body);
// res.status(200).end();
// });

var WebHook = {
    events: new myevents(),

    data: {
        routes: {}
    },

    set: function(key, value) {
        this.data[key] = value;
    },

    start: function(port) {
        port = port || 3223;
        app.listen(port, function() {
            console.log("Listening on port: ", port)
        });

        this.script('test.sh')
    },

    handle: function(evt, body) {
        let link = `push/${body.ref.replace('refs/heads/', '')}`;
        evt.emit(link, body);
        evt.emit('push', body);
    },

    getScripts: function() {
        // console.log(fs.readdirSync(this.data["scripts"]))
        return fs.readdirSync(this.data["scripts"])
    },

    newHook: function(name) {
        var evt = new myevents();
        var self = this;

        this.data.routes[name] = evt;
        app.post(name, function(req, res) {
            if(self.data.routes[name] !== undefined) {
                self.handle(evt, req.body)
                res.status(200).end()
                return;
            }
            res.status(501).end()
        });

        return evt;
    },

    script: function(script) {
        var scripts = this.getScripts();
        if(scripts.indexOf(script) > -1) {
            var evts = new myevents();
            var sh = spawn('sh', [this.data['scripts']+"/"+script])

            sh.on('close', function(code) {
                evts.emit('close', code);

                if(code == 0) {
                    evts.emit('success', code);
                } else {
                    evts.emit('error', code);
                }
            });

            sh.stdout.on('data', (data) => {
                evts.emit('out', data);
            });

            sh.stderr.on('data', (data) => {
                evts.emit('out/err', data);
            });

            return evts;
        }
    },

    on: function() { this.events.on(...arguments); },
    emit: function() { this.events.emit(...arguments); }
};

module.exports = WebHook;