const ContestModel = require("../models/contestModel");
const runCronJob = require("./services");
const cron = require("node-cron");
const votingServices = require("../services/votingServices");
const roomServices = require("../services/roomServices");
const roomModel = require("../models/roomModel");
const votingModel = require("../models/votingModel");
const OTP = require("./OTP");
const { default: mongoose } = require("mongoose");
const updateContestRoomCount = async (contestId) => {
  const result = await ContestModel.findOneAndUpdate(
    { _id: contestId },
    { $inc: { currentParticipantsRooms: +1 } },
    { new: true }
  );
  if (result && result.currentParticipantsRooms === result.roomsPerContest) {
    Promise.all([
      await ContestModel.findOneAndUpdate(
        { _id: contestId },
        { status: "active" }
      ),
      await cronJob(
        contestId,
        result.contestSpace,
        result.roundPerContest,
        result.roomsPerContest
      ),
    ]);
    return result;
  }
};
const cronJob = async (
  contestId,
  contestSpace,
  roundPerContest,
  roomsPerContest
) => {
  console.log(contestId, contestSpace, roundPerContest, roomsPerContest);
  let currentRound = 1;
  let repetitions = 1;
  const maxRepetitions = roundPerContest;
  const roundPerContests = roundPerContest;
  let roundSpace = contestSpace/5;
 const taskCallback= async () => {
  //const contestId = "64632d0c58c460afe5d926ce";
     await ContestModel.findOneAndUpdate({_id:contestId},{$inc:{currentRound:1}},{new:true})
    console.log(currentRound, repetitions);
    const completedRooms = await roomModel.countDocuments({
      contestId,
      round: currentRound,
    });
    const toppers = await topVotesList(contestId,currentRound);
    console.log(toppers)
    if (currentRound < maxRepetitions) {
      const createNewRooms = await createRooms(
        contestId,
        completedRooms / 2,
        currentRound + 1
      );
      if (createNewRooms.length!==0) {
      await createNewRoomAndModify(contestId,createNewRooms,toppers,currentRound);
      }
    }
    if (repetitions >= maxRepetitions) {
      await ContestModel.updateOne({ _id: contestId }, { status: "completed" });
      await votingModel.updateOne(
        {
          contest:contestId,
          user: toppers[0].user,
          room: toppers[0].roomId,
          carPart: toppers[0].carPart,
        },
        { winner: true }
      );

      task.stop();
      console.log(
        "Cron job stopped after reaching the maximum number of repetitions."
      );
    }
    console.log("Cron job executed!");
    currentRound++;
    repetitions++;
  };
const task = cron.schedule(`*/${roundSpace} * * * *`, taskCallback);
  // Store the parameter values in local variables
  const storedContestId = contestId;
  const storedCurrentRound = currentRound;
  const storedRoundPerContest = roundPerContests;
  const storedRoomsPerContest = maxRepetitions;

  // Access the stored parameter values during subsequent repetitions
  task.on("run", () => {
    console.log("Stored Contest ID:", storedContestId);
    console.log("Stored Current Round:", storedCurrentRound);
    console.log("Stored Round Per Contest:", storedRoundPerContest);
    console.log("Stored Rooms Per Contest:", storedRoomsPerContest);
  });
};
 const createNewRoomAndModify = async (contestId,createNewRooms, toppers,currentRound) => {
   createNewRooms.map(async (room, i) => {
     const topToppers = toppers.slice(
       i * room.maxParticipants,
       i * room.maxParticipants + room.maxParticipants
     );
     // Join each top topper to the current room
     const promises = topToppers.map(async (topper) => {
       var newRo = await joiningNextRoundRoom(
         contestId,
         room._id.toString(),
         topper.user.toString(),
         topper.carPart.toString(),
         topper.image,
         topper.page
       );
       var newVote = await createNewVotingDocs(
         contestId,
         room._id,
         topper.user,
         topper.carPart,
         topper.image,
         currentRound + 1
       );
     });
     await Promise.all(promises);
   });
 };
const createRooms = async (contestId, roomsLimit, currentRound) => {
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
};
const joiningNextRoundRoom = async (
  contestId,
  _id,
  userId,
  carPart,
  image,
  page
) => {
  const result = await roomModel.findOneAndUpdate(
    { _id: _id, contestId: contestId },
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
  if (result.currentParticipants === result.maxParticipants) {
    await roomModel.updateOne({ _id: _id }, { isCompleted: true });
  }
  return result;
};
const createNewVotingDocs = async (contestId, _id, userId, carPart,image, round) => {
  const newVote = new votingModel({
    user: userId,
    contest: contestId,
    room: _id,
    carPart: carPart,
    image:image,
    round: round,
  });
  const result = await newVote.save();
  return result;
};
const topVotesList = async (contestId, round) => {
  console.log(contestId, round);
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
  const roomTopper = await getTopVoterParticipants(result);
  console.log(result[0].participants[0].contestId);
  return roomTopper;
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
        contestId: topVoters[0].contestId,
        user: topVoters[0].user,
        carPart: topVoters[0].carPart,
        image: topVoters[0].image,
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
  }
}

module.exports = updateContestRoomCount;
