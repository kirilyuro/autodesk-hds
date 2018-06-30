const HealthStatusProvider = require('./health-status-provider');

class AggregateHealthStatusProvider {

    constructor(services, httpProvider) {
        this.services = services;
        this.httpProvider = httpProvider;
        this.isInitialized = false;
    }

    initialize() {
        this.monitoredServices = this.services.map(service => ({
            config: service,
            monitor: this._createHealthStatusProvider(service, this.httpProvider)
        }));

        this.isInitialized = true;

        return this;
    }

    async getServicesStatus() {
        if (!this.isInitialized)
            throw new Error(`${AggregateHealthStatusProvider.name} used before calling \`initialize\``);

        const serviceHealthPromises = this.monitoredServices
            .map(service => service.monitor.getServiceStatus());

        const healthResponses = await Promise.all(serviceHealthPromises);

        return healthResponses.map((healthStatus, i) => ({
            service: this.monitoredServices[i].config.url,
            health: healthStatus
        }));
    }

    /* private */
    _createHealthStatusProvider(service, httpProvider) {
        return new HealthStatusProvider(service, httpProvider)
    }
}

module.exports = AggregateHealthStatusProvider;
