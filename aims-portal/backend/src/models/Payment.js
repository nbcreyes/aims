const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentFeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFee', required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  receiptNo: { type: String, unique: true, required: true },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Payment', paymentSchema)