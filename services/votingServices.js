const VotingModel = require("../models/votingModel");
const votingServices = {
  getAll: async () => {
    const result = await VotingModel.find();
    return result;
  },

  getById: async (votingId) => {
    const result = await VotingModel.findById(votingId);
    return result;
  },
isVote:async(user,room)=>{
    const result =await VotingModel.findOne({user,room});
    return result;
},
  createVoting: async (user, contest, room, carPart) => {
    const voting = new VotingModel({ user, contest, room, carPart });
    const result = await voting.save();
    return result;
  },

  updateVoting: async ( user, contest, room, carPart) => {
    const result = await VotingModel.findOneAndUpdate(
      { user, contest, room, carPart },
      {$inc:{voteCount:1}},
      { new: true }
    );
    return result;
  },

  deleteVoting: async (votingId) => {
    const result = await VotingModel.findByIdAndDelete(votingId);
    return result;
  },
  topeVoter:async(contestId,top,currentRound)=>{
    const topVotedCarParts = await VotingModel.find({contest:contestId,round:currentRound}).sort({voteCount:-1}).limit(top)
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
  }
};

module.exports = votingServices;
