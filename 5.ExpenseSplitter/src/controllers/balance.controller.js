import { getGroupBalances } from "../services/balance.service.js";

export const getGroupBalancesController = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const balances = await getGroupBalances(groupId);

    return res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (error) {
    next(error);
  }
};
