const OTP = require("./OTP");
const ContestModel = require("../models/contestModel");
const cron = require("node-cron");
const votingServices = require("../services/votingServices");
const roomServices = require("../services/roomServices");
const roomModel = require("../models/roomModel");
const votingModel = require("../models/votingModel");
const cronJob = async (
  contestId,
  contestSpace,
  roundPerContest,
  roomsPerContest
) => {
  console.log(contestId, contestSpace, roundPerContest, roomsPerContest);
  let currentRound = 1;
  let repetitions = 0;
  const maxRepetitions =3
  // roundPerContest;
  const roundPerContests = roundPerContest;
  let roundSpace = 20;
  //contestSpace/5;
  //  const toppers = await roomServices.toppers(
  //     contestId,
  //     currentRound
  //   );
  //   // if(!toppers){
  //   //   roundSpace=roundSpace+5
  //   // }
  // Run the cron job every `roundSpace` minutes
  const task = cron.schedule(`*/${roundSpace} * * * *`, async () => {
    const completedRooms = await roomModel.countDocuments({
      contestId,
      round: currentRound,
    });
    const toppers = await roomServices.toppers(
      contestId,
      currentRound
    );
    if(currentRound!=maxRepetitions){
    const createNewRooms = await createRooms(
      contestId,
      completedRooms / maxRepetitions,
      currentRound + 1
    );
    if (createNewRooms) {
      for (var i = 1; i <= createNewRooms.length; i++) {
        const room = createNewRooms[i];
        const maxParticipants = room.maxParticipants;
        // Get the top toppers based on maxParticipants for the current room
        const topToppers = toppers.slice(
          i * maxParticipants,
          i * maxParticipants + maxParticipants
        );
        // console.log(topToppers);
        // Join each top topper to the current room
        for (const topper of topToppers) {
          await joiningNextRoundRoom(
            contestId,
            room._id.toString(),
            topper.user.toString(),
            topper.carPart.toString(),
            topper.image,
            topper.page
          );
          const newRoo = await createNewVotingDocs(
            contestId,
            room._id,
            topper.user,
            topper.carPart,
            currentRound + 1
          );
          console.log("new room", newRoo);
        }
      }
    }
  }
    console.log("Cron job executed!");
    currentRound++;
    repetitions++;
    if (repetitions >= maxRepetitions) {
      await ContestModel.updateOne({ _id: contestId }, { status: "completed" });
      await votingModel.updateOne(
        {
          contestId,
          user: toppers.user,
          room: toppers.room,
          carPart: toppers.carPart,
        },
        { winner: true }
      );

      task.stop();
      console.log(
        "Cron job stopped after reaching the maximum number of repetitions."
      );
    }
  });

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
const joiningNextRoundRoom = async (contestId, _id, userId, carPart,image,page) => {
  const result = await roomModel.findOneAndUpdate(
    { _id: _id, contestId: contestId },
    {
      $push: {
        participants: {
          page:page,
          userId: userId,
          carPart: carPart,
          image:image
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
const createNewVotingDocs = async (contestId, _id, userId, carPart, round) => {
  const newVote = new votingModel({
    user: userId,
    contest: contestId,
    room: _id,
    carPart: carPart,
    round: round,
  });
  const result = await newVote.save();
  return result;
};
module.exports = cronJob;
