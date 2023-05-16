const { response } = require("express");
const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const userServices = require("../services/userServices");
const OTP = require("../utils/OTP.js");
const passwordValidator = require("../utils/passwordValidator");
const { uuidv4 } = require("uuidv4");
const jwtServices = require("../utils/jwtServices");
const authIdServices = require("../services/authIdServices");
const userRouter = express.Router();
userRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const result = await userServices.get();
    res.status(200).send({ msg: "users", data: result });
  })
);
userRouter.get(
  "/details",
  expressAsyncHandler(async (req, res) => {
    let { userId } = req.query;
    const result = await userServices.getByUserID(userId);
    if (result) {
      return res.status(200).send({ msg: "user", data: result });
    } else {
      return res.status(400).send({ msg: "User Not Found" });
    }
  })
);
userRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name, email, password,  contact } =
      req.body;
       const User = await userServices.isUser(email);
       if (User) {
         res.status(400).send({
           msg: "This email already registered",
         });
         return;
       }
    if (!name || !email || !password ||  !contact ) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    if (!passwordValidator.schema.validate(password)) {
      return res.status(400).send({
        msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",

        //validator.schema.validate(password, { list: true }),
      });
    }
    const result = await userServices.addNew(
      name,
      email,
      password,
      contact,
    );
    if (result) {
      const uuid = uuidv4;
     // const refreshToken = jwtServices.create({ uuid, type: "user" });
      const accessToken = jwtServices.create(
        { userId: result._id, type: "user" },
        "5m"
      );
      authIdServices.add(result._id, uuid);
      return res.status(201).send({
        msg: "User Registered Successfully",
        data: result,
        accessToken
      });
    } else {
      return res.status(400).send({ msg: "User Not Registered!" });
    }
  })
);
userRouter.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const user = await userServices.login(email);
    if (user) {
      const validatePassword = await userServices.validatePassword(
        password,
        user.password
      );
      if (validatePassword) {
        res.status(200).send({
          msg: "Login Successfully",
          data: user,
        });
      } else {
        res.status(401).send({
          msg: "Invalid Credentials!",
        });
      }
    } else {
      res.status(401).send({
        msg: "Invalid Credentials!",
      });
    }
  })
);
userRouter.post(
  "/sendOtp",
  expressAsyncHandler(async (req, res) => {
    const { email } = req.body;
    const otp = OTP();
    const result = await userServices.updateOtp(email, 1111);
    if (result) {
      // const sendMail = await sendEmail(email, otp);
      // if (!sendMail) {
      //   res.status(400).json({ msg: "OTP not sent" });
      // }
      res.status(200).json({ msg: "OTP sent" });
    } else {
      res.status(400).json({ msg: "OTP not sent" });
    }
  })
);
userRouter.post(
  "/verifyOtp",
  expressAsyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if(!email||!otp){
      return res.status(400).send({msg:"email and otp required!"})
    }
    const verifyExpireOtp = await userServices.otpExpiryValidation(email);
    if (!verifyExpireOtp) {
      res.status(400).send({
        msg: "Otp Expire please try again!",
      });
    } else {
      const verifyOtp = await userServices.verifyOTP(email, otp);
      if (verifyOtp) {
        res.status(200).send({ msg: "OTP Verified" });
      } else {
        res.status(400).send({ msg: "Invalid OTP" });
      }
    }
  })
);
userRouter.post(
  "/resetPassword",
  expressAsyncHandler(async (req, res) => {
    const { userId, password, reEnterPassword } = req.body;
    console.log(password, reEnterPassword);
    if (password !== reEnterPassword) {
      return res.status(400).send({ msg: "Passwords Don't Match" });
    }
    if (!passwordValidator.schema.validate(password)) {
      return res.status(400).send({
        msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",

        //validator.schema.validate(password, { list: true }),
      });
    }
    const result = await userServices.setNewPassword(userId, password);
    if (result) {
      res.status(200).json({ msg: "Password reset" });
    } else {
      res.status(400).json({ msg: "password failed to reset!" });
    }
  })
);
userRouter.post(
  "/forgotPassword",
  expressAsyncHandler(async (req, res) => {
    const { email, password, reEnterPassword } = req.body;
    if (!email || !password || !reEnterPassword) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    if (password !== reEnterPassword) {
      res.status(400).send({
        msg: "Password And reEnterPassword don't Match",
      });
    }
    if (!passwordValidator.schema.validate(password)) {
      return res.status(400).send({
        msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",

        //validator.schema.validate(password, { list: true }),
      });
    }
    const result = await userServices.forgotPassword(email, password);
    if (result) {
      return res.status(200).send({ msg: "Password Updated"});
    } else {
      return res.status(400).send({ msg: "Password not Updated" });
    }
  })
);
userRouter.patch(
  "/uploadImage",
  expressAsyncHandler(async (req, res) => {
    const { userId, image } = req.body;
    const result = await userServices.uploadImage(userId, image);
    if (result) {
      return res
        .status(200)
        .send({ msg: "profile image upload successfully" });
    } else {
      return res.status(400).send({ msg: "Failed to upload!" });
    }
  })
);
userRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { userId, name, contact } =
      req.body;
    const result = await userServices.update(
      userId,
      name,
      contact,
    );
    if (result) {
      return res.status(200).send({ msg: "User profile updated", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to reset" });
    }
  })
);
userRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await userServices.delete(userId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "User deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "User not deleted" });
    }
  })
);

userRouter.post(
  "/refreshToken",
  expressAsyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const verifyToken = jwtServices.authenticate(refreshToken);
    if (verifyToken) {
      const { uuid, type } = verifyToken;
      const AuthId = await authIdServices.findByUUID(uuid);
      if (AuthId) {
        const { userId } = AuthId;
        if (userId) {
          const accessToken = jwtServices.create({ userId, type }, "5m");
          res.status(200).send({ msg: "access Token", data: { accessToken } });
        } else {
          res.status(401).send({ msg: "Login please" });
        }
      } else {
        res.status(401).send({ msg: "Login please" });
      }
    } else {
      res.status(401).send({ msg: "Login please" });
    }
  })
);
module.exports = userRouter;
