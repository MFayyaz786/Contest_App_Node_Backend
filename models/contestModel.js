const mongoose=require("mongoose")
const ContestSchema = new mongoose.Schema({
  contestSpace:{
    type:Number,
    enum:[5,25,60],
    //contest space will be 5 or 35 or 60 hours
  },
  roundPerContest: {
    type: Number,
    required: true,
    default: 4,
  },
  roomsPerContest: {
    type: Number,
    required: true,
    default: 256,
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
},{timestamps:true});

const ContestModel = mongoose.model("Contest", ContestSchema);
module.exports=ContestModel
