const HealthMonitor = require('./health-monitor');

class AggregateHealthMonitor {

    constructor(services, httpProvider) {
        this.monitoredServices = services.map(service => ({
            config: service,
            monitor: new HealthMonitor(service, httpProvider)
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

module.exports = AggregateHealthMonitor;