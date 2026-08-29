import express from "express";
import {
  addMemberController,
  createGroupController,
} from "../controllers/group.controller.js";
import { createExpensesController } from "../controllers/expense.controller.js";
import { getGroupBalancesController } from "../controllers/balance.controller.js";

const router = express.Router();

router.post("/", createGroupController);

router.post("/:groupId/members", addMemberController);

router.post("/:groupId/expenses", createExpensesController);

router.get("/:groupId/balances", getGroupBalancesController);

export default router;
