const httpProvider = require('axios');
require('./axios-config').customizeAxios();

const config = require('../config/config');
const HealthStatusRepository = require('./bl/health-status-repository');
const healthStatusRepository = new HealthStatusRepository();

const AvailabilityMonitoringProvider = require('./bl/availability/availability-monitoring-provider');
const availabilityMonitoringProvider =
    new AvailabilityMonitoringProvider(config.services, httpProvider, healthStatusRepository);

const AggregateHealthStatusProvider = require('./bl/health-status/aggregate-health-status-provider');
const healthStatusProvider = new AggregateHealthStatusProvider(config.services, httpProvider);

module.exports = {
    httpProvider: httpProvider,
    appConfig: config,
    healthStatusRepository: healthStatusRepository,
    healthStatusProvider: healthStatusProvider,
    availabilityProvider: availabilityMonitoringProvider,
    initializeApplication: initializeApp
};

function initializeApp() {
    availabilityMonitoringProvider.startAvailabilityMonitoring();
}