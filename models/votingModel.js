const mongoose = require("mongoose");

const votingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest" },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  carPart: { type: mongoose.Schema.Types.ObjectId, ref: "CarPart" },
  image:{type:String},
  voters: [mongoose.Types.ObjectId],
  voteCount: { type: Number, default: 0 },
  round: { type: Number, default: 1 },
  winner: { type: Boolean, default: false },
  // Add more fields as needed
});

const votingModel = mongoose.model("Voting", votingSchema);
module.exports=votingModel
