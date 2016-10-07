var GitWebHook = require("../");

GitWebHook.set('scripts', `${__dirname}/scripts`);

var hook = GitWebHook.newHook('/test');

hook.on('push/master', function() {
    console.log('got push on master')
});

hook.on('push/deploy', function() {
    console.log("got push to deploy branch!");

    GitWebHook.script('test.sh').on('success', function() {
        console.log("successfully completed the test.sh")
    });
});

GitWebHook.start();