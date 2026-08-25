import {
  createShortUrl,
  deleteUrl,
  getAllUrls,
  getUrlById,
  redirectToOriginalUrl,
} from "../services/url.service.js";
import validateUrl from "../utils/validateUrl.js";

export const createUrl = async (req, res, next) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: "Original URL is required",
      });
    }

    if (!validateUrl(originalUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }

    const url = await createShortUrl({ originalUrl, userId: req.user._id });

    return res.status(201).json({
      success: true,
      message: "Short URL created successfully",
      data: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: `{process.env.BASE_URL}/${url.shortCode}`,
        clickCount: url.clickCount,
        createdAt: url.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUrls = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const urls = await getAllUrls({ userId });

    return res.status(200).json({
      success: true,
      count: urls.length,
      data: urls.map((url) => ({
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
        clickCount: url.clickCount,
        expiresAt: url.expiresAt,
        createdAt: url.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const originalUrl = await redirectToOriginalUrl(shortCode);

    return res.redirect(302, originalUrl);
  } catch (error) {
    next(error);
  }
};

export const getUrl = async (req, res, next) => {
  try {
    const url = await getUrlById(req.params.id, req.user._id);

    return res.status(200).json({
      success: true,
      data: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
        clickCount: url.clickCount,
        expiresAt: url.expiresAt,
        createdAt: url.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeUrl = async (req, res, next) => {
  try {
    await deleteUrl(req.params.id, req.user._id);

    return res.status(200).json({
      success: true,
      message: "URL deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
