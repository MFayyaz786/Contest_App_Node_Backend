const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const roomService = require("../services/roomService");
const roomRouter = express.Router();
roomRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const result = await roomService.get();
    res.status(200).send({ msg: "Rooms", data: result });
  })
);
roomRouter.get(
  "/details",
  expressAsyncHandler(async (req, res) => {
    let { partId } = req.query;
    const result = await roomService.getByID(partId);
    if (result) {
      return res.status(200).send({ msg: "Room", data: result });
    } else {
      return res.status(404).send({ msg: "Room Not Found" });
    }
  })
);
roomRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name } = req.body;
    const result = await roomService.addNew(name);
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
roomRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { partId, name } = req.body;
    const result = await roomService.update(partId, name);
    if (result) {
      return res.status(200).send({ msg: "Updated", data: result });
    } else {
      return res.status(400).send({ msg: "Failed!" });
    }
  })
);
roomRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { partId } = req.query;
    if (!partId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await roomService.delete(partId);
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
