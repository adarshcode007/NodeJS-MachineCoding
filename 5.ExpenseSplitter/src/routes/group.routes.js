import express from "express";
import {
  addMemberController,
  createGroupController,
  getGroupController,
} from "../controllers/group.controller.js";
import {
  createExpensesController,
  getGroupExpensesController,
} from "../controllers/expense.controller.js";
import { getGroupBalancesController } from "../controllers/balance.controller.js";
import {
  createSettlementController,
  simplifyGroupDebtsController,
} from "../controllers/settlement.controller.js";

const router = express.Router();

router.post("/", createGroupController);

router.post("/:groupId/members", addMemberController);

router.get("/:groupId/expenses", getGroupExpensesController);
router.post("/:groupId/expenses", createExpensesController);

router.get("/:groupId/balances", getGroupBalancesController);

router.get("/:groupId/settlements", simplifyGroupDebtsController);
router.post("/:groupId/settlements", createSettlementController);

router.get("/:groupId", getGroupController);

export default router;
