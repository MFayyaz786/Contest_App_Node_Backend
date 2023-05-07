const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const carPartsServices = require("../services/carPartsServices");
const carPartsRouter = express.Router();
carPartsRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const result = await carPartsServices.get();
    res.status(200).send({ msg: "Car Parts", data: result });
  })
);
carPartsRouter.get(
  "/details",
  expressAsyncHandler(async (req, res) => {
    let { partId } = req.query;
    const result = await carPartsServices.getByID(partId);
    if (result) {
      return res.status(200).send({ msg: "Car Part", data: result });
    } else {
      return res.status(404).send({ msg: "Cart Part Not Found" });
    }
  })
);
carPartsRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name, } = req.body;
    const result = await carPartsServices.addNew(name);
    if (result) {
      return res.status(201).send({
        msg: "Car Part Added",
        data: result,
      });
    } else {
      return res.status(400).send({ msg: "Failed to add car part" });
    }
  })
);
carPartsRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { partId, name } = req.body;
    const result = await carPartsServices.update(partId, name);
    if (result) {
      return res.status(200).send({ msg: "Updated",data:result });
    } else {
      return res.status(400).send({ msg: "Failed!" });
    }
  })
);
carPartsRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { partId } = req.query;
    if (!partId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await carPartsServices.delete(partId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "Car part deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to delete!" });
    }
  })
);
module.exports = carPartsRouter;
