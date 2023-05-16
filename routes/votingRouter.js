const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const votingServices = require("../services/votingServices");

const votingRouter = express.Router();

votingRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const result = await votingServices.getAll();
    res.status(200).send({ msg: "Voting", data: result });
  })
);

votingRouter.get(
  "/details",
  expressAsyncHandler(async (req, res) => {
    const { votingId } = req.query;
    const result = await votingServices.getById(votingId);
    if (result) {
      return res.status(200).send({ msg: "Voting Details", data: result });
    } else {
      return res.status(404).send({ msg: "Voting Not Found" });
    }
  })
);

votingRouter.post(
  "/castVote",
  expressAsyncHandler(async (req, res) => {
    const {userId , contestId, roomId, carPart } = req.body;
    const isVote=await votingServices.isVote(userId,roomId);
    if(isVote){
    return res.status(400).send({msg:'you have voted already for this room!'})
    }
    const result = await votingServices.createVoting(userId , contestId, roomId, carPart);
    if (result) {
      return res.status(200).send({ msg: "Success", data: result });
    } else {
      return res.status(400).send({ msg: "Failed!" });
    }
  })
);

votingRouter.patch(
  "/castVote",
  expressAsyncHandler(async (req, res) => {
    const {  contest, room, carPart } = req.body;
    const result = await votingServices.updateVoting(contest, room, carPart);
    if (result) {
      return res.status(200).send({ msg: "Voting Updated", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to update voting" });
    }
  })
);
votingRouter.get(
  "/toppers",
  expressAsyncHandler(async (req, res) => {
    let { contestId, round } = req.query;
    const result = await votingServices.toppers(contestId, round);
    if (result) {
      return res.status(200).send({ msg: "Room", data: result });
    } else {
      return res.status(404).send({ msg: "Room Not Found" });
    }
  })
);
votingRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { votingId } = req.query;
    if (!votingId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await votingServices.deleteVoting(votingId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "Voting deleted", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to delete voting" });
    }
  })
);

module.exports = votingRouter;
