const AvailabilityMonitor = require('../bl').AvailabilityMonitor;

class AvailabilityMonitoringProvider {
    constructor(services, httpProvider, storage) {
        this.services = services;
        this.httpProvider = httpProvider;
        this.storage = storage;
    }

    startAvailabilityMonitoring() {
        for (let service of this.services) {
            this.storage[service.id] = [];

            const availabilityMonitor  = new AvailabilityMonitor(
                service, this.httpProvider, this.storage[service.id]
            );

            availabilityMonitor.start();
        }
    }
}

module.exports = AvailabilityMonitoringProvider;