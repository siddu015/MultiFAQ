jest.mock("../src/config/redis", () => {
    const Redis = require("ioredis-mock");
    return new Redis();
});
const mockedRedis = require("../src/config/redis");

describe("Redis Utility Tests", () => {
    beforeEach(async () => {
        await mockedRedis.flushall();
    });

    afterAll(async () => {
        await mockedRedis.quit();
    });

    test("should store and retrieve data from Redis", async () => {
        await mockedRedis.set("testKey", "testValue");
        const value = await mockedRedis.get("testKey");

        expect(value).toBe("testValue");
    });

    test("should delete data from Redis", async () => {
        await mockedRedis.set("deleteKey", "toDelete");
        await mockedRedis.del("deleteKey");
        const value = await mockedRedis.get("deleteKey");

        expect(value).toBeNull();
    });

    test("should expire keys after a given time", async () => {
        await mockedRedis.set("expiringKey", "temporary", "EX", 1);
        const valueBeforeExpire = await mockedRedis.get("expiringKey");

        expect(valueBeforeExpire).toBe("temporary");

        await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait for expiry
        const valueAfterExpire = await mockedRedis.get("expiringKey");

        expect(valueAfterExpire).toBeNull();
    });
});
