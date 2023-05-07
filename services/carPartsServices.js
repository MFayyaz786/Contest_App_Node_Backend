const carPartsModel = require("../models/carPartsModel");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const carPartsServices = {
  get: async () => {
    const result = await carPartsModel.find({}, projection.basicProjection);
    return result;
  },
  getByID: async (_id) => {
    const result = await carPartsModel.findById(
      { _id },
      projection.basicProjection
    );
    return result;
  },
  addNew: async (name,) => {
    user = new carPartsModel({
      name,
    });
    const result = await user.save();
    return result;
  },
  update: async (_id, name) => {
    const result = await carPartsModel.findOneAndUpdate(
      { _id },
      {
        name,
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await carPartsModel.deleteOne({ _id });
    return result;
  },
};

module.exports = carPartsServices;
