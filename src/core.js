const httpProvider = require('axios');
require('./axios-config').customizeAxios();

const config = require('../config/config');
const storage = require('./storage');

const AvailabilityMonitoringProvider = require('./bl/availability/availability-monitoring-provider');
const availabilityProvider = new AvailabilityMonitoringProvider(config.services, httpProvider, storage);

const AggregateHealthMonitor = require('./bl/health-status/aggregate-health-monitor');
const healthMonitor = new AggregateHealthMonitor(config.services, httpProvider);

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