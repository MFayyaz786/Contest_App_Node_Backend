const cron = require("node-cron");
const ContestModel = require("../models/contestModel");
const roomModel = require("../models/roomModel");
const votingModel = require("../models/votingModel");
const ContestHistoryModel = require("../models/ContestHistoryModel");
const { default: mongoose } = require("mongoose");
const userModel = require("../models/userModel");
const handleContests = async () => {
    const taskCallback = async () => {
    console.log("cron job executed")
   const contests = await ContestModel.find({ status: "active" });
  //  console.log(contests)
  // contests.forEach(async(contest) =>
  for(const contest of contests){
    const { _id:contestId, contestSpace, roundPerContest, roomsPerContest ,currentRound,startTime} = contest;
    const differenceHours =  getHourDifference(new Date(startTime),new Date());
    console.log(differenceHours)
    if(differenceHours>=(contestSpace/5)*currentRound){
      const completedRooms = await roomModel.countDocuments({
        contestId,
        round: currentRound,
      });
     // console.log("log",completedRooms);
      const toppers = await topVotesList(contestId, currentRound);
      if (currentRound < roundPerContest) {
        const createNewRooms = await createRooms(
          contestId,
          completedRooms / 2,
          currentRound + 1
        );
               // console.log("createnew roo",createNewRooms);

        if (createNewRooms.length !== 0) {
          await createNewRoomAndModify(
            contestId.toString(),
            createNewRooms,
            toppers,
            currentRound
          );
        }
        await ContestModel.findOneAndUpdate(
          { _id: contestId.toString() },
          { $inc: { currentRound: 1 } },
          { new: true }
        );
      }
      else {
        Promise.all([
          await ContestModel.updateOne(
            { _id: contestId.toString() },
            { status: "completed" }
          ),
          await ContestHistory(contestId.toString(), toppers, currentRound),
          await votingModel.updateOne(
            {
              contest: contestId.toString(),
              user: toppers[0].user,
              room: toppers[0].roomId,
              carPart: toppers[0].carPart,
            },
            { winner: true }
          ),
          await removeContestEntryByContestId(
            contestId.toString(),
          ),
        ]);
       }
    }
    }
}
    cron.schedule(`*/5 * * * *`,taskCallback);
  }

// Start the cron job to handle contests
const getHourDifference = (previousTime, currentTime) => {
  const previous = new Date(previousTime);
  const current = new Date(currentTime);

  // Calculate the difference in milliseconds
  const differenceInMilliseconds = current.getTime() - previous.getTime();

  // Convert milliseconds to hours
  const differenceInHours = differenceInMilliseconds / (1000 * 60 );

  return differenceInHours;
};
const ContestHistory = async (contest, toppers,currentRound) => {
   const top3VotersList=await topVotesList3(contest,currentRound,toppers[0].roomId)
    if (top3VotersList.length!==0){
      for (var i = 0; i< top3VotersList.length; i++) {
        let keyName;
        if(i===0){
         keyName = "troffees.diamond"; 
        }else if(i===1){
          keyName='troffees.gold'
        }else{
          keyName='troffees.silver'
        }
        const updateObj = {};
         updateObj[keyName] = 1;
        console.log(updateObj);
          await userModel.findOneAndUpdate(
            { _id: top3VotersList[i].user },
            { $inc: updateObj }
          );
       // console.log(top3VotersList);
        const data = new ContestHistoryModel({
          contest: new mongoose.Types.ObjectId("6472127d2ce3ef97f2a8032d"),
          room: top3VotersList[i].room,
          user: top3VotersList[i].user,
          carPart: top3VotersList[i].carPart,
          voteCount:top3VotersList[i].voteCount,
          position: i+1,
        });
        const result = await data.save();
      }
    }
  return;
};
const topVotesList3 = async (contestId, currentRound,room) => {
  try {
    const topVoters = await votingModel
      .find({room:room, contest: contestId, round: currentRound })
      .sort({ voteCount: -1, updatedAt: -1 }) // Sort by voteCount in descending order, and then by updatedAt in descending order
      .limit(3); // Retrieve only the top 3 voters
/// Populate the "room" field with the associated room document

    return topVoters;
  } catch (error) {
    console.error(error);
    throw new Error("Error retrieving top voters");
  }
};

// // Example usage
// const previousTime = "2023-05-26T10:30:00Z";
// const currentTime = new Date(); // Current time

// const hourDifference = getHourDifference(previousTime, currentTime);
// console.log(`Hour difference: ${hourDifference}`);
const removeContestEntryByContestId = async (contestId) => {
  // const room=await roomModel.findOne({_id:roomId});
  // if(room){
  console.log(contestId)
  var historyContest = await userModel.updateMany(
    { "joinedContests.contest": contestId },
    { $pull: { joinedContests: { contest: contestId} } }
  );
  if (historyContest){
    await roomModel.deleteMany({ contestId: contestId });
    await votingModel.deleteMany({contest:contestId});
    await ContestModel.deleteOne({_id:contestId})
  }
   return historyContest; // Contest not found
};
const createNewRoomAndModify = async (
  contestId,
  createNewRooms,
  toppers,
  currentRound
) => {
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
        topper.carPart,
        topper.engineerName,
        topper.image,
        topper.page
      );
      var newVote = await createNewVotingDocs(
        contestId,
        room._id,
        topper.user,
        topper.carPart,
        topper.engineerName,
        topper.image,
        currentRound + 1
      );
    });
    await Promise.all(promises);
  });
};
const createRooms = async (contestId, roomsLimit, currentRound) => {
  console.log("result", contestId.toString());
  let roomsArr = [];
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const combinations = getCombinations(currentRound);
    for (var i = 0; i < roomsLimit; i++) {
      const name = combinations[i];
     const user = new roomModel({
        contestId:contestId.toString(),
        name,
        round: currentRound,
      });
      const result = await user.save();
        console.log("result", result);
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
  engineerName,
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
          engineerName: engineerName,
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
const createNewVotingDocs = async (
  contestId,
  _id,
  userId,
  carPart,
  engineerName,
  image,
  round
) => {
  const newVote = new votingModel({
    user: userId,
    contest: contestId,
    room: _id,
    carPart: carPart,
    engineerName: engineerName,
    image: image,
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
        contest: contestId,
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
        // Filter participants with equal votes
        const participantsWithEqualVotes = sortedParticipants.filter(
          (participant, index, participants) =>
            index !== participants.length - 1 &&
            participant.voteCount === participants[index + 1].voteCount
        );

        // Sort participants by updatedAt field in ascending order
        const sortedByUpdatedAt = participantsWithEqualVotes.sort(
          (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)
        );

        // Return any one of the participants with equal votes and nearest updatedAt time
        return sortedByUpdatedAt[0];
      }

      // Get the participants with the highest vote count
      const highestVoteCount = sortedParticipants[0].voteCount;
      const topVoters = sortedParticipants.filter(
        (participant) => participant.voteCount === highestVoteCount
      );
      // if (hasEqualVotes) {
      //   return false;
      // }
      // Get the participants with the highest vote count
      // const highestVoteCount = sortedParticipants[0].voteCount;
      // const topVoters = sortedParticipants.filter(
      //   (participant) => participant.voteCount === highestVoteCount
      // );

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

    // // Check if any room has two participants with equal votes
    // const hasEqualVotes = topVoterParticipants.includes(false);

    // // If any room has two participants with equal votes, return false
    // if (hasEqualVotes) {
    //   return false;
    // }
    return topVoterParticipants;
  } catch (error) {
    // Handle error
  }
}
const getCombinations = (round) => {
  const combinations = [];
  switch (round) {
    case 1:
      for (let i = 0; i < 256; i++) {
        let first = 5;
        const suffix = String.fromCharCode(65 + (i % 26));
        const suffixIteration = Math.floor(i / 26) + 1;
        const alpha = choseAlphabet(first + suffixIteration);
        combinations.push(`${alpha}${suffix}`);
      }
      break;
    case 2:
      for (let i = 0; i < 64; i++) {
        let first = 2;
        const suffix = String.fromCharCode(65 + (i % 26));
        const suffixIteration = Math.floor(i / 26) + 1;
        const alpha = choseAlphabet(first + suffixIteration);
        combinations.push(`${alpha}${suffix}`);
      }
      break;
    case 3:
      for (let i = 0; i < 16; i++) {
        const prefix = String.fromCharCode(65 + Math.floor(i / 26));
        const suffix = String.fromCharCode(65 + (i % 26));
        combinations.push(`C${suffix}`);
      }
      break;
    case 4:
      for (let i = 0; i < 4; i++) {
        const prefix = String.fromCharCode(65 + Math.floor(i / 26));
        const suffix = String.fromCharCode(65 + (i % 26));
        combinations.push(`B${suffix}`);
      }
      break;
    case 5:
      combinations.push("AA");
      break;
    default:
      break;
  }

  return combinations;
};
const choseAlphabet = (select) => {
  const alphabets = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  const selectedAlphabet = alphabets[select];
  return selectedAlphabet;
};
module.exports = handleContests;