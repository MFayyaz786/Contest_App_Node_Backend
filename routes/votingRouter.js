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
  "/",
  expressAsyncHandler(async (req, res) => {
    const { user, contest, room, carPart } = req.body;
    const isVote=await votingServices.isVote(user,room);
    if(isVote){
    return res.status(400).send({msg:'you have voted already for this room!'})
    }
    const result = await votingServices.createVoting(user, contest, room, carPart);
    if (result) {
      return res.status(201).send({ msg: "Voting Created", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to create voting" });
    }
  })
);

votingRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { votingId, user, contest, room, carPart } = req.body;
    const result = await votingServices.updateVoting( user, contest, room, carPart);
    if (result) {
      return res.status(200).send({ msg: "Voting Updated", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to update voting" });
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
