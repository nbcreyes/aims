const corTemplate = (student, record, semester, enrollments, fee) => {
  const totalUnits = enrollments.reduce((sum, e) => {
    return sum + (e.scheduleId?.subjectId?.units || 0)
  }, 0)

  const rows = enrollments.map(e => {
    const subject = e.scheduleId?.subjectId
    const schedule = e.scheduleId
    return `
      <tr>
        <td>${subject?.code || '—'}</td>
        <td>${subject?.name || '—'}</td>
        <td style="text-align:center">${subject?.units || '—'}</td>
        <td>${schedule?.day || '—'}</td>
        <td>${schedule?.timeStart || '—'} – ${schedule?.timeEnd || '—'}</td>
        <td>${schedule?.room || '—'}</td>
        <td>${schedule?.teacherId?.name || '—'}</td>
      </tr>
    `
  }).join('')

  const feeRows = fee?.breakdown?.map(b => `
    <tr>
      <td>${b.description}</td>
      <td style="text-align:right">PHP ${b.amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('') || ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }

    .header { text-align: center; padding-bottom: 12px; border-bottom: 2px solid #1e3a5f; margin-bottom: 16px; }
    .header h1 { font-size: 18px; font-weight: bold; color: #1e3a5f; letter-spacing: 0.5px; }
    .header p { font-size: 11px; color: #555; margin-top: 2px; }

    .cor-title {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #1e3a5f;
      background: #f0f4ff;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 24px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 9px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .info-value { font-size: 12px; font-weight: 600; color: #111; }

    .section-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1e3a5f;
      margin: 14px 0 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }

    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    thead th {
      background: #1e3a5f;
      color: white;
      padding: 7px 6px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 7px 6px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }

    .fee-table { width: 60%; margin-left: auto; }
    .fee-table td { padding: 5px 6px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
    .fee-total {
      display: flex;
      justify-content: flex-end;
      gap: 40px;
      font-weight: bold;
      font-size: 13px;
      padding: 8px 6px;
      border-top: 2px solid #1e3a5f;
      margin-top: 4px;
    }

    .units-summary {
      display: flex;
      gap: 16px;
      margin: 8px 0 14px;
    }
    .unit-box {
      padding: 8px 16px;
      background: #f0f4ff;
      border: 1px solid #c7d7ff;
      border-radius: 6px;
      text-align: center;
    }
    .unit-label { font-size: 9px; text-transform: uppercase; color: #666; }
    .unit-value { font-size: 20px; font-weight: bold; color: #1e3a5f; }

    .footer {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
    }
    .sig-block { text-align: center; }
    .sig-line { border-top: 1px solid #111; padding-top: 4px; font-size: 10px; color: #555; margin-top: 48px; }
    .sig-name { font-size: 11px; font-weight: bold; }

    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      background: #dcfce7;
      color: #16a34a;
    }

    .watermark {
      text-align: center;
      font-size: 10px;
      color: #aaa;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>AIMS — Academic Integrated Management System</h1>
    <p>Certificate of Registration</p>
  </div>

  <div class="cor-title">Certificate of Registration</div>

  <div class="info-grid">
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
      <span class="info-label">Enrollment Status</span>
      <span class="status-badge">OFFICIALLY ENROLLED</span>
    </div>
  </div>

  <div class="section-title">Enrolled Subjects</div>

  <div class="units-summary">
    <div class="unit-box">
      <div class="unit-label">Total Units</div>
      <div class="unit-value">${totalUnits}</div>
    </div>
    <div class="unit-box">
      <div class="unit-label">Subjects</div>
      <div class="unit-value">${enrollments.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Subject</th>
        <th style="text-align:center">Units</th>
        <th>Day</th>
        <th>Time</th>
        <th>Room</th>
        <th>Instructor</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr style="background:#f0f4ff; font-weight:bold;">
        <td colspan="2" style="text-align:right; padding-right:12px;">Total</td>
        <td style="text-align:center">${totalUnits}</td>
        <td colspan="4"></td>
      </tr>
    </tbody>
  </table>

  ${fee ? `
  <div class="section-title">Assessment of Fees</div>
  <table class="fee-table">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${feeRows}
    </tbody>
  </table>
  <div class="fee-total">
    <span>Total Amount Due</span>
    <span>PHP ${fee.totalAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
  </div>
  <div style="display:flex; justify-content:flex-end; gap:40px; font-size:11px; padding: 4px 6px; color:#16a34a;">
    <span>Amount Paid</span>
    <span>PHP ${fee.paidAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
  </div>
  <div style="display:flex; justify-content:flex-end; gap:40px; font-size:11px; padding: 4px 6px; color:#dc2626; font-weight:600;">
    <span>Balance</span>
    <span>PHP ${fee.balance?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
  </div>
  ` : ''}

  <div class="footer">
    <div class="sig-block">
      <div class="sig-name">${student.name}</div>
      <div class="sig-line">Student Signature</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Registrar</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Date Issued: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <div class="watermark">
    This document is system-generated. Issued via AIMS Portal on ${new Date().toLocaleString('en-PH')}.
  </div>

</body>
</html>
  `
}

module.exports = { corTemplate }