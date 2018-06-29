class HealthStatusProvider {

    constructor(serviceConfig, httpProvider) {
        this.target = serviceConfig;
        this.http = httpProvider;
    }

    async getServiceStatus() {
        let status, error;

        try {
            const serviceResponse = await this.http.get(this.target.url);

            const originalStatus = this._getResponseStatus(serviceResponse);
            const isHealthy = originalStatus === this.target.healthValue;

            status = HealthStatusProvider.getUniformHealthStatus(isHealthy);
        }
        catch (err) {
            status = HealthStatusProvider.getUniformHealthStatus(false);
            error = {
                message: err.message,
                stack: err.stack
            };
        }

        const result = { status: status };
        if (error) result.error = error;

        return result;
    };

    /* private */
    _getResponseStatus(response) {
        const statusNavigationProperties = this.target.statusField.split('.');
        let status = response.data;

        for (let property of statusNavigationProperties) {
            if (!status.hasOwnProperty(property)) {
                throw new Error(`Expected property "${property}" does not exist in response.`);
            }

            status = status[property];
        }

        if (status === null || status === undefined)
            throw new Error('Health status is `null` or `undefined`');

        return status;
    }

    static getUniformHealthStatus(isHealthy) {
        return isHealthy ? 'GOOD' : 'BAD';
    }
}

module.exports = HealthStatusProvider;