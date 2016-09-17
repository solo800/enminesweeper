var express = require('express'),
    app = express();

app.use(express.static('.'));

var port = process.env.PORT || 8081;

app.listen(port, function (err) {
    if ('production' !== process.env.NODE_ENV) {
        console.log('Running server on port ' + port);
    }
});

app.use('/', function (req, res) {
    res.render('index');
});
