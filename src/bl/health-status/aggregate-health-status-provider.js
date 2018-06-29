const HealthStatusProvider = require('./health-status-provider');

class AggregateHealthStatusProvider {

    constructor(services, httpProvider) {
        this.monitoredServices = services.map(service => ({
            config: service,
            monitor: new HealthStatusProvider(service, httpProvider)
        }));
    }

    async getServicesStatus() {
        const serviceHealthPromises = this.monitoredServices
            .map(service => service.monitor.getServiceStatus());

        const healthResponses = await Promise.all(serviceHealthPromises);

        return healthResponses.map((healthStatus, i) => ({
            service: this.monitoredServices[i].config.url,
            health: healthStatus
        }));
    }
}

module.exports = AggregateHealthStatusProvider;