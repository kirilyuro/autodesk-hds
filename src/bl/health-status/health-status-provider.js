class HealthStatusProvider {

    constructor(serviceConfig, httpProvider) {
        this.target = serviceConfig;
        this.http = httpProvider;
    }

    async getServiceStatus() {
        let status, error;

        try {
            const serviceResponse = await this.http.get(this.target.url);

            const originalStatus = this.getResponseStatus(serviceResponse);
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

        return {
            status: status,
            error: error
        };
    };

    getResponseStatus(response){
        const statusNavigationProperties = this.target.statusField.split('.');
        let status = response.data;

        for (let property of statusNavigationProperties) {
            status = status[property];
        }

        if (status === null || status === undefined)
            throw new Error('Could not get status from response');

        return status;
    }

    static getUniformHealthStatus(isHealthy) {
        return isHealthy ? 'GOOD' : 'BAD';
    }
}

module.exports = HealthStatusProvider;