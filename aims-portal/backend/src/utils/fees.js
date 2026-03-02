function computeStudentFees(program, enrolledSubjects) {
  const totalUnits = enrolledSubjects.reduce((sum, s) => sum + s.units, 0)
  const tuitionFee = program.pricePerUnit * totalUnits

  const labFees = enrolledSubjects
    .filter(s => s.hasLab)
    .reduce((sum, s) => sum + s.labFee, 0)

  const miscFee = program.miscFee
  const totalAmount = tuitionFee + labFees + miscFee

  const breakdown = []

  breakdown.push({
    description: `Tuition Fee (${totalUnits} units x ${program.pricePerUnit})`,
    amount: tuitionFee,
    feeType: 'tuition'
  })

  enrolledSubjects
    .filter(s => s.hasLab)
    .forEach(s => {
      breakdown.push({
        description: `Lab Fee — ${s.name}`,
        amount: s.labFee,
        feeType: 'lab'
      })
    })

  breakdown.push({
    description: 'Miscellaneous Fee',
    amount: miscFee,
    feeType: 'misc'
  })

  return { tuitionFee, labFees, miscFee, totalAmount, breakdown }
}

module.exports = { computeStudentFees }