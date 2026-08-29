import { addMemberToGroup, createGroup } from "../services/group.service.js";

export const createGroupController = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    const group = await createGroup({ name });

    return res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const addMemberController = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const member = await addMemberToGroup({
      groupId,
      userId,
    });

    return res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};
