const { default: mongoose } = require("mongoose");

const RoomSchema = new mongoose.Schema({
  contestId:{
    type:mongoose.Types.ObjectId,
    ref:"Contest"
  },
  name: {
    type: String,
    required: true,
  },
  participants: [
    {
      userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
      carPart: {
        type: mongoose.Types.ObjectId,
        ref: "CarPart",
      },
    }
  ],
  maxParticipants: {
    type: Number,
    default: 4,
  },
  currentParticipants: {
    type: Number,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});
const roomModel=mongoose.model("Room",RoomSchema);
module.exports=roomModel