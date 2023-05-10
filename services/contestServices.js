const contestModel = require("../models/contestModel");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const contestServices = {
  get: async () => {
    const result = await contestModel.find({}, projection.basicProjection);
    return result;
  },
  currentContest: async () => {
    const result = await contestModel.find(
      { status: "created" },
      projection.basicProjection
    );
    return result;
  },
  getByID: async (_id) => {
    const result = await contestModel.findById(
      { _id },
      projection.basicProjection
    );
    return result;
  },
  isContest: async (_id) => {
    const result = await contestModel.findById(
      { _id, status: "created" },
      projection.basicProjection
    );
    return result;
  },
  addNew: async (contestSpace) => {
    //const contestSpace = 5;
    const roundSpace = contestSpace / 5;
    user = new contestModel({
      contestSpace,
      roundSpace,
    });
    const result = await user.save();
    // if(result){
    //     const
    // }
    return result;
  },
  update: async (_id, name) => {
    const result = await contestModel.findOneAndUpdate(
      { _id },
      {
        name,
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await contestModel.deleteOne({ _id });
    return result;
  },
};

module.exports = contestServices;
