const ContestModel = require("../models/contestModel");
const runCronJob = require("./runCronJob");
const cron = require("node-cron");
const votingServices = require("../services/votingServices");
const roomServices = require("../services/roomServices");
const roomModel = require("../models/roomModel");
const votingModel = require("../models/votingModel");
const OTP=require("./OTP")
const { default: mongoose } = require("mongoose");
const updateContestRoomCount= async (contestId) => {
    const result = await ContestModel.findOneAndUpdate(
      { _id: contestId },
      { $inc: { currentParticipantsRooms: +1 } },{new:true}
    );
    console.log(result);
    if (result && result.currentParticipantsRooms === result.roomsPerContest) {
          console.log("inner",result);
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
  }
  const cronJob= async (
    contestId,
    contestSpace,
    roundPerContest,
    roomsPerContest
  ) => {
    console.log(contestId, contestSpace, roundPerContest, roomsPerContest);
    let currentRound = 1;
    let repetitions = 0;
    const maxRepetitions = roundPerContest;
    const roundPerContests = roundPerContest;
    let roomsPerContests = roomsPerContest;
     let roundSpace = 3;
    // Run the cron job every `roundSpace` minutes
   const task= cron.schedule(`*/${roundSpace} * * * *`, async () => {
      const completedRooms = await roomModel.countDocuments({
        contestId,
        round: currentRound,
      });
      const toppers = await votingServices.topeVoter(
          contestId,
          completedRooms,
         currentRound
        );
        
      const createNewRooms = await createRooms(
        contestId,
         completedRooms / maxRepetitions,
         currentRound + 1
         );
         // console.log(createNewRooms, createNewRooms.length);
      // roomServices.createRooms(
      //   contestId,
      //   completedRooms / maxRepetitions,
      //   currentRound + 1
      // );

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
            console.log(topper.carPart.toString());
            await joiningNextRoundRoom(
            contestId,
              room._id.toString(),
              topper.user.toString(),
              topper.carPart.toString()
            );
          const newRoo=await createNewVotingDocs( contestId,
              room._id,
              topper.user,
              topper.carPart,currentRound+1);
                          console.log("new room", newRoo);

          }
        }
      }

       console.log("Cron job executed!");
      currentRound++;
      rounds++;
      repetitions++;

      if (repetitions >= maxRepetitions) {
        await ContestModel.updateOne(
          { _id: contestId },
          { status: "completed" }
        );
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

   const createRooms= async (contestId, roomsLimit, currentRound) => {
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
 const joiningNextRoundRoom = async (contestId, _id, userId, carPart) => {
   const result = await roomModel.findOneAndUpdate(
     { _id: _id, contestId: contestId },
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
   if (result.currentParticipants === result.maxParticipants) {
     await roomModel.updateOne({ _id: _id }, { isCompleted: true });
   }
   return result;
 };
 const createNewVotingDocs=async(contestId,_id,userId,carPart,round)=>{
   const newVote = new votingModel({
      user: userId,
      contest: contestId,
      room: _id,
      carPart: carPart,
      round:round
    });
    const result=await newVote.save();
    return result;
 }
   module.exports = updateContestRoomCount;