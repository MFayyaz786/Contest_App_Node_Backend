const mongoose = require("mongoose");
const { isValidPassword } = require("mongoose-custom-validators");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: isValidPassword,
        message:
          "Password must have at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      },
    },
    contact: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "images/profile.png",
    },
    otp: {
      type: Number,
      default: null,
    },
    otpExpire: {
      type: Date,
    },
    token: {
      type: String,
      default: null,
    },
    votes: {
      type: Number,
      default: 0,
    },
    friendsInvited: {
      type: Number,
      default: 0,
    },
    slotsUnlocked: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const userModel = new mongoose.model("User", schema);
module.exports = userModel;
