const express = require('express');
const request = require('request-promise-native');
const router = express.Router();
const config = require('../config/config.json');
const bl = require('../bl');
const monitor = new bl.AggregateHealthMonitor(config.services, request);

router.get('/', async (req, res, next) => {
    try {
        const healthStatus = await monitor.getServicesStatus();
        res.json(healthStatus);
    }
    catch (error) {
        next(error);
    }
});

module.exports = router;
