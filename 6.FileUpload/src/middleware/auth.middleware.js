import { findUserById } from "../repositories/file.repository.js";
import AppError from "../utils/AppError.js";

async function authenticate(req, res, next) {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const user = await findUserById(userId);

    if (!user) {
      throw new AppError("Invalid user ID", 401);
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

export default authenticate;
