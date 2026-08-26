import LRUCache from "../cache/LRUCache.js";

const cache = new LRUCache(100);

export const setCache = (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, ttl } = req.body;

    cache.set(key, value, ttl !== undefined ? { ttl } : {});

    res.status(201).json({
      success: true,
      key,
      message: "Value cached successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCache = (req, res, next) => {
  try {
    const { key } = req.params;

    const value = cache.get(key);

    if (value === undefined) {
      return res.status(404).json({
        success: false,
        message: "Cache key not found",
      });
    }

    res.status(200).json({
      success: true,
      key,
      value,
    });
  } catch (error) {
    next(error);
  }
};

export const peekCache = (req, res, next) => {
  try {
    const { key } = req.params;

    const value = cache.peek(key);

    if (value === undefined) {
      return res.status(404).json({
        success: false,
        message: "Cache key not found",
      });
    }

    res.status(200).json({
      success: true,
      key,
      value,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCache = (req, res, next) => {
  try {
    const { key } = req.params;

    const deleted = cache.delete(key);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Cache key not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cache entry deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const getCacheState = (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: cache.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const getCacheStats = (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: cache.stats(),
    });
  } catch (error) {
    next(error);
  }
};

export const clearCache = (req, res, next) => {
  try {
    cache.clear();

    res.status(200).json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
