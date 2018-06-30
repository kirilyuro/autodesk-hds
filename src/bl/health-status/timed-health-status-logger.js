const HealthStatusProvider = require('./health-status-provider');

class TimedHealthStatusLogger {

    constructor(targetConfig, httpProvider, healthStatusRepository) {
        this.target = targetConfig;
        this.httpProvider = httpProvider;
        this.monitorInterval = null;
        this.healthStatusRepository = healthStatusRepository;
        this.isInitialized = false;
    }

    initialize() {
        this.healthStatusProvider =
            this._createHealthStatusProvider(this.target, this.httpProvider);

        this.isInitialized = true;

        return this;
    }

    start() {
        this._ensureInitialized();

        // Call before setInterval to start immediately.
        // (Not `await`ing is intended here)
        this.logServiceStatus();
        this.monitorInterval = setInterval(
            this.logServiceStatus.bind(this),
            1000 * 60,  // 1 minute
        );
    }

    async logServiceStatus() {
        this._ensureInitialized();

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

    /* private */
    _ensureInitialized() {
        if (!this.isInitialized)
            throw new Error(
                `${TimedHealthStatusLogger.name} used before calling \`initialize\``
            );
    }

    /* private */
    _createHealthStatusProvider(service, httpProvider) {
        return new HealthStatusProvider(service, httpProvider)
    }
}

module.exports = TimedHealthStatusLogger;