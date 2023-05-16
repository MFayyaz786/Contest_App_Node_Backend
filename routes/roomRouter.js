const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const roomServices = require("../services/roomServices");
const roomModel = require("../models/roomModel");
const contestServices = require("../services/contestServices");
const OTP = require("../utils/OTP");
const userServices = require("../services/userServices");
const roomRouter = express.Router();
roomRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const result = await roomServices.get();
    res.status(200).send({ msg: "Rooms", data: result });
  })
);
roomRouter.get(
  "/current",
  expressAsyncHandler(async (req, res) => {
    const result = await roomServices.current();
    res.status(200).send({ msg: "Rooms", data: result });
  })
);
roomRouter.get(
  "/details",
  expressAsyncHandler(async (req, res) => {
    let { roomId } = req.query;
    const result = await roomServices.getByID(roomId);
    if (result) {
      return res.status(200).send({ msg: "Room", data: result });
    } else {
      return res.status(404).send({ msg: "Room Not Found" });
    }
  })
);
roomRouter.get(
  "/userActiveRoom",
  expressAsyncHandler(async (req, res) => {
    let { userId,contestId,page } = req.query;
    const result = await roomServices.userActiveRoom(userId,contestId ,page);
    if (result) {
      return res.status(200).send({ msg: "Room", data: result });
    } else {
      return res.status(404).send({ msg: "Not Found" });
    }
  })
);
roomRouter.get(
  "/joinedRoomDetails",
  expressAsyncHandler(async (req, res) => {
    let { userId,page } = req.query;
    console.log(req.query)
    const result = await roomServices.joinedRoomDetails(userId, page);
    if (result) {
      return res.status(200).send({ msg: "Details", data: result });
    } else {
      return res.status(404).send({ msg: "Not Found" });
    }
  })
);
roomRouter.get(
  "/contestRooms",
  expressAsyncHandler(async (req, res) => {
    let { contestId } = req.query;
    console.log(req.query);
    const result = await roomServices.contestRooms(contestId);
    if (result) {
      return res.status(200).send({ msg: "Rooms", data: result });
    } else {
      return res.status(404).send({ msg: "Not Found" });
    }
  })
);
roomRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { contestId,name } = req.body;
    if(!contestId||!name){
      return res.status(400).send({msg:"Fields Missing"})
    }
    const contest=await contestServices.isContest(contestId);
    const countRooms=await roomModel.countDocuments({contestId:contestId});
    console.log(countRooms);
    if (!contest || countRooms > contest.roomsPerContest) {
      return res.status(400).send({ msg: "Contest rooms are completed!" });
    }
    console.log(countRooms);
    const result = await roomServices.addNew(contestId, name);
    if (result) {
      return res.status(201).send({
        msg: "Room created",
        data: result,
      });
    } else {
      return res.status(400).send({ msg: "Failed to create room" });
    }
  })
);
roomRouter.post(
  "/rooms",
  expressAsyncHandler(async (req, res) => {
    const { contestId } = req.body;
    if (!contestId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const contest = await contestServices.isContest( contestId );
    const countRooms = await roomModel.countDocuments({ contestId: contestId });
    if (!contest || countRooms >= contest.roomsPerContest) {
      return res.status(400).send({ msg: "Contest rooms are completed!" });
    }
    const result = await roomServices.createRooms(
      contestId,
      contest.roomsPerContest - countRooms
    );
    if (result) {
      return res.status(201).send({
        msg: "Rooms created",
        data: result,
      });
    } else {
      return res.status(400).send({ msg: "Failed to create rooms" });
    }
  })
);
roomRouter.patch(
  "/joinRoom",
  expressAsyncHandler(async (req, res) => {
    const { userId,contestId,roomId,carPart,image,page } = req.body;
    if(!userId||!contestId||!roomId||!carPart||!image){
      return res.status(400).send({msg:"Fields missing!"})
    }
    const isAvailable=await contestServices.isContest(contestId); 
    if(!isAvailable){
      return res.status(400).send({ msg: "This room contest has been started please join other!" });
    }
    const isRooFull=await roomServices.isRoomFull(contestId,roomId)
    if (isRooFull) {
      return res
        .status(400)
        .send({ msg: "This room is complete please join other!" });
    }
    const isJoined=await roomServices.isJoined(contestId,roomId,userId);
    if(isJoined){
      return res
        .status(400)
        .send({ msg: "You have joined already this room please try other!" });
    }
    const isCarPart=await roomServices.isCarPart(contestId,roomId,carPart);
    if (isCarPart) {
      return res
        .status(400)
        .send({ msg: "Already selected car part for this room please try other!" });
    }
    const isVotedCarPart=await roomServices.isVotedCarPart(contestId,userId,carPart);
    if(isVotedCarPart){
      return res
        .status(400)
        .send({
          msg: "You have joined already for this car part please try other!",
        });
    }
    const result = await roomServices.update(
      roomId,
      contestId,
      userId,
      carPart,
      image,
      page,
    );
    if (result) {
      await userServices.saveJoinedRoom(userId,contestId,page)
      return res.status(200).send({ msg: "You have  joined the room", data: result });
    } else {
      return res.status(400).send({ msg: "Failed!" });
    }
  })
);

roomRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { roomId } = req.query;
    if (!roomId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await roomServices.delete(roomId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "room deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to delete!" });
    }
  })
);
module.exports = roomRouter;
