const prisma = require("../config/prisma");

const createHistoryEntry = async ({
  workItemId,
  actionType,
  field = null,
  oldValue = null,
  newValue = null,
  changedById = null
}) => {
  return prisma.workItemHistory.create({
    data: {
      workItemId,
      actionType,
      field,
      oldValue: oldValue !== null ? String(oldValue) : null,
      newValue: newValue !== null ? String(newValue) : null,
      changedById
    }
  });
};

module.exports = {
  createHistoryEntry
};