const StudentFee = require("../models/StudentFee");
const Payment = require("../models/Payment");
const Enrollment = require("../models/Enrollment");
const { notify } = require("../utils/notify");

const generateReceiptNo = async () => {
  const date = new Date();
  const prefix = `RCP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const count = await Payment.countDocuments();
  const seq = String(count + 1).padStart(5, "0");
  return `${prefix}-${seq}`;
};

const getFees = async (req, res) => {
  try {
    const filter = {};
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.status) filter.status = req.query.status;

    const fees = await StudentFee.find(filter)
      .populate("studentId", "name email")
      .populate("semesterId", "schoolYear term")
      .populate("enrollmentId", "yearLevel status")
      .sort({ createdAt: -1 });

    res.json({ status: "success", message: "Fees fetched", data: fees });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getFee = async (req, res) => {
  try {
    const fee = await StudentFee.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("semesterId", "schoolYear term")
      .populate("enrollmentId");

    if (!fee) {
      return res
        .status(404)
        .json({ status: "error", message: "Fee record not found" });
    }

    // Students can only view their own fees
    if (
      req.user.role === "student" &&
      fee.studentId._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    const payments = await Payment.find({ studentFeeId: fee._id })
      .populate("cashierId", "name")
      .sort({ paymentDate: -1 });

    res.json({
      status: "success",
      message: "Fee fetched",
      data: { fee, payments },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getMyFees = async (req, res) => {
  try {
    const filter = { studentId: req.user._id };
    if (req.query.semesterId) filter.semesterId = req.query.semesterId;

    const fees = await StudentFee.find(filter)
      .populate("semesterId", "schoolYear term")
      .sort({ createdAt: -1 });

    res.json({ status: "success", message: "Fees fetched", data: fees });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getOverdueFees = async (req, res) => {
  try {
    const today = new Date();
    const fees = await StudentFee.find({
      status: { $in: ["unpaid", "partial"] },
      dueDate: { $lt: today },
    })
      .populate("studentId", "name email")
      .populate("semesterId", "schoolYear term")
      .sort({ dueDate: 1 });

    res.json({
      status: "success",
      message: "Overdue fees fetched",
      data: fees,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const setDueDate = async (req, res) => {
  try {
    const { dueDate } = req.body;
    if (!dueDate) {
      return res
        .status(400)
        .json({ status: "error", message: "Due date is required" });
    }

    const fee = await StudentFee.findById(req.params.id);
    if (!fee) {
      return res
        .status(404)
        .json({ status: "error", message: "Fee record not found" });
    }

    fee.dueDate = new Date(dueDate);
    await fee.save();

    res.json({ status: "success", message: "Due date updated", data: fee });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { studentFeeId, amountPaid, notes } = req.body;

    if (!studentFeeId || !amountPaid) {
      return res.status(400).json({
        status: "error",
        message: "studentFeeId and amountPaid are required",
      });
    }

    if (amountPaid <= 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Amount must be greater than zero" });
    }

    const fee = await StudentFee.findById(studentFeeId);
    if (!fee) {
      return res
        .status(404)
        .json({ status: "error", message: "Fee record not found" });
    }

    if (fee.status === "paid") {
      return res.status(400).json({
        status: "error",
        message: "This fee has already been fully paid",
      });
    }

    if (amountPaid > fee.balance) {
      return res.status(400).json({
        status: "error",
        message: `Amount exceeds balance of ${fee.balance}`,
      });
    }

    const receiptNo = await generateReceiptNo();

    const payment = await Payment.create({
      studentId: fee.studentId,
      studentFeeId: fee._id,
      amountPaid,
      cashierId: req.user._id,
      receiptNo,
      notes: notes || "",
    });

    // Update fee balance and status
    fee.paidAmount += amountPaid;
    fee.balance = fee.totalAmount - fee.paidAmount;

    if (fee.balance <= 0) {
      fee.status = "paid";
      fee.balance = 0;
    } else {
      fee.status = "partial";
    }

    await fee.save();

    await notify(
      fee.studentId,
      "Payment Received",
      `A payment of ₱${amountPaid.toLocaleString()} has been recorded. Receipt No: ${receiptNo}. Remaining balance: ₱${fee.balance.toLocaleString()}.`,
    );

    const populated = await Payment.findById(payment._id)
      .populate("studentId", "name email")
      .populate("cashierId", "name");

    res.status(201).json({
      status: "success",
      message: "Payment recorded",
      data: { payment: populated, fee },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.studentFeeId) filter.studentFeeId = req.query.studentFeeId;

    const payments = await Payment.find(filter)
      .populate("studentId", "name email")
      .populate("cashierId", "name")
      .populate("studentFeeId", "totalAmount balance semesterId")
      .sort({ paymentDate: -1 });

    res.json({
      status: "success",
      message: "Payments fetched",
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("cashierId", "name")
      .populate({
        path: "studentFeeId",
        populate: { path: "semesterId", select: "schoolYear term" },
      });

    if (!payment) {
      return res
        .status(404)
        .json({ status: "error", message: "Payment not found" });
    }

    res.json({ status: "success", message: "Payment fetched", data: payment });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getFees,
  getFee,
  getMyFees,
  getOverdueFees,
  setDueDate,
  recordPayment,
  getPayments,
  getPayment,
};
