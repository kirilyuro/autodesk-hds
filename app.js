var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // only provide error in development
    var error = { message: err.message };

    if (req.app.get('env') === 'development') {
        error.status = err.status;
        error.stack = err.stack;
    }

    // render the error page
    res.status(err.status || 500);
    res.json(error);
});

module.exports = app;
