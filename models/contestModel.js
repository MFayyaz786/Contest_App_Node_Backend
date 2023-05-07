const ContestSchema = new mongoose.Schema({
  rounds: {
    type: Number,
    required: true,
    default: 4,
  },
  roomsPerRound: {
    type: Number,
    required: true,
    default: 256,
  },
  maxParticipantsPerRoom: {
    type: Number,
    required: true,
    default: 4,
  },
  timePerRound: {
    type: Number,
    enum: [1, 5, 12],
    required: true,
    default: 1,
  },
  currentRound: {
    type: Number,
    default: 1,
  },
});

const CarPart = mongoose.model("CarPart", CarPartSchema);
const Room = mongoose.model("Room", RoomSchema);
const User = mongoose.model("User", UserSchema);
const Contest = mongoose.model("Contest", ContestSchema);
