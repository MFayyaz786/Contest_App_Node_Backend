const roomModel = require("../models/roomModel");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const OTP = require("../utils/OTP");
const roomServices = {
  get: async () => {
    const result = await roomModel.find({}, projection.basicProjection);
    return result;
  },
  getByID: async (_id) => {
    const result = await roomModel.findById(
      { _id },
      projection.basicProjection
    );
    return result;
  },
  isJoined: async (userId, contestId, _id, carPart) => {
    const result = await roomModel.findOne({
      _id,
      contestId,
      "participants.userId": userId,
      "participants.roomId": roomId,
    });
    return result;
  },
  addNew: async (contestId, name) => {
    user = new roomModel({
      contestId,
      name,
    });
    const result = await user.save();
    return result;
  },
  createRooms: async (contestId, roomsLimit) => {
    let roomsArr = [];
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      for (var i = 0; i < roomsLimit; i++) {
        let name = OTP();
        name = `Contest-${name}`;
        user = new roomModel({
          contestId,
          name,
        });
        const result = await user.save();
        roomsArr.push(result);
      }
      await session.commitTransaction();
      return roomsArr;
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction aborted. Error: ", error);
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  },
  update: async (_id, contestId, name, participants) => {
    const result = await roomModel.findOneAndUpdate(
      { _id },
      {
        contestId,
        name,
        participants,
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await roomModel.deleteOne({ _id });
    return result;
  },
};

module.exports = roomServices;
