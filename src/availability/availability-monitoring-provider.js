const bl = require('../bl');
const AvailabilityMonitor = bl.AvailabilityMonitor;
const HealthMonitor = bl.HealthMonitor;

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

    getAvailabilityStatus(toTime) {
        const fromTime = toTime - 1000 * 60 * 60;   // 1 hour
        const status = {};
        for (let service of this.services) {
            status[service.id] =
                this.computeServiceAvailabilityPercentage(
                    service, fromTime, toTime
                );
        }

        return status;
    }

    computeServiceAvailabilityPercentage(service, fromTime, toTime) {
        const totalProbes = this.storage[service.id]
            .filter(result => {
                const resultTime = result.time.getTime();
                return resultTime >= fromTime && resultTime <= toTime;
            });

        const goodProbes = totalProbes.filter(
            probe =>
                probe.result.status === HealthMonitor.getUniformHealthStatus(true)
        );

        return 100 * goodProbes.length / totalProbes.length;
    }
}

module.exports = AvailabilityMonitoringProvider;