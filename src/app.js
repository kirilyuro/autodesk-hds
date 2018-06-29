const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('./axios-config')();

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

const AvailabilityMonitor = require('./bl').AvailabilityMonitor;
const config = require('../config/config');
const httpProvider = require('axios');
const availabilityStorage = require('./storage');

for (let service of config.services) {
    availabilityStorage[service.id] = [];

    const availabilityMonitor  = new AvailabilityMonitor(
        service, httpProvider, availabilityStorage[service.id]
    );

    availabilityMonitor.start();
}


module.exports = app;
