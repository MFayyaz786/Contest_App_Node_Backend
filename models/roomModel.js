const { default: mongoose } = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      carPart: {
        type: mongoose.Schema.Types.ObjectId,
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
  isFull: {
    type: Boolean,
    default: false,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});
const roomModel=mongoose.model("Room",RoomSchema);
module.exports=roomModel