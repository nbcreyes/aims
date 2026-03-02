const reportCardTemplate = (student, record, semester, gradeData) => {
  const TERMS = ['prelim', 'midterm', 'finals']

  const rows = gradeData.map(item => {
    const prelim = item.terms['prelim']
    const midterm = item.terms['midterm']
    const finals = item.terms['finals']
    const finalGrade = finals?.cumulativeGrade || null
    const passed = finalGrade !== null && finalGrade >= 75

    return `
      <tr>
        <td>${item.schedule?.subjectId?.code || '—'}</td>
        <td>${item.schedule?.subjectId?.name || '—'}</td>
        <td>${item.schedule?.subjectId?.units || '—'}</td>
        <td>${prelim?.cumulativeGrade?.toFixed(2) || '—'}</td>
        <td>${midterm?.cumulativeGrade?.toFixed(2) || '—'}</td>
        <td>${finals?.cumulativeGrade?.toFixed(2) || '—'}</td>
        <td style="font-weight:bold; color:${finalGrade !== null ? (passed ? '#16a34a' : '#dc2626') : '#999'}">
          ${finalGrade !== null ? finalGrade.toFixed(2) : '—'}
        </td>
        <td>
          ${finalGrade !== null
            ? `<span style="padding:2px 8px; border-radius:12px; font-size:10px; font-weight:bold; background:${passed ? '#dcfce7' : '#fee2e2'}; color:${passed ? '#16a34a' : '#dc2626'}">
                ${passed ? 'PASSED' : 'FAILED'}
              </span>`
            : '<span style="color:#999; font-size:11px;">Pending</span>'
          }
        </td>
      </tr>
    `
  }).join('')

  const totalUnits = gradeData.reduce((sum, item) => sum + (item.schedule?.subjectId?.units || 0), 0)
  const earnedUnits = gradeData
    .filter(item => (item.terms['finals']?.cumulativeGrade || 0) >= 75)
    .reduce((sum, item) => sum + (item.schedule?.subjectId?.units || 0), 0)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 18px; font-weight: bold; }
    .header p { font-size: 11px; color: #555; margin-top: 2px; }
    .report-title { text-align: center; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 20px; padding: 12px; background: #f9fafb; border-radius: 6px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 9px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .info-value { font-size: 12px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead th { background: #1e3a5f; color: white; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 7px 6px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    .summary { display: flex; gap: 16px; margin-top: 8px; }
    .summary-box { flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 6px; }
    .summary-label { font-size: 10px; color: #666; text-transform: uppercase; }
    .summary-value { font-size: 18px; font-weight: bold; color: #1e3a5f; }
    .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .sig-line { border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 10px; color: #555; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AIMS — Academic Integrated Management System</h1>
    <p>Official Report Card</p>
  </div>

  <div class="report-title">Student Report Card</div>

  <div class="student-info">
    <div class="info-item">
      <span class="info-label">Student Name</span>
      <span class="info-value">${student.name}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Student Number</span>
      <span class="info-value">${record?.studentNo || '—'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Program</span>
      <span class="info-value">${record?.programId?.name || '—'} (${record?.programId?.code || '—'})</span>
    </div>
    <div class="info-item">
      <span class="info-label">Year Level</span>
      <span class="info-value">Year ${record?.yearLevel || '—'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Semester</span>
      <span class="info-value">${semester?.schoolYear || '—'} — ${semester?.term || '—'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Email</span>
      <span class="info-value">${student.email}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Subject</th>
        <th>Units</th>
        <th>Prelim</th>
        <th>Midterm</th>
        <th>Finals</th>
        <th>Final Grade</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-box">
      <div class="summary-label">Total Units Enrolled</div>
      <div class="summary-value">${totalUnits}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Units Earned</div>
      <div class="summary-value" style="color:#16a34a">${earnedUnits}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Units Failed</div>
      <div class="summary-value" style="color:#dc2626">${totalUnits - earnedUnits}</div>
    </div>
  </div>

  <div class="footer">
    <div class="sig-line">Prepared by — Registrar</div>
    <div class="sig-line">Noted by — Dean</div>
    <div class="sig-line">Date Issued</div>
  </div>
</body>
</html>
  `
}

module.exports = { reportCardTemplate }