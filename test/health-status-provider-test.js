const assert = require('assert');
const sinon = require('sinon');
const HealthStatusProvider = require('../src/bl/health-status/health-status-provider');

describe('HealthStatusProvider', function() {

    before('create service config', function () {
        this.serviceConfig = {
            id: "myService",
            url: "http://myService.org/health",
            statusField: "a.b",
            healthValue: "very healthy indeed"
        };
    });

    beforeEach('instantiate HealthStatusProvider', function () {
        this.httpMock = {};
        this.provider = new HealthStatusProvider(this.serviceConfig, this.httpMock);
    });

    describe('#getUniformHealthStatus()', function () {
        it('should return "GOOD" when healthy', function () {
            const health = HealthStatusProvider.getUniformHealthStatus(true);
            assert.equal(health, 'GOOD');
        });

        it('should return "BAD" when not healthy', function () {
            const health = HealthStatusProvider.getUniformHealthStatus(false);
            assert.equal(health, 'BAD');
        });
    });

    describe('#getServiceStatus()', function() {
        it('should make an http get request to service url', async function() {
            this.httpMock.get = sinon.fake.returns({ data: {} });

            await this.provider.getServiceStatus();

            assert(this.httpMock.get.calledOnce);
            assert(this.httpMock.get.calledWith(this.serviceConfig.url));
        });

        it('should return uniform health value on healthy response', async function() {
            this.httpMock.get = sinon.fake.returns({ data:
                { a: { b: this.serviceConfig.healthValue } }
            });

            const result = await this.provider.getServiceStatus();

            assert.equal(result.status, HealthStatusProvider.getUniformHealthStatus(true));
        });

        it('should return uniform non-health value on non-healthy response', async function() {
            this.httpMock.get = sinon.fake.returns({ data:
                { a: { b: `NOT!!! ${this.serviceConfig.healthValue}` } }
            });

            const result = await this.provider.getServiceStatus();

            assert.equal(result.status, HealthStatusProvider.getUniformHealthStatus(false));
        });

        it('should return error on unexpected response structure (wrong property)', async function () {
            this.httpMock.get = sinon.fake.returns({ data:
                { a: { wrong: this.serviceConfig.healthValue } }
            });

            const result = await this.provider.getServiceStatus();

            assert.equal(result.status, HealthStatusProvider.getUniformHealthStatus(false));
            assert.equal(result.error.message, 'Expected property "b" does not exist in response.');
        });

        it('should return error on null health value', async function () {
            this.httpMock.get = sinon.fake.returns({ data:
                    { a: { b: null } }
            });

            const result = await this.provider.getServiceStatus();

            assert.equal(result.status, HealthStatusProvider.getUniformHealthStatus(false));
            assert.equal(result.error.message, 'Health status is `null` or `undefined`');
        });

        it('should return error on undefined health value', async function () {
            this.httpMock.get = sinon.fake.returns({ data:
                    { a: { b: undefined } }
            });

            const result = await this.provider.getServiceStatus();

            assert.equal(result.status, HealthStatusProvider.getUniformHealthStatus(false));
            assert.equal(result.error.message, 'Health status is `null` or `undefined`');
        });

        it('should not return error property on success', async function () {
            this.httpMock.get = sinon.fake.returns({ data:
                    { a: { b: this.serviceConfig.healthValue } }
            });

            const result = await this.provider.getServiceStatus();

            assert(!result.hasOwnProperty('error'));
        });
    });
});