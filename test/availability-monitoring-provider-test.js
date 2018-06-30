const assert = require('assert');
const sinon = require('sinon');
const _ = require('lodash');
const AvailabilityMonitoringProvider = require('../src/bl/availability/availability-monitoring-provider');

describe('TimedHealthStatusLogger', function() {

    before(function () {
        this.servicesConfig = [
            {
                id: "service1",
                url: "http://service1.org/health",
                statusField: "a.b",
                healthValue: "OK"
            },
            {
                id: "service2",
                url: "http://service2.org/health",
                statusField: "c.d",
                healthValue: "Good"
            },
            {
                id: "service3",
                url: "http://service3.org/health",
                statusField: "Foo.bar",
                healthValue: "I am fine, thank you"
            }
        ];
        this.httpMock = { get: sinon.fake() };
    });

    beforeEach(function () {
        this.healthStatusRepositoryMock = {
            insert: sinon.fake(),
            getHealthStatistics: sinon.fake(),
            getOrCreateCollection: sinon.fake()
        };
    });

    describe('#startAvailabilityMonitoring()', function () {
        it('should start a monitor for each service`', async function () {
            const availabilityMonitor = new AvailabilityMonitoringProvider(
                this.servicesConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            availabilityMonitor.startAvailabilityMonitoring();

            assert.equal(availabilityMonitor.monitors.length, this.servicesConfig.length);
            for (let service of this.servicesConfig) {
                const serviceMonitor = _(availabilityMonitor.monitors).find(
                    monitor => monitor.target.id === service.id
                );
                assert(serviceMonitor !== undefined);
                assert(serviceMonitor.monitorInterval !== undefined);
            }
        });
    });

    describe('#computeServiceAvailabilityStatistics()', function () {
        it('should compute correct statistics`', async function () {
            this.healthStatusRepositoryMock.getHealthStatistics = sinon.fake.returns({
                total: 60, good: 45
            });
            const availabilityMonitor = new AvailabilityMonitoringProvider(
                this.servicesConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            const statistics = availabilityMonitor.computeServiceAvailabilityStatistics(
                this.servicesConfig[0],
                new Date(Date.now() - 1000 * 60 * 60),  // one hour ago
                new Date()                              // now
            );

            assert.deepEqual(statistics, { total: 60, good: 45, percentage: 75 });
        });
    });

    describe('#getAvailabilityStatus()', function () {
        it('should return availability status of last hour`', function () {
            this.healthStatusRepositoryMock.getHealthStatistics = sinon.fake.returns({
                total: 60, good: 45
            });
            const availabilityMonitor = new AvailabilityMonitoringProvider(
                this.servicesConfig, this.httpMock, this.healthStatusRepositoryMock
            );
            const computeStatisticsSpy = sinon.spy(
                availabilityMonitor,
                availabilityMonitor.computeServiceAvailabilityStatistics.name
            );

            const callTime = new Date();
            availabilityMonitor.getAvailabilityStatus(callTime);

            assert.equal(computeStatisticsSpy.callCount, this.servicesConfig.length);
            assert(_(computeStatisticsSpy.getCalls()).every(call => {
                const args = call.args;
                return args[1] === callTime.getTime() - 1000 * 60 * 60  // 1 hour
                    && args[2] === callTime.getTime();
            }));
        });

        it('should return correct availability status for each service', function () {
            const statistics = {
                service1: { total: 60, good: 6 },
                service2: { total: 60, good: 30 },
                service3: { total: 60, good: 60 }
            };
            const expectedAvailabilityPercentage = {
                service1: 10,
                service2: 50,
                service3: 100
            };
            this.healthStatusRepositoryMock.getHealthStatistics = (service) => statistics[service];
            const availabilityMonitor = new AvailabilityMonitoringProvider(
                this.servicesConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            const availabilityStatus = availabilityMonitor.getAvailabilityStatus(new Date());

            assert.equal(availabilityStatus.length, this.servicesConfig.length);
            for (let service of this.servicesConfig) {
                const serviceAvailabilityStatus = _(availabilityStatus).find(
                    status => status.service.name === service.id
                );

                assert(serviceAvailabilityStatus !== undefined);
                assert.equal(serviceAvailabilityStatus.service.url, service.url);
                assert.equal(
                    serviceAvailabilityStatus.availability.good,
                    statistics[service.id].good
                );
                assert.equal(
                    serviceAvailabilityStatus.availability.total,
                    statistics[service.id].total
                );
                assert.equal(
                    serviceAvailabilityStatus.availability.percentage,
                    expectedAvailabilityPercentage[service.id]
                );
            }
        });
    });
});
