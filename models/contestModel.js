const mongoose=require("mongoose")
const ContestSchema = new mongoose.Schema(
  {
    page: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
    },
    contestSpace: {
      type: Number,
      enum: [40, 80, 100],
      //contest space will be 5 or 35 or 60 hours
    },
    roundPerContest: {
      type: Number,
      required: true,
      default: 2,
    },
    roomsPerContest: {
      type: Number,
      required: true,
      default: 8,
    },
    currentParticipantsRooms: {
      type: Number,
      required: true,
      default: 0,
    },
    roundSpace: {
      type: Number,
      enum: [1, 5, 12],
      required: true,
      default: 1,
    },
    currentRound: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["created", "active", "completed"],
      default: "created",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
// ContestSchema.virtual('remainingTime').get(function () {
//   if (this.status !== 'active') {
//     return 0;
//   }

//   const currentTime = Date.now();
//   const contestEndTime = new Date(this.createdAt.getTime() + this.contestSpace * 3600000);

//   return Math.max(contestEndTime - currentTime, 0);
// });

const ContestModel = mongoose.model("Contest", ContestSchema);
module.exports=ContestModel
