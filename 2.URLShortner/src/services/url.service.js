import Url from "../models/url.model.js";
import generateShortCode from "../utils/generateShortCode.js";

export const createShortUrl = async ({ originalUrl, userId }) => {
  let shortCode;
  let existingUrl;

  do {
    shortCode = generateShortCode(6);
    existingUrl = await Url.findOne({ shortCode });
  } while (existingUrl);

  const url = await Url.create({
    originalUrl,
    shortCode,
    user: userId,
  });

  return url;
};

export const getAllUrls = async ({ userId }) => {
  const urls = await Url.find({ user: userId }).sort({ createdAt: -1 });

  return urls;
};

export const redirectToOriginalUrl = async (shortCode) => {
  const url = await Url.findOne({ shortCode });

  if (!url) {
    const error = new Error("Short URL not found");
    error.statusCode = 404;
    throw error;
  }

  if (url.expiresAt && url.expiresAt < new Date()) {
    const error = new Error("Short URL has expired");
    error.statusCode = 410;
    throw error;
  }

  await Url.updateOne({ _id: url._id }, { $inc: { clickCount: 1 } });

  return url.originalUrl;
};

export const getUrlById = async (urlId, userId) => {
  const url = await Url.findOne({
    _id: urlId,
    user: userId,
  });

  if (!url) {
    const error = new Error("URL not found");
    error.statusCode = 404;
    throw error;
  }

  return url;
};

export const deleteUrl = async (urlId, userId) => {
  const url = await Url.findOneAndDelete({
    _id: urlId,
    user: userId,
  });

  if (!url) {
    const error = new Error("URL not found");
    error.statusCode = 404;
    throw error;
  }

  return url;
};
