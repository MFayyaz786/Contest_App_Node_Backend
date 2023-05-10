const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const contestServices = require("../services/contestServices");
const contestRouter = express.Router();
contestRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const result = await contestServices.get();
    res.status(200).send({ msg: "Contests", data: result });
  })
);
contestRouter.get(
  "/current",
  expressAsyncHandler(async (req, res) => {
    const result = await contestServices.currentContest();
    res.status(200).send({ msg: "Contests", data: result });
  })
);
contestRouter.get(
  "/details",
  expressAsyncHandler(async (req, res) => {
    let { contestId } = req.query;
    const result = await contestServices.getByID(contestId);
    if (result) {
      return res.status(200).send({ msg: "Contest  ", data: result });
    } else {
      return res.status(404).send({ msg: " Not Found" });
    }
  })
);
contestRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { contestSpace } = req.body;
    const result = await contestServices.addNew(contestSpace);
    if (result) {
      return res.status(201).send({
        msg: "Contest created",
        data: result,
      });
    } else {
      return res.status(400).send({ msg: "Failed to create" });
    }
  })
);
contestRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { contestId, name } = req.body;
    const result = await contestServices.update(contestId, name);
    if (result) {
      return res.status(200).send({ msg: "Updated", data: result });
    } else {
      return res.status(400).send({ msg: "Failed!" });
    }
  })
);
contestRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { contestId } = req.query;
    if (!contestId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await contestServices.delete(contestId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "Contest deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to delete!" });
    }
  })
);
module.exports = contestRouter;
