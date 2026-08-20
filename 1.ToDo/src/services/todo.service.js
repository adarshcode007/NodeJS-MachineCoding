import { Todo } from "../models/todo.model.js";

const createTodo = async (userId, data) => {
  const { title, description } = data;

  if (!title || typeof title !== "string" || !title.trim()) {
    const error = new Error("Title is required");
    error.statusCode = 400;
    throw error;
  }

  const todo = await Todo.create({
    title: title.trim(),
    description,
    userId,
  });

  return todo;
};

const getTodos = async (userId) => {
  return Todo.find({ userId }).sort({ createdAt: -1 });
};

const getTodoById = async (userId, todoId) => {
  const todo = Todo.findOne({
    _id: todoId,
    userId,
  });

  if (!todo) {
    const error = new Error("Todo not found");
    error.statusCode = 404;
    throw error;
  }
  return todo;
};

const updateTodo = async (userId, todoId, data) => {
  const updates = {};

  if (data.title !== undefined) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      const error = new Error("Title cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    updates.title = data.title.trim();
  }

  if (data.description !== undefined) {
    updates.description = data.description;
  }

  if (data.completed !== undefined) {
    if (typeof data.completed !== "boolean") {
      const error = new Error("Completed must be boolean");
      error.statusCode = 400;
      throw error;
    }
    updates.completed = data.completed;
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error("No valid fields to update");
    error.statusCode = 400;
    throw error;
  }

  const todo = await Todo.findOneAndUpdate(
    {
      _id: todoId,
      userId,
    },
    updates,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!todo) {
    const error = new Error("Todo not found");
    error.statusCode = 404;
    throw new error();
  }

  return todo;
};

const deleteTodo = async (userId, todoId) => {
  const todo = await Todo.findOneAndDelete({
    _id: todoId,
    userId,
  });

  if (!todo) {
    const error = new Error("Todo not found");
    error.statusCode = 404;
    throw error;
  }
};

export { createTodo, getTodoById, getTodos, updateTodo, deleteTodo };
