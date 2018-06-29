const httpProvider = require('axios');
const config = require('../config/config');
const storage = require('./storage');
const AvailabilityMonitoringProvider = require('./availability/availability-monitoring-provider');
const availabilityProvider = new AvailabilityMonitoringProvider(config.services, httpProvider, storage);

module.exports = {
    httpProvider: httpProvider,
    appConfig: config,
    storage: storage,
    initializeApplication: initializeApp
};

function initializeApp() {
    availabilityProvider.startAvailabilityMonitoring();
}