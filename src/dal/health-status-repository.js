const lokiDb = require('lokijs');
const HealthStatusProvider = require('../bl/health-status/health-status-provider');

class HealthStatusRepository {
    constructor() {
        this.db = new lokiDb('HealthHistory');
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
            .find({ status: { $eq: HealthStatusProvider.getUniformHealthStatus(true) } });

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
