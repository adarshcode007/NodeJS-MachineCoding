import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createTodo,
  deleteTodo,
  getTodoById,
  getTodos,
  updateTodo,
} from "../controllers/todo.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTodo);
router.get("/", getTodos);
router.get("/:id", getTodoById);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
