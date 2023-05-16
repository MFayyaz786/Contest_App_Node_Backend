const contestModel = require("../models/contestModel");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const runCronJob = require("../utils/runCronJob");
const contestServices = {
  get: async () => {
    const result = await contestModel.find({}, projection.basicProjection);
    return result;
  },
  currentContest: async () => {
    const result = await contestModel.aggregate([
  {
    '$match': {
      'status': 'created'
    }
  }, {
    '$lookup': {
      'from': 'rooms', 
      'localField': '_id', 
      'foreignField': 'contestId', 
      'let': {
        'isCompleted': '$isCompleted'
      }, 
      'pipeline': [
        {
          '$match': {
            '$expr': {
              '$eq': [
                '$isCompleted', false
              ]
            }
          }
        }
      ], 
      'as': 'rooms'
    }
  }, {
    '$project': {
      '_id': 1,
      'currentRound':1,
  'roundPerContest':1,
  'currentParticipantsRooms':1,
  'contestSpace':1,
  'currentRound':1,
  'status':1, 
      'rooms': {
        '$slice': [
          '$rooms', 3
        ]
      }
    }
  }
])
    // find(
    //   {
    //    // page:{$eq:page},
    //    // $or:[{
    //        status:{$eq: "created"}},
    //     //{status:{$eq:'active'}}] },
    //   projection.basicProjection
    // )
    // .populate({
      
    // })
    // .limit(3);
    return result;
  },
active:async()=>{
const contests=await contestModel.find({status:{$eq:"active"}});
return contests
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
  isContestCreated:async(page,contestSpace)=>{
    const result=await contestModel.findOne({page:page,contestSpace:contestSpace,$or:[{status:'created'},{status:'active'}]});
    return result;
  },
  updateContestRoomCount:async(contestId)=>{
   const result=await contestModel.updateOne(
     { _id: contestId },
     { $inc: { currentParticipantsRooms: 1 } }
   );
   if (
     result &&
     result.currentParticipantsRooms===result.roomsPerContest
   ) {
    Promise.all([
     await contestModel.findOneAndUpdate(
       { _id: contestId },
       { $inc: { status: "active" } }
     ),
     runCronJob(contestId,result.contestSpace,result.roundPerContest,result.roomsPerContest)
    ])
   }
   return result;
  },
  addNew: async (contestSpace) => {
    //const contestSpace = 5;
   // const roundSpace = contestSpace / 5;
  const  data = new contestModel({
      contestSpace,
    });
    const result = await data.save();
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
