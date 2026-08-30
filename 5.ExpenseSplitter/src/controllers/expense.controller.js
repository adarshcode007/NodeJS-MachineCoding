import {
  createExpense,
  getGroupExpenses,
} from "../services/expense.service.js";

export const createExpensesController = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const { description, amount, paidBy, splitType, participants, splits } =
      req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (!paidBy) {
      return res.status(400).json({
        success: false,
        message: "paidBy is required",
      });
    }

    if (!splitType) {
      return res.status(400).json({
        success: false,
        message: "splitType is required",
      });
    }

    const expense = await createExpense({
      groupId,
      description,
      amount,
      paidBy,
      splitType,
      participants,
      splits,
    });

    return res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupExpensesController = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const expenses = await getGroupExpenses(groupId);

    return res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};
