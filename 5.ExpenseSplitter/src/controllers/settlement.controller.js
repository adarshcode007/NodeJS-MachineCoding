import {
  createSettlement,
  simplifyGroupDebts,
} from "../services/settlement.service.js";

export const simplifyGroupDebtsController = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const transactions = await simplifyGroupDebts(groupId);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

export const createSettlementController = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const { fromUser, toUser, amount } = req.body;

    if (!fromUser || !toUser || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "fromUser, toUser and amount are required",
      });
    }

    const settlement = await createSettlement({
      groupId,
      fromUser,
      toUser,
      amount,
    });

    return res.status(201).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
};
