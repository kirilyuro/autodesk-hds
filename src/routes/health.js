const express = require('express');
const router = express.Router();
const app = require('../core');

router.get('/status', async (req, res, next) => {
    try {
        const healthStatus =
            await app.healthStatusProvider.getServicesStatus();

        res.json(healthStatus);
    }
    catch (error) {
        next(error);
    }
});

router.get('/availability', async (req, res, next) => {
    try {
        const requestTime = new Date();
        const availabilityStatus =
            app.availabilityProvider.getAvailabilityStatus(requestTime);

        res.json(availabilityStatus);
    }
    catch (error) {
        next(error);
    }
});

module.exports = router;
