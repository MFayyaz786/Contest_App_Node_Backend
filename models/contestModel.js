const mongoose=require("mongoose")
const ContestSchema = new mongoose.Schema(
  {
    page: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
      default:1,
    },
    contestSpace: {
      type: Number,
      enum: [40, 25, 60],
      //contest space will be 5 or 35 or 60 hours
    },
    roundPerContest: {
      type: Number,
      required: true,
      default: 3,
    },
    roomsPerContest: {
      type: Number,
      required: true,
      default: 4,
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
