const torTemplate = (student, record, semesters, overallGWA, totalUnitsEarned) => {
  const TERMS = ['prelim', 'midterm', 'finals']

  const semesterBlocks = semesters.map(item => {
    const rows = item.subjects.map(sub => {
      const finals = sub.terms['finals']
      const finalGrade = finals?.cumulativeGrade ?? null
      const passed = finalGrade !== null && finalGrade >= 75

      // INC / removal handling
      let gradeDisplay = '—'
      let remarksDisplay = '<span style="color:#999; font-size:10px;">Pending</span>'

      if (finals?.incDefaulted) {
        gradeDisplay = '5.0'
        remarksDisplay = '<span style="color:#dc2626; font-size:10px;">INC Default</span>'
      } else if (finals?.isINC) {
        gradeDisplay = 'INC'
        remarksDisplay = '<span style="color:#ea580c; font-size:10px;">Incomplete</span>'
      } else if (finals?.removalPassed === true) {
        gradeDisplay = '75.00'
        remarksDisplay = '<span style="color:#16a34a; font-size:10px;">Passed (Removal)</span>'
      } else if (finals?.removalPassed === false) {
        gradeDisplay = `${finalGrade?.toFixed(2)}`
        remarksDisplay = '<span style="color:#dc2626; font-size:10px;">Failed — Retake</span>'
      } else if (finalGrade !== null) {
        gradeDisplay = finalGrade.toFixed(2)
        remarksDisplay = passed
          ? '<span style="color:#16a34a; font-size:10px;">Passed</span>'
          : '<span style="color:#dc2626; font-size:10px;">Failed</span>'
      }

      return `
        <tr>
          <td style="padding:5px 8px; font-size:11px; border-bottom:1px solid #f0f0f0;">
            ${sub.subject?.code || '—'}
          </td>
          <td style="padding:5px 8px; font-size:11px; border-bottom:1px solid #f0f0f0;">
            ${sub.subject?.name || '—'}
          </td>
          <td style="padding:5px 8px; font-size:11px; text-align:center; border-bottom:1px solid #f0f0f0;">
            ${sub.subject?.units || '—'}
          </td>
          <td style="padding:5px 8px; font-size:11px; text-align:center; border-bottom:1px solid #f0f0f0;">
            ${sub.terms['prelim']?.cumulativeGrade?.toFixed(2) || '—'}
          </td>
          <td style="padding:5px 8px; font-size:11px; text-align:center; border-bottom:1px solid #f0f0f0;">
            ${sub.terms['midterm']?.cumulativeGrade?.toFixed(2) || '—'}
          </td>
          <td style="padding:5px 8px; font-size:11px; text-align:center; border-bottom:1px solid #f0f0f0; font-weight:600; color:${finalGrade !== null ? (passed ? '#16a34a' : '#dc2626') : '#111'};">
            ${gradeDisplay}
          </td>
          <td style="padding:5px 8px; font-size:11px; text-align:center; border-bottom:1px solid #f0f0f0;">
            ${remarksDisplay}
          </td>
        </tr>
      `
    }).join('')

    return `
      <div style="margin-bottom:24px;">
        <div style="background:#1e3a5f; color:white; padding:6px 10px; border-radius:4px 4px 0 0; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; font-weight:bold;">
            ${item.semester?.schoolYear} — ${item.semester?.term}
          </span>
          <span style="font-size:11px;">
            SEM GWA: ${item.semesterGWA?.toFixed(4) ?? '—'} &nbsp;|&nbsp; Units Earned: ${item.totalUnits}
          </span>
        </div>
        <table style="width:100%; border-collapse:collapse; background:white;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="text-align:left; padding:6px 8px; font-size:10px; text-transform:uppercase; color:#666; letter-spacing:0.5px;">Code</th>
              <th style="text-align:left; padding:6px 8px; font-size:10px; text-transform:uppercase; color:#666; letter-spacing:0.5px;">Subject</th>
              <th style="text-align:center; padding:6px 8px; font-size:10px; text-transform:uppercase; color:#666;">Units</th>
              <th style="text-align:center; padding:6px 8px; font-size:10px; text-transform:uppercase; color:#666;">Prelim</th>
              <th style="text-align:center; padding:6px 8px; font-size:10px; text-transform:uppercase; color:#666;">Midterm</th>
              <th style="text-align:center; padding:6px 8px; font-size:10px; text-transform:uppercase; color:#666;">Finals</th>
              <th style="text-align:center; padding:6px 8px; font-size:10px; text-transform:uppercase; color:#666;">Remarks</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:12px; color:#111; padding:24px; }
    .header { text-align:center; border-bottom:2px solid #1e3a5f; padding-bottom:14px; margin-bottom:20px; }
    .header h1 { font-size:18px; font-weight:bold; color:#1e3a5f; }
    .header p { font-size:11px; color:#555; margin-top:3px; }
    .tor-title { text-align:center; font-size:15px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; margin-bottom:18px; color:#1e3a5f; }
    .student-info { display:grid; grid-template-columns:1fr 1fr; gap:6px 24px; margin-bottom:20px; padding:12px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; }
    .info-item { display:flex; flex-direction:column; }
    .info-label { font-size:9px; text-transform:uppercase; color:#888; letter-spacing:0.5px; }
    .info-value { font-size:12px; font-weight:600; color:#111; }
    .summary { display:flex; gap:16px; margin-top:20px; }
    .summary-box { flex:1; padding:12px 16px; border:1px solid #e2e8f0; border-radius:6px; background:#f8fafc; }
    .summary-label { font-size:10px; color:#666; text-transform:uppercase; letter-spacing:0.5px; }
    .summary-value { font-size:22px; font-weight:bold; color:#1e3a5f; margin-top:2px; }
    .footer { margin-top:40px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; }
    .sig-block { text-align:center; }
    .sig-line { border-top:1px solid #111; padding-top:4px; font-size:10px; color:#555; margin-top:40px; }
    .sig-title { font-size:9px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }
    .watermark { text-align:center; margin-top:24px; font-size:10px; color:#aaa; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AIMS — Academic Integrated Management System</h1>
    <p>Official Transcript of Records</p>
  </div>

  <div class="tor-title">Transcript of Records</div>

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
      <span class="info-label">Email</span>
      <span class="info-value">${student.email}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Date Issued</span>
      <span class="info-value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
  </div>

  ${semesterBlocks}

  <div class="summary">
    <div class="summary-box">
      <div class="summary-label">Overall GWA</div>
      <div class="summary-value">${overallGWA?.toFixed(4) ?? '—'}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Total Units Earned</div>
      <div class="summary-value" style="color:#16a34a;">${totalUnitsEarned}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Semesters Completed</div>
      <div class="summary-value">${semesters.length}</div>
    </div>
  </div>

  <div class="footer">
    <div class="sig-block">
      <div class="sig-line">Registrar</div>
      <div class="sig-title">Signature over Printed Name</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Date Signed</div>
      <div class="sig-title">Official Date</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Official Dry Seal</div>
      <div class="sig-title">School Seal</div>
    </div>
  </div>

  <div class="watermark">
    This is an official document issued by AIMS Portal. Any alteration renders this document invalid.
  </div>
</body>
</html>
  `
}

module.exports = { torTemplate }