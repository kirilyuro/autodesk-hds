const HealthStatusProvider = require('./health-status-provider');

class TimedHealthStatusLogger {

    constructor(targetConfig, httpProvider, healthStatusRepository) {
        this.target = targetConfig;
        this.healthStatusProvider = new HealthStatusProvider(targetConfig, httpProvider);
        this.monitorInterval = null;
        this.healthStatusRepository = healthStatusRepository;
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
        // TODO: Handle errors
        const startTime = Date.now();
        const statusResult =
            await this.healthStatusProvider.getServiceStatus();

        const storageDocument = {
            service: this.target.id,
            time: new Date(startTime),
            status: statusResult.status
        };

        if (statusResult.error)
            storageDocument.error = statusResult.error;

        this.healthStatusRepository.insert(
            this.target.id, storageDocument
        );
    }
}

module.exports = TimedHealthStatusLogger;