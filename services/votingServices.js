const { default: mongoose } = require("mongoose");
const roomModel = require("../models/roomModel");
const VotingModel = require("../models/votingModel");
const votingModel = require("../models/votingModel");
const votingServices = {
  getAll: async () => {
    const result = await VotingModel.find();
    return result;
  },

  getById: async (votingId) => {
    const result = await VotingModel.findById(votingId);
    return result;
  },
  isVote: async (user, room) => {
    const result = await VotingModel.findOne({ voters:{$in:user}, room:{$eq:room} });
    return result;
  },
  toppers:async(contestId,round)=>{
    console.log(contestId,round)
    let result = await VotingModel.aggregate([
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
  createVoting: async (user, contest, room, carPart) => {
    console.log(user,contest,room,carPart);
    const result = await votingModel.findOneAndUpdate(
      {
        room: room,
        contest: contest,
        user: user,
        carPart: carPart
     
      },
      { $inc: { voteCount: 1 },$push:{voters:user} },{new:true}
    );
    return result;
  },
  updateVoting: async (user, contest, room, carPart) => {
    const result = await VotingModel.findOneAndUpdate(
      { user, contest, room, carPart },
      { $inc: { voteCount: 1 } },
      { new: true }
    );
    return result;
  },

  deleteVoting: async (votingId) => {
    const result = await VotingModel.findByIdAndDelete(votingId);
    return result;
  },
  topeVoter: async (contestId, top, currentRound) => {
    const topVotedCarParts = await VotingModel.find({
      contest: contestId,
      round: currentRound,
    })
      .sort({ voteCount: -1 })
      .limit(top);
    //aggregate([
    //      { $match: { contest: contestId, round: currentRound } },
    //      {
    //        $group: {
    //         _id: { room: "$room", carPart: "$carPart" },
    //          user: { $first: "$user" },
    //          totalVotes: { $sum: "$voteCount" },
    //        },
    //      },
    //      { $sort: { room: 1, totalVotes: -1 } },
    //      {
    //        $group: {
    //          _id: "$_id",
    //          room: { $first: "$_id" },
    //          carPart: { $first: "$carPart" },
    //          user:{$first:"$user"},
    //          totalVotes: { $first: "$totalVotes" },
    //        },
    //      },
    //      { $sort: { totalVotes: -1 } },
    //      { $limit: top },
    //    ]);
    return topVotedCarParts;
  },
};
async function getTopVoterParticipants(result) {
  try {
    const topVoterParticipants = result.map((room) => {
      var sortedParticipants = room.participants.sort(
        (a, b) => b.voteCount - a.voteCount
      );
      const hasEqualVotes = sortedParticipants.some(
        (participant, index, participants) =>
          index !== participants.length - 1 &&
          participant.voteCount === participants[index + 1].voteCount
      );
      if (hasEqualVotes) {
        return false;
      }
      // Get the participants with the highest vote count
      const highestVoteCount = sortedParticipants[0].voteCount;
      const topVoters = sortedParticipants.filter(
        (participant) => participant.voteCount === highestVoteCount
      );

      // Return the top voter participant
      return {
        roomId: room._id,
        contestId:topVoters[0].contestId,
        user: topVoters[0].user,
        carPart: topVoters[0].carPart,
        image:topVoters[0].image,
        voteCount: topVoters[0].voteCount,
      };
    });

    // Check if any room has two participants with equal votes
    const hasEqualVotes = topVoterParticipants.includes(false);

    // If any room has two participants with equal votes, return false
    if (hasEqualVotes) {
      return false;
    }
    return topVoterParticipants;
  } catch (error) {
    // Handle error
  }}
module.exports = votingServices;
