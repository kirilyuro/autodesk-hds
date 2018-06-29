const express = require('express');
const httpProvider = require('axios');
const router = express.Router();
const config = require('../../config/config.json');
const bl = require('../bl');
const monitor = new bl.AggregateHealthMonitor(config.services, httpProvider);

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
