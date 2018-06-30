const assert = require('assert');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const _ = require('lodash');
const AggregateHealthStatusProvider = require('../src/bl/health-status/aggregate-health-status-provider');

/**
 * This class allows to mock the `HealthStatusProvider`s created by the
 * `AggregateHealthStatusProvider` for testing purposes.
 */
class TestAggregateHealthStatusProvider extends AggregateHealthStatusProvider {
    constructor(healthStatusProviderCreateFunc, services, httpProvider) {
        super(services, httpProvider);
        this.healthStatusProviderCreateFunc = healthStatusProviderCreateFunc;
    }

    _createHealthStatusProvider(service, httpProvider) {
        return this.healthStatusProviderCreateFunc(service);
    }
}

describe('AggregateHealthStatusProvider', function() {

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
        this.clock = sinon.useFakeTimers({
            shouldAdvanceTime: true,
            advanceTimeDelta: 10
        });
    });

    after(function () {
        this.clock.restore();
    });

    describe('#getServicesStatus()', async function() {
        it('should delegate http calls to `HealthStatusProvider`s', async function () {
            const getServiceStatusFake = sinon.fake();
            const aggregateProvider = new TestAggregateHealthStatusProvider(
                () => ({ getServiceStatus: getServiceStatusFake }),
                this.servicesConfig, this.httpProvider
            );

            await aggregateProvider.initialize().getServicesStatus();

            assert.equal(getServiceStatusFake.callCount, this.servicesConfig.length);
            assert(this.httpMock.get.notCalled);
        });

        it('should throw error if called before `initialize`', async function () {
            const aggregateProvider = new TestAggregateHealthStatusProvider(
                () => ({ getServiceStatus: sinon.fake() }),
                this.servicesConfig, this.httpProvider
            );

            const getServicesStatusPromise = aggregateProvider.getServicesStatus();
            await chai.assert.isRejected(getServicesStatusPromise, Error);
            await chai.assert.isRejected(getServicesStatusPromise,
                'AggregateHealthStatusProvider used before calling `initialize`'
            );
        });

        it('should get services statuses in parallel', async function () {
            const getServiceStatusDelayFactor = 10;
            let getServiceStatusCallCounter = 0;
            const aggregateProvider = new TestAggregateHealthStatusProvider(
                () => ({
                    // Each call to getServiceStatus will take more time
                    // to complete: 10ms, 20ms, 30ms, etc.
                    getServiceStatus: () => new Promise(resolve => {
                        setTimeout(
                            () => resolve({ status: "GOOD" }),
                            ++getServiceStatusCallCounter * getServiceStatusDelayFactor
                        )
                    })
                }),
                this.servicesConfig,
                this.httpProvider
            );

            const startTime = Date.now();
            await aggregateProvider.initialize().getServicesStatus();
            const endTime = Date.now();

            // Assert that the total time it took getServicesStatus to complete is the maximal
            // time it took any one of getServiceStatus calls to complete
            assert.equal(endTime - startTime, getServiceStatusDelayFactor * this.servicesConfig.length);
        });

        it('should return all services statuses on success', async function () {
            const aggregateProvider = new TestAggregateHealthStatusProvider(
                () => ({
                    getServiceStatus: () => ({ status: 'GOOD' })
                }),
                this.servicesConfig, this.httpProvider
            );

            const statuses = await aggregateProvider.initialize().getServicesStatus();

            assert.equal(statuses.length, this.servicesConfig.length);
            for (let service of this.servicesConfig) {
                assert(_(statuses).some(
                    status => status.service.name === service.id
                ));
            }
        });

        it('should return correct status for each service', async function () {
            const aggregateProvider = new TestAggregateHealthStatusProvider(
                (service) => ({
                    getServiceStatus: () => ({
                        status: _(this.servicesConfig).find({ url: service.url }).healthValue
                    })
                }),
                this.servicesConfig, this.httpProvider
            );

            const statuses = await aggregateProvider.initialize().getServicesStatus();

            for (let service of this.servicesConfig) {
                const actualServiceStatus = _(statuses).find(
                    status => status.service.name === service.id
                ).health.status;

                assert.equal(actualServiceStatus, service.healthValue);
            }
        });
    });
});