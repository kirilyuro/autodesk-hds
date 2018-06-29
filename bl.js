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

        return healthResponses.map((status, i) => ({
            service: this.monitoredServices[i].config.url,
            status: status
        }));
    }
}

class HealthMonitor {
    constructor(serviceConfig, httpProvider) {
        this.target = serviceConfig;
        this.http = httpProvider;
    }

    async getServiceStatus() {
        try {
            const serviceResponse = await this.http.get({
                url: this.target.url,
                json: true
            });

            const status = this.getResponseStatus(serviceResponse);

            // TODO: Map to uniform status value
            return status;
        }
        catch (error) {
            return {
                status: "Error",
                error: {
                    message: error.message,
                    stack: error.stack
                }
            };
        }
    };

    getResponseStatus(response){
        const statusNavigationProperties = this.target.statusField.split('.');
        let status = response;

        for (let property of statusNavigationProperties) {
            status = status[property];
        }

        if (status === null || status === undefined)
            throw new Error('Could not get status from response');

        return status;
    }
}

module.exports = {
    AggregateHealthMonitor: AggregateHealthMonitor
};
