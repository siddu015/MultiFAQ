// redisClient.js
const redis = require("redis");
const redisClient = redis.createClient();

// Connect to Redis
const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis");
    } catch (err) {
        console.error("Redis Connection Error:", err);
    }
};

// Fetch from Redis cache
const getCache = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error("Error fetching from Redis:", err);
        return null;
    }
};

// Set data to Redis cache
const setCache = async (key, data, expiration = 3600) => {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: expiration });
    } catch (err) {
        console.error("Error setting Redis cache:", err);
    }
};

// Delete Redis cache
const deleteCache = async (key) => {
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error("Error deleting Redis cache:", err);
    }
};

module.exports = { connectRedis, getCache, setCache, deleteCache };
