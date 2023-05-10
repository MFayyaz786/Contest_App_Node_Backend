const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roundSchema = new Schema({
  contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
  roundNumber: { type: Number, required: true },
  roomResults: [
    {
      roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
      carPart:{type:Schema.Types.ObjectId,ref:"CartPart"},
      votes: { type: Number, required: true },
      // Add any other room result properties you need
    }
  ],
  // Add any other round properties you need
});

module.exports = mongoose.model('Round', roundSchema);
