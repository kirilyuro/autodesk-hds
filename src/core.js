const httpProvider = require('axios');
require('./axios-config').customizeAxios();

const config = require('../config/config');
const HealthStatusRepository = require('./bl/health-status-repository');
const healthStatusRepository = new HealthStatusRepository();

const AvailabilityMonitoringProvider = require('./bl/availability/availability-monitoring-provider');
const availabilityProvider = new AvailabilityMonitoringProvider(config.services, httpProvider, healthStatusRepository);

const AggregateHealthMonitor = require('./bl/health-status/aggregate-health-monitor');
const healthMonitor = new AggregateHealthMonitor(config.services, httpProvider);

module.exports = {
    httpProvider: httpProvider,
    appConfig: config,
    healthStatusRepository: healthStatusRepository,
    healthStatusProvider: healthMonitor,
    availabilityProvider: availabilityProvider,
    initializeApplication: initializeApp
};

function initializeApp() {
    availabilityProvider.startAvailabilityMonitoring();
}