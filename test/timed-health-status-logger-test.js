const assert = require('assert');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const TimedHealthStatusLogger = require('../src/bl/health-status/timed-health-status-logger');

/**
 * This class allows to mock the `HealthStatusProvider` created by the
 * `TimedHealthStatusLogger` for testing purposes.
 */
class TestTimedHealthStatusLogger extends TimedHealthStatusLogger {
    constructor(healthStatusProviderCreateFunc, target, httpProvider, healthStatusRepository) {
        super(target, httpProvider, healthStatusRepository);
        this.healthStatusProviderCreateFunc = healthStatusProviderCreateFunc;
    }

    _createHealthStatusProvider(service, httpProvider) {
        return this.healthStatusProviderCreateFunc(service);
    }
}

describe('TimedHealthStatusLogger', function() {

    before(function () {
        this.targetConfig = {
            id: "myService",
            url: "http://myService.org/health",
            statusField: "a.b",
            healthValue: "OK"
        };
        this.httpMock = { get: sinon.fake() };
        this.clock = sinon.useFakeTimers();
    });

    after(function () {
        this.clock.restore();
    });

    beforeEach(function () {
        this.healthStatusRepositoryMock = {
            insert: sinon.fake(),
            getHealthStatistics: sinon.fake(),
            getOrCreateCollection: sinon.fake()
        };
    });

    describe('#logServiceStatus()', async function () {
        it('should throw error if called before `initialize`', async function () {
            const healthStatusLogger = new TestTimedHealthStatusLogger(
                () => ({ getServiceStatus: sinon.fake() }),
                this.targetConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            const statusLogPromise = healthStatusLogger.logServiceStatus();
            await chai.assert.isRejected(statusLogPromise, Error);
            await chai.assert.isRejected(statusLogPromise,
                'TimedHealthStatusLogger used before calling `initialize`'
            );
        });

        it('should get status from HealthStatusProvider', async function () {
            const getServiceStatusFake = sinon.fake.returns({ status: 'OK' });
            const healthStatusLogger = new TestTimedHealthStatusLogger(
                () => ({ getServiceStatus: getServiceStatusFake }),
                this.targetConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            await healthStatusLogger.initialize().logServiceStatus();

            assert.equal(getServiceStatusFake.callCount, 1);
        });

        it('should insert single document into repository ', async function () {
            const getServiceStatusFake = sinon.fake.returns({ status: "OK" });
            const healthStatusLogger = new TestTimedHealthStatusLogger(
                () => ({ getServiceStatus: getServiceStatusFake }),
                this.targetConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            await healthStatusLogger.initialize().logServiceStatus();

            assert.equal(this.healthStatusRepositoryMock.insert.callCount, 1);
        });

        it('should insert correct document into repository ', async function () {
            const getServiceStatusFake = sinon.fake.returns({ status: 'OK' });
            const healthStatusLogger = new TestTimedHealthStatusLogger(
                () => ({ getServiceStatus: getServiceStatusFake }),
                this.targetConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            const callTime = new Date();
            await healthStatusLogger.initialize().logServiceStatus();

            assert(this.healthStatusRepositoryMock.insert.calledWithMatch(
                this.targetConfig.id,
                {
                    service: this.targetConfig.id,
                    time: callTime,
                    status: 'OK'
                })
            );
        });

        it('should insert document with error property on error', async function () {
            const error = 'SomeError';
            const getServiceStatusFake = sinon.fake.returns({ status: 'BAD', error: error });
            const healthStatusLogger = new TestTimedHealthStatusLogger(
                () => ({ getServiceStatus: getServiceStatusFake }),
                this.targetConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            await healthStatusLogger.initialize().logServiceStatus();

            assert(this.healthStatusRepositoryMock.insert.calledWithMatch(
                this.targetConfig.id,
                {
                    error: error
                })
            );
        });

        it('should insert document without error property on success', async function () {
            const getServiceStatusFake = sinon.fake.returns({ status: 'OK' });
            const healthStatusLogger = new TestTimedHealthStatusLogger(
                () => ({ getServiceStatus: getServiceStatusFake }),
                this.targetConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            const callTime = new Date();
            await healthStatusLogger.initialize().logServiceStatus();

            assert(this.healthStatusRepositoryMock.insert.calledWithExactly(
                this.targetConfig.id,
                {
                    service: this.targetConfig.id,
                    time: callTime,
                    status: 'OK'
                })
            );
        });
    });

    describe('#start()', async function () {
        it('should throw error if called before `initialize`', async function () {
            const healthStatusLogger = new TestTimedHealthStatusLogger(
                () => ({ getServiceStatus: sinon.fake() }),
                this.targetConfig, this.httpMock, this.healthStatusRepositoryMock
            );

            chai.assert.throws(
                healthStatusLogger.start.bind(healthStatusLogger),
                Error, 'TimedHealthStatusLogger used before calling `initialize`'
            );
        });

        it('should start immediately', function (done) {
            const getServiceStatusFake = sinon.fake.returns({ status: 'OK' });
            const healthStatusLogger = new TestTimedHealthStatusLogger(
                () => ({ getServiceStatus: getServiceStatusFake }),
                this.targetConfig, this.httpMock, this.healthStatusRepositoryMock
            );
            sinon.spy(
                healthStatusLogger,
                healthStatusLogger.logServiceStatus.name
            );

            healthStatusLogger.initialize().start();

            setTimeout(() => {
                assert(healthStatusLogger.logServiceStatus.called);
                done();
            });
            this.clock.tick(0);
        });

        it('should log every 1 minute', async function () {
            // TODO: Implement
        });
    });
});
