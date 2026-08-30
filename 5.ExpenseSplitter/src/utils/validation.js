import { validate as isUUID } from "uuid";
import AppError from "./AppError.js";

export const validateUUID = (value, fieldName) => {
  if (!isUUID(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};
