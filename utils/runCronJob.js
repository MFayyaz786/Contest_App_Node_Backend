const cron = require("node-cron");
const votingServices = require("../services/votingServices");
const roomServices = require("../services/roomServices");
const roomModel = require("../models/roomModel");
const votingModel = require("../models/votingModel");
const ContestModel = require("../models/contestModel");
const runCronJob = {
  cronJob: async (
    contestId,
    contestSpace,
    roundPerContest,
    roomsPerContest
  ) => {
    // let currentRound = 1;
    // let repetitions = 0;
    // const maxRepetitions = roundPerContest;
    // const roundPerContests = roundPerContest;
    // let roomsPerContests = roomsPerContest;
    // let roundSpace = contestSpace / 5;

    // Run the cron job every `roundSpace` minutes
    cron.schedule(`0/1 * * *`, async () => {
      // const completedRooms = await roomModel.countDocuments({
      //   contestId,
      //   round: currentRound,
      // });

      // const toppers = await votingServices.topeVoter(
      //   contestId,
      //   completedRooms,
      //   currentRound
      // );

      // const createRooms = await roomServices.createRooms(
      //   contestId,
      //   completedRooms / maxRepetitions,
      //   currentRound + 1
      // );

      // if (createRooms) {
      //   for (var i = 1; i <= createRooms.length; i++) {
      //     const room = createRooms[i];
      //     // Get the top 4 toppers for the current room
      //     const topToppers = toppers.filter((topper, index) => index < 4);
      //     // Join each top topper to the current room
      //     for (const topper of topToppers) {
      //       await roomServices.joiningNextRoundRoom(
      //         contestId,
      //         room._id,
      //         topper.user,
      //         topper.carPart
      //       );
      //     }
      //   }
      // }

      console.log("Cron job executed!");
      //   currentRound++;
      //   rounds++;
      //   repetitions++;

      //   if (repetitions >= maxRepetitions) {
      //     await ContestModel.updateOne({ _id: contestId }, { status: "completed" });
      //     await votingModel.updateOne(
      //       {
      //         contestId,
      //         user: toppers.user,
      //         room: toppers.room,
      //         carPart: toppers.carPart,
      //       },
      //       { winner: true }
      //     );

      //     task.stop();
      //     console.log(
      //       "Cron job stopped after reaching the maximum number of repetitions."
      //     );
      //   }
    });

    // // Store the parameter values in local variables
    // const storedContestId = contestId;
    // const storedCurrentRound = currentRound;
    // const storedRoundPerContest = roundPerContest;
    // const storedRoomsPerContest = roomsPerContest;

    // // Access the stored parameter values during subsequent repetitions
    // task.on("run", () => {
    //   console.log("Stored Contest ID:", storedContestId);
    //   console.log("Stored Current Round:", storedCurrentRound);
    //   console.log("Stored Round Per Contest:", storedRoundPerContest);
    //   console.log("Stored Rooms Per Contest:", storedRoomsPerContest);
    // });
  },
};
module.exports = runCronJob;
