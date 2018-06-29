const HealthMonitor = require('../health-status/health-monitor');

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

module.exports = AvailabilityMonitor;