// Boat Spare Parts Declaration PDF Generator
// Generates a legal document for zero customs declaration

export interface BoatDeclarationData {
  vesselName: string;
  vesselRegistration: string;
  captainName: string;
  departurePort: string;
  arrivalPort: string;
  departureDate: string;
  arrivalDate: string;
  items: Array<{
    description: string;
    quantity: number;
    value: string;
    purpose: "spare_parts" | "equipment" | "provisions";
  }>;
  requesterName: string;
  requesterEmail: string;
}

export function generateBoatDeclarationPDF(data: BoatDeclarationData): void {
  // Create a new window for the PDF content
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate the PDF");
    return;
  }

  const itemsList = data.items
    .map(
      (item, index) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.value}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.purpose.replace("_", " ")}</td>
    </tr>
  `
    )
    .join("");

  const totalValue = data.items.reduce(
    (sum, item) => sum + parseFloat(item.value.replace(/[^0-9.]/g, "")),
    0
  );

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Boat Spare Parts Declaration</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Times New Roman', serif;
      padding: 40px;
      line-height: 1.6;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
      text-decoration: underline;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: bold;
      width: 200px;
    }
    .info-value {
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      margin-bottom: 20px;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: left;
      padding: 10px;
      border: 1px solid #000;
    }
    td {
      padding: 8px;
      border: 1px solid #000;
    }
    .declaration {
      margin-top: 30px;
      padding: 20px;
      border: 2px solid #000;
      background-color: #f9f9f9;
    }
    .declaration p {
      margin-bottom: 15px;
      text-align: justify;
    }
    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 300px;
      border-top: 1px solid #000;
      padding-top: 10px;
      margin-top: 60px;
    }
    .footer {
      margin-top: 30px;
      font-size: 10px;
      text-align: center;
      color: #666;
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #0d9488;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    .print-button:hover {
      background-color: #0f766e;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>
  
  <div class="header">
    <h1>Boat Spare Parts Declaration</h1>
    <p style="margin-top: 10px; font-size: 12px;">
      For Customs Clearance - Zero Customs Duty Declaration
    </p>
  </div>

  <div class="section">
    <div class="section-title">Vessel Information</div>
    <div class="info-row">
      <span class="info-label">Vessel Name:</span>
      <span class="info-value">${data.vesselName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Registration Number:</span>
      <span class="info-value">${data.vesselRegistration}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Captain Name:</span>
      <span class="info-value">${data.captainName}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Voyage Information</div>
    <div class="info-row">
      <span class="info-label">Departure Port:</span>
      <span class="info-value">${data.departurePort}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Arrival Port:</span>
      <span class="info-value">${data.arrivalPort}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Departure Date:</span>
      <span class="info-value">${data.departureDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Expected Arrival Date:</span>
      <span class="info-value">${data.arrivalDate}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Items Being Transported</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Value (USD)</th>
          <th>Purpose</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
        <tr style="font-weight: bold; background-color: #f0f0f0;">
          <td colspan="3" style="text-align: right; padding-right: 20px;">Total Value:</td>
          <td colspan="2">$${totalValue.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="declaration">
    <div class="section-title">DECLARATION</div>
    <p>
      I, <strong>${data.captainName}</strong>, Captain of the vessel <strong>${data.vesselName}</strong> 
      (Registration: ${data.vesselRegistration}), hereby declare that the items listed above are:
    </p>
    <p>
      1. <strong>Spare parts and equipment</strong> intended for use on board the vessel during its voyage 
      from ${data.departurePort} to ${data.arrivalPort}.
    </p>
    <p>
      2. <strong>Not for commercial sale or distribution</strong> in the destination country. These items 
      are for the vessel's own use and maintenance.
    </p>
    <p>
      3. <strong>Temporarily imported</strong> and will remain on board the vessel or be re-exported 
      with the vessel.
    </p>
    <p>
      4. <strong>In compliance with international maritime law</strong> and customs regulations regarding 
      spare parts and equipment for vessels in transit.
    </p>
    <p>
      5. <strong>Items are for vessel use only, not for commercial sale</strong> or distribution in the 
      destination country.
    </p>
    <p style="margin-top: 15px; font-weight: bold; color: #d97706;">
      I certify that all information provided in this declaration is true and accurate. 
      I understand that false declarations may result in penalties, fines, legal action, and 
      customs authorities may verify this information through inspection or additional documentation.
    </p>
    <p style="margin-top: 20px;">
      <strong>Requested by:</strong> ${data.requesterName} (${data.requesterEmail})
    </p>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div style="margin-bottom: 5px;">Captain's Signature:</div>
      <div style="height: 40px; border-bottom: 1px solid #000;"></div>
      <div style="margin-top: 5px; font-size: 12px;">${data.captainName}</div>
    </div>
    <div class="signature-box">
      <div style="margin-bottom: 5px;">Date:</div>
      <div style="height: 40px; border-bottom: 1px solid #000;"></div>
      <div style="margin-top: 5px; font-size: 12px;">${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="footer">
    <p style="font-weight: bold; color: #78350f;">
      IMPORTANT: This declaration must be accurate. Customs authorities may verify information 
      through inspection, documentation review, or other means. False declarations are illegal 
      and may result in penalties, fines, seizure of items, and legal action.
    </p>
    <p style="margin-top: 10px;">
      This declaration is made in accordance with international customs regulations for vessels in transit. 
      Customs authorities may request additional documentation or inspection of the vessel and items.
    </p>
    <p style="margin-top: 10px;">
      Generated by SpareCarry - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    </p>
  </div>

  <script>
    // Auto-print or show print dialog
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
