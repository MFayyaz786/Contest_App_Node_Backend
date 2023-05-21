const { default: mongoose } = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Types.ObjectId,
      ref: "Contest",
    },
    srNo:{
      type:Number
    },
    name: {
      type: String,
      required: true,
    },
    round: {
      type: Number,
      default: 1,
    },
    participants: [
      {
        page: {
          type: Number,
        },
        engineerName: {
          type: String,
        },
        userId: {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
        carPart: {
          type: String,
        },
        // carPart: {
        //   type: mongoose.Types.ObjectId,
        //   ref: "CarParts",
        // },
        image: {
          type: String,
          default: "images/profile.png",
        },
      },
    ],
    maxParticipants: {
      type: Number,
      default: 2,
    },
    currentParticipants: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const roomModel=mongoose.model("Room",RoomSchema);
module.exports=roomModel