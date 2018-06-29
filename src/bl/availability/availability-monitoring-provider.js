const AvailabilityMonitor = require('./availability-monitor');

class AvailabilityMonitoringProvider {
    constructor(services, httpProvider, healthStatusRepository) {
        this.services = services;
        this.httpProvider = httpProvider;
        this.healthStatusRepository = healthStatusRepository;
    }

    startAvailabilityMonitoring() {
        for (let service of this.services) {
            this.healthStatusRepository.getOrCreateCollection(service.id);

            const availabilityMonitor  = new AvailabilityMonitor(
                service, this.httpProvider, this.healthStatusRepository
            );

            availabilityMonitor.start();
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