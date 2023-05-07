const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const bcrypt = require("bcrypt");
const {uuidv4}=require("uuidv4")
const moment = require("moment");
const jwtServices = require("../utils/jwtServices");
const authIdServices = require("./authIdServices");
const uploadFile = require("../utils/uploadFile");
const userServices = {
  get: async () => {
    const result = await userModel.find({}, projection.basicProjection);
    return result;
  },
  isUser: async (email) => {
    const result = await userModel.findOne(
      { email },
      projection.basicProjection
    );
    return result;
  },
  getByUserID: async (_id) => {
    const result = await userModel.findById(
      { _id },
      projection.basicProjection
    );
    return result;
  },
  validatePassword: async (password, realPassword) => {
    console.log(password, realPassword);
    const valid = await bcrypt.compare(password, realPassword);
    return valid;
  },
  login: async (email) => {
    const user = await userModel
      .findOne(
        { email: email },
        { otp: 0, token: 0, otpExpire: 0, createdAt: 0, updatedAt: 0, __v: 0 }
      )
      .lean();
    if (user) {
      const uuid = uuidv4;
      const refreshToken = jwtServices.create({ uuid, type: "user" });
      const accessToken = jwtServices.create(
        { userId: user._id, type: "user" },
        "5m"
      );
      authIdServices.add(user._id, uuid);
      await userModel.findOneAndUpdate(
        { _id: user._id },
        { token: accessToken }
      );
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
    }
    return user;
  },
  addNew: async (name, email, password, contact) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    let current = new Date(new Date().toDateString());
    current = moment(current).format("MM,DD,YYYY");
    console.log(current);
    user = new userModel({
      name,
      email,
      password,
      contact,
    });
    const result = await user.save();
    return result;
  },
  updateOtp: async (email, otp) => {
    var otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 3);
    const customer = await userModel.findOneAndUpdate(
      { email: email },
      { otp, otpExpire: otpExpiry },
      { new: true }
    );

    return customer;
  },
  verifyOTP: async (email, otp) => {
    const verify = await userModel.findOneAndUpdate(
      { email: email, otp: otp },
      { otp: null }
    );
    return verify;
  },
  otpExpiryValidation: async (email) => {
    const validate = await userModel.findOne({
      email: email,
      otpExpire: { $gte: new Date() },
    });
    return validate;
  },
  setNewPassword: async (_id, password) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await userModel.findOneAndUpdate(
      { _id: _id },
      {
        password,
      },
      {
        new: true,
      }
    );
    return result;
  },
  forgotPassword: async (email, password) => {
    console.log(email, password);
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await userModel.findOneAndUpdate(
      { email },
      { password },
      { new: true }
    );
    return result;
  },
  update: async (_id, name, contact) => {
    const result = await userModel.findOneAndUpdate(
      { _id },
      {
        name,
        contact,
      },
      { new: true }
    );
    return result;
  },
  uploadImage: async (_id, image) => {
    if(image){
      image=await uploadFile(image);
    const result = await userModel.findOneAndUpdate(
      { _id },
      {
        image,
      },
      { new: true }
    );
    return result
    }
    return false;
  },
  delete: async (_id) => {
    const result = await userModel.deleteOne({ _id });
    return result;
  },
};

module.exports = userServices;
