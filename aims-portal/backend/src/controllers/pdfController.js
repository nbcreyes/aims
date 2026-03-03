const { generatePDF } = require('../utils/pdf')
const { receiptTemplate } = require('../utils/receiptTemplate')
const { reportCardTemplate } = require('../utils/reportCardTemplate')
const { corTemplate } = require('../utils/corTemplate')
const Enrollment = require('../models/Enrollment')
const StudentFee = require('../models/StudentFee')
const Payment = require('../models/Payment')
const User = require('../models/User')
const StudentRecord = require('../models/StudentRecord')
const Semester = require('../models/Semester')
const TermGrade = require('../models/TermGrade')
const ClassSchedule = require('../models/ClassSchedule')
const { torTemplate } = require('../utils/torTemplate')
const { getTranscript: fetchTranscript } = require('./gwaController')

const downloadReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('studentId', 'name email')
      .populate('cashierId', 'name')

    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found' })
    }

    // Students can only download their own receipts
    if (req.user.role === 'student' &&
      payment.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const fee = await StudentFee.findById(payment.studentFeeId)
      .populate('semesterId', 'schoolYear term')

    if (!fee) {
      return res.status(404).json({ status: 'error', message: 'Fee record not found' })
    }

    const html = receiptTemplate(payment, fee, payment.studentId, payment.cashierId)
    const pdf = await generatePDF(html)

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${payment.receiptNo}.pdf"`,
      'Content-Length': pdf.length
    })

    res.send(pdf)
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const downloadReportCard = async (req, res) => {
  try {
    const { studentId, semesterId } = req.params

    // Students can only download their own report card
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const student = await User.findById(studentId).select('-password')
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' })
    }

    const record = await StudentRecord.findOne({ studentId })
      .populate('programId', 'name code')

    const semester = await Semester.findById(semesterId)

    const grades = await TermGrade.find({ studentId, semesterId })
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })

    // Group by schedule
    const grouped = {}
    for (const g of grades) {
      const key = g.scheduleId?._id?.toString()
      if (!key) continue
      if (!grouped[key]) {
        grouped[key] = { schedule: g.scheduleId, terms: {} }
      }
      grouped[key].terms[g.term] = g
    }

    const gradeData = Object.values(grouped)

    const html = reportCardTemplate(student, record, semester, gradeData)
    const pdf = await generatePDF(html)

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-card-${student.name.replace(/\s+/g, '-')}-${semesterId}.pdf"`,
      'Content-Length': pdf.length
    })

    res.send(pdf)
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const downloadCOR = async (req, res) => {
  try {
    const { studentId, semesterId } = req.params

    // Students can only download their own COR
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const student = await User.findById(studentId).select('-password')
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' })
    }

    const record = await StudentRecord.findOne({ studentId })
      .populate('programId', 'name code')

    const semester = await Semester.findById(semesterId)
    if (!semester) {
      return res.status(404).json({ status: 'error', message: 'Semester not found' })
    }

    // Get approved enrollments with full schedule/subject/teacher data
    const enrollments = await Enrollment.find({
      studentId,
      semesterId,
      status: 'approved'
    }).populate({
      path: 'scheduleId',
      populate: [
        { path: 'subjectId', select: 'name code units' },
        { path: 'teacherId', select: 'name' }
      ]
    })

    if (!enrollments.length) {
      return res.status(404).json({
        status: 'error',
        message: 'No approved enrollments found for this semester'
      })
    }

    // Get fee record
    const fee = await StudentFee.findOne({ studentId, semesterId })
      .populate('semesterId', 'schoolYear term')

    const html = corTemplate(student, record, semester, enrollments, fee)
    const pdf = await generatePDF(html)

    const filename = `COR-${record?.studentNo || studentId}-${semester.schoolYear}-${semester.term.replace(/\s+/g, '-')}.pdf`

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length
    })

    res.send(pdf)
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const downloadTOR = async (req, res) => {
  try {
    const { studentId } = req.params

    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const student = await User.findById(studentId).select('-password')
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' })
    }

    const record = await StudentRecord.findOne({ studentId })
      .populate('programId', 'name code')

    const grades = await TermGrade.find({ studentId })
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })
      .populate('semesterId', 'schoolYear term')

    // Group by semester then schedule
    const semesterMap = {}
    for (const g of grades) {
      const semKey = g.semesterId?._id?.toString()
      if (!semKey) continue
      if (!semesterMap[semKey]) {
        semesterMap[semKey] = { semester: g.semesterId, subjects: {} }
      }
      const schedKey = g.scheduleId?._id?.toString()
      if (!schedKey) continue
      if (!semesterMap[semKey].subjects[schedKey]) {
        semesterMap[semKey].subjects[schedKey] = {
          schedule: g.scheduleId,
          subject: g.scheduleId?.subjectId,
          terms: {}
        }
      }
      semesterMap[semKey].subjects[schedKey].terms[g.term] = g
    }

    const { computeGWA } = require('./gwaController')

    const semesters = Object.values(semesterMap).map(item => {
      const allGrades = grades.filter(g =>
        g.semesterId?._id?.toString() === item.semester._id?.toString()
      )
      const subjects = Object.values(item.subjects)
      return {
        semester: item.semester,
        subjects,
        semesterGWA: computeGWA(allGrades),
        totalUnits: subjects.reduce((sum, s) => {
          const finals = s.terms['finals']
          if (finals?.isPublished && finals?.cumulativeGrade >= 75) {
            return sum + (s.subject?.units || 0)
          }
          return sum
        }, 0)
      }
    })

    const overallGWA = computeGWA(grades)
    const totalUnitsEarned = semesters.reduce((sum, s) => sum + s.totalUnits, 0)

    const html = torTemplate(student, record, semesters, overallGWA, totalUnitsEarned)
    const pdf = await generatePDF(html)

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="TOR-${student.name.replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': pdf.length
    })
    res.send(pdf)
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { downloadReceipt, downloadReportCard, downloadCOR, downloadTOR }