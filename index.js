const express=require("express");
const app=express();
const dotenv=require("dotenv");
const cors=require("cors");
const bodyParser=require("body-parser");
const morgan=require("morgan")
const errorHandler = require("./middleware/errorHandler");
const userRouter = require("./routes/userRouter");
const path=require("path");
const carPartsRouter = require("./routes/carPartsRouter");
const contestRouter = require("./routes/contestRouter");
const roomRouter = require("./routes/roomRouter");
const votingRouter = require("./routes/votingRouter");
const  cronJob  = require("./utils/updateContestRoomCount");
dotenv.config();
require("./db/index")
const corsOption = {
  origin: "*",
};

 //cronJob(1,1,3)
//hit routes
app.use((req, res, next) => {
  console.log(`Route called: ${req.originalUrl}`);
  next();
});
app.use(morgan("dev"));
app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
//route
app.use("/api/user", userRouter);
app.use("/api/carParts", carPartsRouter);
app.use("/api/contest", contestRouter);
app.use("/api/room", roomRouter);
app.use("/api/voting", votingRouter);





app.get("/", (req, res) => {
  res.status(200).send({ msg: "welcome to contest app" });
});
//error handler
app.use((req, res, next) => {
  res.status(404).send({ msg: "Route Not found" });
});
app.use(errorHandler)
//server 
app.listen(5000,()=>{
console.log(`server is running.. 5000 `);
})