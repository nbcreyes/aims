const mongoose = require('mongoose')

const studentFeeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  tuitionFee: { type: Number, required: true },
  labFees: { type: Number, default: 0 },
  miscFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  dueDate: { type: Date },
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  breakdown: [{
    description: { type: String },
    amount: { type: Number },
    feeType: { type: String, enum: ['tuition', 'lab', 'misc'] }
  }],
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('StudentFee', studentFeeSchema)