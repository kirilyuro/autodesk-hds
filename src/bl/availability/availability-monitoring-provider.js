const AvailabilityMonitor = require('./availability-monitor');

class AvailabilityMonitoringProvider {
    constructor(services, httpProvider, healthStatusRepository) {
        this.services = services;
        this.httpProvider = httpProvider;
        this.healthStatusRepository = healthStatusRepository;
        this.monitors = [];
    }

    startAvailabilityMonitoring() {
        for (let service of this.services) {
            this.healthStatusRepository.getOrCreateCollection(service.id);

            const monitor  = new AvailabilityMonitor(
                service, this.httpProvider, this.healthStatusRepository
            );

            this.monitors.push(monitor);
            monitor.start();
        }
    }

    getAvailabilityStatus(toTime) {
        toTime = toTime.getTime();
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
        const healthStatistics =
            this.healthStatusRepository.getHealthStatistics(
                service.id,
                {
                    from: fromTime,
                    to: toTime
                });

        return 100 * healthStatistics.good / healthStatistics.total;
    }
}

module.exports = AvailabilityMonitoringProvider;