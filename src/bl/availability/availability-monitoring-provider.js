const TimedHealthStatusLogger = require('../health-status/timed-health-status-logger');

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

            const monitor  = new TimedHealthStatusLogger(
                service, this.httpProvider, this.healthStatusRepository
            );

            this.monitors.push(monitor);
            monitor.initialize().start();
        }
    }

    getAvailabilityStatus(toTime) {
        toTime = toTime.getTime();
        const fromTime = toTime - 1000 * 60 * 60;   // 1 hour

        return this.services.map(service => {
            const availabilityStatistics =
                this.computeServiceAvailabilityStatistics(
                    service, fromTime, toTime
                );

            return {
                service: {
                    name: service.id,
                    url: service.url
                },
                availability: availabilityStatistics
            }
        });
    }

    computeServiceAvailabilityStatistics(service, fromTime, toTime) {
        const healthStatistics =
            this.healthStatusRepository.getHealthStatistics(
                service.id,
                {
                    from: fromTime,
                    to: toTime
                });

        const availabilityPercentage = 100 * healthStatistics.good / healthStatistics.total;

        return {
            percentage: availabilityPercentage,
            total: healthStatistics.total,
            good: healthStatistics.good
        };
    }
}

module.exports = AvailabilityMonitoringProvider;