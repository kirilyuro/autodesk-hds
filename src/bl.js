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

class HealthMonitor {

    constructor(serviceConfig, httpProvider) {
        this.target = serviceConfig;
        this.http = httpProvider;
    }

    async getServiceStatus() {
        let status, error;

        try {
            const serviceResponse = await this.http.get(this.target.url);

            const originalStatus = this.getResponseStatus(serviceResponse);
            const isHealthy = originalStatus === this.target.healthValue;

            status = HealthMonitor.getUniformHealthStatus(isHealthy);
        }
        catch (err) {
            status = HealthMonitor.getUniformHealthStatus(false);
            error = {
                message: err.message,
                stack: err.stack
            };
        }

        return {
            status: status,
            error: error
        };
    };

    getResponseStatus(response){
        const statusNavigationProperties = this.target.statusField.split('.');
        let status = response.data;

        for (let property of statusNavigationProperties) {
            status = status[property];
        }

        if (status === null || status === undefined)
            throw new Error('Could not get status from response');

        return status;
    }

    static getUniformHealthStatus(isHealthy) {
        return isHealthy ? 'GOOD' : 'BAD';
    }
}

class AvailabilityMonitor {

    constructor(targetConfig, httpProvider, storage) {
        this.target = targetConfig;
        this.healthMonitor = new HealthMonitor(targetConfig, httpProvider);
        this.monitorInterval = null;
        this.storage = storage;
    }

    start() {
        // Call before setInterval to start immediately.
        // (Not `await`ing is intended here)
        this.logServiceStatus();
        this.monitorInterval = setInterval(
            this.logServiceStatus.bind(this),
            1000 * 60,  // 1 minute
        );
    }

    async logServiceStatus() {
        const startTime = Date.now();
        const statusResult = await this.healthMonitor.getServiceStatus();
        this.storage.push({
            service: this.target.id,
            time: new Date(startTime),
            result: statusResult
        });
    }
}

module.exports = {
    AggregateHealthMonitor: AggregateHealthMonitor,
    HealthMonitor: HealthMonitor,
    AvailabilityMonitor: AvailabilityMonitor
};
