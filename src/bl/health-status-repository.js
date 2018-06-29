const loki = require('lokijs');
const HealthMonitor = require('./health-status/health-monitor');

class HealthStatusRepository {
    constructor() {
        this.db = new loki('HealthHistory');
        this.indices = ['time', 'status'];
    }

    insert(serviceName, healthStatusResult) {
        const collection = this.getOrCreateCollection(serviceName);
        collection.insert(healthStatusResult);
    }

    getHealthStatistics(serviceName, timeRange) {
        const collection = this.db.getCollection(serviceName);
        if (collection === null) {
            throw new Error(`Collection "${serviceName}" does not exist!`);
        }

        const totalProbesQuery = collection.chain()
            .find({ time: { $between: [ timeRange.from, timeRange.to ]}});

        const goodProbesQuery = totalProbesQuery
            .find({ status: { $eq: HealthMonitor.getUniformHealthStatus(true) } });

        return {
            total: totalProbesQuery.count(),
            good: goodProbesQuery.count()
        }
    }

    getOrCreateCollection(collectionName) {
        let collection = this.db.getCollection(collectionName);

        if (collection === null) {
            collection = this.db.addCollection(collectionName, this.indices);
        }

        return collection;
    }
}

module.exports = HealthStatusRepository;
