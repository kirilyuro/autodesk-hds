const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const testRouter = require('./routes/test');
const healthRouter = require('./routes/health');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/test', testRouter);
app.use('/health', healthRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
    // only provide error in development
    const error = { message: err.message };

    if (req.app.get('env') === 'development') {
        error.status = err.status;
        error.stack = err.stack;
    }

    // render the error page
    res.status(err.status || 500);
    res.json(error);
});

module.exports = app;
