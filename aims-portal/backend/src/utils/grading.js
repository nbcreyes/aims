function computeClassStanding(scores) {
  if (!scores || scores.length === 0) return 0
  const percentages = scores.map(s => (s.score / s.maxScore) * 100)
  return percentages.reduce((a, b) => a + b, 0) / percentages.length
}

function computePrelimGrade(classStanding, examScore, examMaxScore) {
  if (!examMaxScore) return 0
  const examPercent = (examScore / examMaxScore) * 100
  return (classStanding * 0.50) + (examPercent * 0.50)
}

function computeMidtermGrade(classStanding, examScore, examMaxScore, prelimGrade) {
  if (!examMaxScore) return 0
  const examPercent = (examScore / examMaxScore) * 100
  const midtermTermGrade = (classStanding * 0.50) + (examPercent * 0.50)
  return (midtermTermGrade * (2 / 3)) + (prelimGrade * (1 / 3))
}

function computeFinalGrade(classStanding, examScore, examMaxScore, midtermGrade) {
  if (!examMaxScore) return 0
  const examPercent = (examScore / examMaxScore) * 100
  const finalTermGrade = (classStanding * 0.50) + (examPercent * 0.50)
  return (finalTermGrade * (2 / 3)) + (midtermGrade * (1 / 3))
}

function computeGradeForTerm(termGrade, term, previousGrades) {
  const { quizScores, activityScores, examScore, examMaxScore } = termGrade

  const allScores = [...(quizScores || []), ...(activityScores || [])]
  const classStanding = computeClassStanding(allScores)

  let cumulativeGrade = 0

  if (term === 'prelim') {
    cumulativeGrade = computePrelimGrade(classStanding, examScore || 0, examMaxScore || 0)
  } else if (term === 'midterm') {
    const prelimGrade = previousGrades?.prelim || 0
    cumulativeGrade = computeMidtermGrade(classStanding, examScore || 0, examMaxScore || 0, prelimGrade)
  } else if (term === 'finals') {
    const midtermGrade = previousGrades?.midterm || 0
    cumulativeGrade = computeFinalGrade(classStanding, examScore || 0, examMaxScore || 0, midtermGrade)
  }

  return {
    classStanding: parseFloat(classStanding.toFixed(2)),
    cumulativeGrade: parseFloat(cumulativeGrade.toFixed(2))
  }
}

module.exports = {
  computeClassStanding,
  computePrelimGrade,
  computeMidtermGrade,
  computeFinalGrade,
  computeGradeForTerm
}