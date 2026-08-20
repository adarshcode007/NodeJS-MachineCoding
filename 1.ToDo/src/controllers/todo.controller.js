import * as todoService from "../services/todo.service.js";

const createTodo = async (req, res, next) => {
  try {
    const todo = await todoService.createTodo(req.user.userId, req.body);

    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
};

const getTodos = async (req, res, next) => {
  try {
    const todos = await todoService.getTodos(req.user.userId);

    res.status(200).json(todos);
  } catch (error) {
    next(error);
  }
};

const getTodoById = async (req, res, next) => {
  try {
    const todo = await todoService.getTodoById(req.user.userId, req.params.id);

    res.status(200).json(todo);
  } catch (error) {
    next(error);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const todo = await todoService.updateTodo(
      req.user.userId,
      req.params.id,
      req.body,
    );

    res.status(200).json(todo);
  } catch (error) {
    next(error);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    await todoService.deleteTodo(req.user.userId, req.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { createTodo, getTodoById, getTodos, updateTodo, deleteTodo };
