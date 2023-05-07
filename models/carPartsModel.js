const mongoose = require("mongoose");

const CarPartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique:true
  },
 active:{
  type:Boolean,
  default:true
 }
});
const carPartsModel=mongoose.model("CarParts",CarPartSchema);
module.exports=carPartsModel