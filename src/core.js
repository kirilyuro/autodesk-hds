const httpProvider = require('axios');
const config = require('../config/config');
const storage = require('./storage');

const AvailabilityMonitoringProvider = require('./availability/availability-monitoring-provider');
const availabilityProvider = new AvailabilityMonitoringProvider(config.services, httpProvider, storage);

const bl = require('./bl');
const healthMonitor = new bl.AggregateHealthMonitor(config.services, httpProvider);

module.exports = {
    httpProvider: httpProvider,
    appConfig: config,
    storage: storage,
    healthStatusProvider: healthMonitor,
    availabilityProvider: availabilityProvider,
    initializeApplication: initializeApp
};

function initializeApp() {
    availabilityProvider.startAvailabilityMonitoring();
}