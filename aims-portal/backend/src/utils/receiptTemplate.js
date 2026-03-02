const receiptTemplate = (payment, fee, student, cashier) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
    .header p { font-size: 12px; color: #444; margin-top: 2px; }
    .receipt-title { text-align: center; font-size: 15px; font-weight: bold; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-bottom: 20px; }
    .info-row { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
    .info-value { font-size: 13px; font-weight: 600; color: #111; }
    .divider { border-top: 1px solid #ddd; margin: 16px 0; }
    .breakdown { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .breakdown th { text-align: left; font-size: 10px; text-transform: uppercase; color: #666; padding: 4px 0; border-bottom: 1px solid #ddd; }
    .breakdown td { padding: 6px 0; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
    .breakdown td:last-child { text-align: right; }
    .breakdown th:last-child { text-align: right; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; padding: 8px 0; border-top: 2px solid #111; margin-top: 4px; }
    .paid-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #16a34a; }
    .balance-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #dc2626; font-weight: 600; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
    .receipt-no { font-size: 18px; font-weight: bold; color: #1d4ed8; text-align: right; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
    .badge-paid { background: #dcfce7; color: #16a34a; }
    .badge-partial { background: #fef9c3; color: #ca8a04; }
    .badge-unpaid { background: #fee2e2; color: #dc2626; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AIMS — Academic Integrated Management System</h1>
    <p>Official Payment Receipt</p>
  </div>

  <div class="receipt-no">Receipt No: ${payment.receiptNo}</div>

  <div class="info-grid">
    <div class="info-row">
      <span class="info-label">Student Name</span>
      <span class="info-value">${student.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Payment Date</span>
      <span class="info-value">${new Date(payment.paymentDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Student Email</span>
      <span class="info-value">${student.email}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Received By</span>
      <span class="info-value">${cashier.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Semester</span>
      <span class="info-value">${fee.semesterId?.schoolYear} — ${fee.semesterId?.term}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Status</span>
      <span class="badge badge-${fee.status}">${fee.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="divider"></div>

  <table class="breakdown">
    <thead>
      <tr>
        <th>Description</th>
        <th>Type</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${fee.breakdown?.map(b => `
        <tr>
          <td>${b.description}</td>
          <td style="text-transform:capitalize; color:#666;">${b.feeType}</td>
          <td>PHP ${b.amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-row">
    <span>Total Amount Due</span>
    <span>PHP ${fee.totalAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
  </div>

  <div class="paid-row">
    <span>Amount Paid This Transaction</span>
    <span>PHP ${payment.amountPaid?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
  </div>

  <div class="paid-row">
    <span>Total Paid</span>
    <span>PHP ${fee.paidAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
  </div>

  <div class="balance-row">
    <span>Remaining Balance</span>
    <span>PHP ${fee.balance?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
  </div>

  ${payment.notes ? `<p style="margin-top:12px; font-size:12px; color:#666;">Notes: ${payment.notes}</p>` : ''}

  <div class="footer">
    <p>This is an official receipt issued by AIMS Portal.</p>
    <p>Please keep this receipt for your records.</p>
  </div>
</body>
</html>
  `
}

module.exports = { receiptTemplate }