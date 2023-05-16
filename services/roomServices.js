const roomModel = require("../models/roomModel");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const OTP = require("../utils/OTP");
const ContestModel = require("../models/contestModel");
const contestServices = require("./contestServices");
const votingModel = require("../models/votingModel");
const runCronJob = require("../utils/runCronJob");
const updateContestRoomCount = require("../utils/updateContestRoomCount");
const uploadFile = require("../utils/uploadFile");
const userModel = require("../models/userModel");
const roomServices = {
  get: async () => {
    const result = await roomModel.find({}, projection.basicProjection);
    return result;
  },
  current: async () => {
    const result = await roomModel
      .find({ isCompleted: false }, projection.basicProjection)
      .sort({ currentParticipants: +1 })
      .limit(3);
    return result;
  },
  getByID: async (_id) => {
    const result = await roomModel.findById(
      { _id },
      projection.basicProjection
    );
    return result;
  },
  joinedRoomDetails: async (userId, page) => {
    const result = await roomModel.findOne({
      "participants.page": { $eq: page },
      "participants.userId": { $eq: userId },
    });
    console.log(result);
    return result;
  },
  contestRooms: async (contestId) => {
    const result = await roomModel.find({
      contestId: { $eq: contestId },
    });
    return result;
  },
  toppers:async(contestId,round)=>{
    console.log(contestId,round)
    let result = await votingModel.aggregate([
      {
        $match: {
          contest: new mongoose.Types.ObjectId(contestId),
          round: parseInt(round),
        },
      },
      {
        $lookup: {
          from: "contests", // Replace "contests" with the actual collection name for contests
          localField: "contest",
          foreignField: "_id",
          as: "contest",
        },
      },
      {
        $unwind: "$contest",
      },
      {
        $group: {
          _id: "$room",
          maxVoteCount: { $max: "$voteCount" },
          participants: {
            $push: {
              room: "$_id",
              contestId: "$contest._id",
              user: "$user",
              carPart: "$carPart",
              image: "$image",
              voteCount: "$voteCount",
            },
          },
        },
      },
    ]);
  const roomTopper=await getTopVoterParticipants(result);
  console.log(result[0].participants[0].contestId)
    return roomTopper;
  },
userActiveRoom:async(userId,contestId,page)=>{
  const contest=await ContestModel.findOne({_id:contestId,$or:[{status:{$eq:'active'}},{status:{$eq:'created'}}]});
  console.log(contest);
  if(contest){
 const result = await roomModel
   .findOne({
     contestId: contest._id,
     round: contest.currentRound,
     "participants.userId": userId,
     "participants.page": page,
   })
   .populate([
     {
       path: "contestId", // Specify the fields you want to select from the populated document
     },
     {
       path: "participants.carPart", // Specify the fields you want to select from the populated document
     },
   ]);
   if(result){
    return result
   }else{
     await removeContestAndPage(userId, contestId, page);
     return false;
   }
  }else{
    await removeContestAndPage(userId,contestId,page)
    return false
  }
  },
  
  isJoined: async (contestId, _id, userId) => {
    const result = await roomModel.findOne({
      _id,
      contestId,
      "participants.userId": userId,
    });
    return result;
  },
  isVotedCarPart: async (contestId, userId, carPart) => {
    const result = await roomModel.findOne({
      contestId,
      "participants.userId": userId,
      "participants.carPart": carPart,
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
  createRooms: async (contestId, roomsLimit, currentRound) => {
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
          round: currentRound,
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
  isRoomFull: async (contestId, _id) => {
    const result = await roomModel.findOne({
      contestId: contestId,
      _id: _id,
      isCompleted: true,
    });
    return result;
  },
  update: async (_id, contestId, userId, carPart, image, page) => {
    if (image) {
      image = await uploadFile(image);
    }
    console.log(image);
    const result = await roomModel.findOneAndUpdate(
      { _id, contestId },
      {
        $push: {
          participants: {
            page: page,
            userId: userId,
            carPart: carPart,
            image: image,
          },
        },
        $inc: { currentParticipants: 1 },
      },
      { new: true }
    );
    console.log(result);
    if (result.currentParticipants === result.maxParticipants) {
      Promise.all([
        await roomModel.updateOne(
          { _id: _id },
          { $set: { isCompleted: true } }
        ),
        await updateContestRoomCount(contestId),
      ]);
    }
   // Create a new voting entry
    if (result) {
      const newVote = new votingModel({
        user: userId,
        contest: contestId,
        room: _id,
        carPart: carPart,
        image,
      });
      await newVote.save();
    }
    return result;
  },

  updateRoomStatus: async (id) => {
    await roomModel.updateOne({ _id: id }, { $set: { isCompleted: true } });
  },
  isCarPart: async (contestId, roomId, carPart) => {
    const result = await roomModel.findOne({
      _id: roomId,
      contestId: contestId,
      "participants.carPart": carPart,
    });
    return result;
  },
  delete: async (_id) => {
    const result = await roomModel.deleteOne({ _id });
    return result;
  },
  joiningNextRoundRoom: async (_id, contestId, userId, carPart) => {
    const result = await roomModel.findOneAndUpdate(
      { _id, contestId },
      {
        $push: {
          participants: {
            userId: userId,
            carPart: carPart,
          },
        },
        $inc: { currentParticipants: 1 },
      },
      { new: true }
    );
    return result;
  },
};
async function removeContestAndPage(userId, contestId, page) {
  try {
    const user = await userModel.findOneAndUpdate(
      { _id: userId },
      { $pull: { joinedContests: { contest: contestId, page: page } } },
      { new: true }
    );

    return user;
  } catch (error) {
    // Handle error
    console.error(error);
    throw error;
  }
}
module.exports = roomServices;
