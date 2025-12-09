import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Building2, Phone, Mail, Globe } from "lucide-react";

const FinancialDocument = () => {
  const documentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const printContent = documentRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ethio Telecom - Project Cost Breakdown</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page { 
              size: A4; 
              margin: 15mm; 
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Noto Sans Ethiopic', 'Segoe UI', sans-serif;
              font-size: 11px;
              line-height: 1.5;
              color: #231F20;
              background: #FFFFFF;
            }
            .document {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 20px;
              border-bottom: 3px solid #8DC63F;
              margin-bottom: 20px;
            }
            .company-info h1 {
              color: #0072BC;
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .company-info p {
              color: #666;
              font-size: 10px;
            }
            .document-title {
              text-align: right;
            }
            .document-title h2 {
              color: #8DC63F;
              font-size: 18px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .document-title p {
              color: #666;
              font-size: 10px;
            }
            .client-section {
              background: #F4F4F4;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .client-section h3 {
              color: #0072BC;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .client-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .client-details p {
              font-size: 10px;
            }
            .client-details strong {
              color: #231F20;
            }
            .section-title {
              background: #0072BC;
              color: white;
              padding: 8px 15px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              margin: 20px 0 15px 0;
              border-radius: 4px;
            }
            .cost-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .cost-table th {
              background: #8DC63F;
              color: white;
              padding: 10px;
              text-align: left;
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .cost-table th:last-child,
            .cost-table td:last-child {
              text-align: right;
            }
            .cost-table td {
              padding: 10px;
              border-bottom: 1px solid #e5e5e5;
              font-size: 10px;
            }
            .cost-table tr:nth-child(even) {
              background: #F9F9F9;
            }
            .category-row td {
              background: #E8F5E9 !important;
              font-weight: 600;
              color: #0072BC;
            }
            .subtotal-row td {
              background: #E3F2FD !important;
              font-weight: 600;
            }
            .total-section {
              background: linear-gradient(135deg, #0072BC, #005a96);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .total-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .total-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            .total-item.grand-total {
              border: none;
              font-size: 16px;
              font-weight: 700;
              margin-top: 10px;
              padding-top: 15px;
              border-top: 2px solid #8DC63F;
            }
            .notes-section {
              margin-top: 20px;
              padding: 15px;
              background: #FFFDE7;
              border-left: 4px solid #8DC63F;
              border-radius: 0 8px 8px 0;
            }
            .notes-section h4 {
              color: #0072BC;
              font-size: 11px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .notes-section ul {
              list-style: none;
              padding: 0;
            }
            .notes-section li {
              font-size: 9px;
              padding: 3px 0;
              padding-left: 15px;
              position: relative;
            }
            .notes-section li::before {
              content: "•";
              color: #8DC63F;
              position: absolute;
              left: 0;
              font-weight: bold;
            }
            .payment-section {
              margin-top: 20px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .payment-box {
              padding: 15px;
              border: 1px solid #e5e5e5;
              border-radius: 8px;
            }
            .payment-box h4 {
              color: #0072BC;
              font-size: 11px;
              font-weight: 600;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .payment-box p {
              font-size: 9px;
              margin-bottom: 5px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #8DC63F;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .footer-left p {
              font-size: 9px;
              color: #666;
            }
            .footer-right {
              text-align: right;
            }
            .footer-right p {
              font-size: 9px;
              color: #666;
            }
            .signature-section {
              margin-top: 30px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 50px;
            }
            .signature-box {
              padding-top: 60px;
              border-top: 1px solid #231F20;
              text-align: center;
            }
            .signature-box p {
              font-size: 10px;
              color: #666;
            }
            .watermark {
              position: fixed;
              bottom: 50%;
              right: 50%;
              transform: translate(50%, 50%) rotate(-45deg);
              font-size: 80px;
              color: rgba(141, 198, 63, 0.05);
              font-weight: 700;
              pointer-events: none;
              z-index: -1;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Cost Breakdown Document
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Professional financial document prepared for Ethio Telecom
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Document Date: {currentDate}
                </p>
              </div>
              <Button 
                onClick={handleDownloadPDF}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Preview */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
        <div ref={documentRef} className="document p-8">
          <div className="watermark">CONFIDENTIAL</div>
          
          {/* Header */}
          <div className="header flex justify-between items-start pb-6 border-b-4 border-primary mb-6">
            <div className="company-info">
              <h1 className="text-secondary text-3xl font-bold mb-1">GUBA TECHNOLOGY</h1>
              <p className="text-muted-foreground text-sm">Enterprise Digital Solutions Provider</p>
              <div className="flex flex-col gap-1 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> +251 911 123 456</span>
                <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> sales@gubatechnology.com</span>
                <span className="flex items-center gap-2"><Globe className="h-3 w-3" /> www.gubatechnology.com</span>
              </div>
            </div>
            <div className="document-title text-right">
              <h2 className="text-primary text-xl font-semibold uppercase tracking-wider">Project Cost Breakdown</h2>
              <p className="text-muted-foreground text-sm mt-1">Document No: PCB-ET-2024-001</p>
              <p className="text-muted-foreground text-sm">Date: {currentDate}</p>
              <p className="text-muted-foreground text-sm">Valid Until: {validUntil}</p>
            </div>
          </div>

          {/* Client Section */}
          <div className="client-section bg-muted p-5 rounded-lg mb-6">
            <h3 className="text-secondary text-sm font-semibold uppercase mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Client Information
            </h3>
            <div className="client-details grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm"><strong>Company:</strong> Ethio Telecom</p>
                <p className="text-sm"><strong>Industry:</strong> Telecommunications</p>
                <p className="text-sm"><strong>Contact Person:</strong> [To be specified]</p>
              </div>
              <div>
                <p className="text-sm"><strong>Address:</strong> Addis Ababa, Ethiopia</p>
                <p className="text-sm"><strong>Project:</strong> Enterprise Social Hub Platform</p>
                <p className="text-sm"><strong>Implementation Type:</strong> One-time Deployment</p>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="section-title bg-secondary text-white p-3 rounded font-semibold uppercase mb-4">
            Executive Summary
          </div>
          <p className="text-sm text-foreground mb-6 leading-relaxed">
            This document presents a comprehensive cost breakdown for the implementation of a full-stack Enterprise Social Hub Platform 
            for Ethio Telecom. The solution encompasses CRM, Social Media Management, Marketing Automation, and Analytics capabilities, 
            designed to enhance customer engagement and streamline digital operations across all communication channels.
          </p>

          {/* Platform Licensing & Setup */}
          <div className="section-title bg-secondary text-white p-3 rounded font-semibold uppercase mb-4">
            1. Platform Licensing & Initial Setup
          </div>
          <table className="cost-table w-full border-collapse mb-6">
            <thead>
              <tr>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Item Description</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Qty</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Unit</th>
                <th className="bg-primary text-white p-3 text-right text-xs font-semibold uppercase">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="category-row">
                <td colSpan={4} className="bg-primary/10 p-3 font-semibold text-secondary">Core Platform License</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Enterprise Social Hub Platform - Perpetual License</td>
                <td className="p-3 border-b">1</td>
                <td className="p-3 border-b">License</td>
                <td className="p-3 border-b text-right font-mono">2,500,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">CRM Module - Customer Relationship Management</td>
                <td className="p-3 border-b">1</td>
                <td className="p-3 border-b">Module</td>
                <td className="p-3 border-b text-right font-mono">850,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Social Media Management Suite</td>
                <td className="p-3 border-b">1</td>
                <td className="p-3 border-b">Module</td>
                <td className="p-3 border-b text-right font-mono">650,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Marketing Automation & Campaign Management</td>
                <td className="p-3 border-b">1</td>
                <td className="p-3 border-b">Module</td>
                <td className="p-3 border-b text-right font-mono">550,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Analytics & Reporting Dashboard</td>
                <td className="p-3 border-b">1</td>
                <td className="p-3 border-b">Module</td>
                <td className="p-3 border-b text-right font-mono">400,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">AI-Powered Insights Engine</td>
                <td className="p-3 border-b">1</td>
                <td className="p-3 border-b">Module</td>
                <td className="p-3 border-b text-right font-mono">750,000.00</td>
              </tr>
              <tr className="subtotal-row">
                <td colSpan={3} className="bg-secondary/10 p-3 font-semibold text-right">Subtotal - Licensing</td>
                <td className="bg-secondary/10 p-3 text-right font-semibold font-mono">5,700,000.00</td>
              </tr>
            </tbody>
          </table>

          {/* Implementation Services */}
          <div className="section-title bg-secondary text-white p-3 rounded font-semibold uppercase mb-4">
            2. Implementation & Integration Services
          </div>
          <table className="cost-table w-full border-collapse mb-6">
            <thead>
              <tr>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Service Description</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Days</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Resources</th>
                <th className="bg-primary text-white p-3 text-right text-xs font-semibold uppercase">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="category-row">
                <td colSpan={4} className="bg-primary/10 p-3 font-semibold text-secondary">Professional Services</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Project Management & Coordination</td>
                <td className="p-3 border-b">60</td>
                <td className="p-3 border-b">1 PM</td>
                <td className="p-3 border-b text-right font-mono">420,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Solution Architecture & Design</td>
                <td className="p-3 border-b">30</td>
                <td className="p-3 border-b">2 Architects</td>
                <td className="p-3 border-b text-right font-mono">480,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">System Configuration & Customization</td>
                <td className="p-3 border-b">45</td>
                <td className="p-3 border-b">3 Developers</td>
                <td className="p-3 border-b text-right font-mono">675,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">API Integration with Existing Systems</td>
                <td className="p-3 border-b">40</td>
                <td className="p-3 border-b">2 Developers</td>
                <td className="p-3 border-b text-right font-mono">400,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Social Platform OAuth Integration</td>
                <td className="p-3 border-b">20</td>
                <td className="p-3 border-b">2 Developers</td>
                <td className="p-3 border-b text-right font-mono">200,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Database Migration & Data Import</td>
                <td className="p-3 border-b">25</td>
                <td className="p-3 border-b">2 Engineers</td>
                <td className="p-3 border-b text-right font-mono">250,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Quality Assurance & Testing</td>
                <td className="p-3 border-b">30</td>
                <td className="p-3 border-b">2 QA Engineers</td>
                <td className="p-3 border-b text-right font-mono">300,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">User Acceptance Testing (UAT) Support</td>
                <td className="p-3 border-b">15</td>
                <td className="p-3 border-b">2 Engineers</td>
                <td className="p-3 border-b text-right font-mono">150,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Go-Live Support & Stabilization</td>
                <td className="p-3 border-b">14</td>
                <td className="p-3 border-b">4 Engineers</td>
                <td className="p-3 border-b text-right font-mono">280,000.00</td>
              </tr>
              <tr className="subtotal-row">
                <td colSpan={3} className="bg-secondary/10 p-3 font-semibold text-right">Subtotal - Implementation</td>
                <td className="bg-secondary/10 p-3 text-right font-semibold font-mono">3,155,000.00</td>
              </tr>
            </tbody>
          </table>

          {/* Infrastructure */}
          <div className="section-title bg-secondary text-white p-3 rounded font-semibold uppercase mb-4">
            3. Infrastructure & Hosting (First Year)
          </div>
          <table className="cost-table w-full border-collapse mb-6">
            <thead>
              <tr>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Infrastructure Component</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Specification</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Period</th>
                <th className="bg-primary text-white p-3 text-right text-xs font-semibold uppercase">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border-b">Cloud Server Infrastructure</td>
                <td className="p-3 border-b">High Availability Cluster</td>
                <td className="p-3 border-b">12 Months</td>
                <td className="p-3 border-b text-right font-mono">480,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Database Server (PostgreSQL)</td>
                <td className="p-3 border-b">Enterprise Grade</td>
                <td className="p-3 border-b">12 Months</td>
                <td className="p-3 border-b text-right font-mono">360,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">CDN & Load Balancing</td>
                <td className="p-3 border-b">Global Distribution</td>
                <td className="p-3 border-b">12 Months</td>
                <td className="p-3 border-b text-right font-mono">180,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">SSL Certificates & Security</td>
                <td className="p-3 border-b">Enterprise SSL + WAF</td>
                <td className="p-3 border-b">12 Months</td>
                <td className="p-3 border-b text-right font-mono">120,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Backup & Disaster Recovery</td>
                <td className="p-3 border-b">Daily Backup + DR Site</td>
                <td className="p-3 border-b">12 Months</td>
                <td className="p-3 border-b text-right font-mono">240,000.00</td>
              </tr>
              <tr className="subtotal-row">
                <td colSpan={3} className="bg-secondary/10 p-3 font-semibold text-right">Subtotal - Infrastructure</td>
                <td className="bg-secondary/10 p-3 text-right font-semibold font-mono">1,380,000.00</td>
              </tr>
            </tbody>
          </table>

          {/* Training */}
          <div className="section-title bg-secondary text-white p-3 rounded font-semibold uppercase mb-4">
            4. Training & Knowledge Transfer
          </div>
          <table className="cost-table w-full border-collapse mb-6">
            <thead>
              <tr>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Training Program</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Duration</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Participants</th>
                <th className="bg-primary text-white p-3 text-right text-xs font-semibold uppercase">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border-b">Executive Overview & Dashboard Training</td>
                <td className="p-3 border-b">1 Day</td>
                <td className="p-3 border-b">Up to 10</td>
                <td className="p-3 border-b text-right font-mono">50,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">CRM & Sales Team Training</td>
                <td className="p-3 border-b">3 Days</td>
                <td className="p-3 border-b">Up to 30</td>
                <td className="p-3 border-b text-right font-mono">150,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Social Media Management Training</td>
                <td className="p-3 border-b">2 Days</td>
                <td className="p-3 border-b">Up to 20</td>
                <td className="p-3 border-b text-right font-mono">100,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Marketing Automation Training</td>
                <td className="p-3 border-b">2 Days</td>
                <td className="p-3 border-b">Up to 15</td>
                <td className="p-3 border-b text-right font-mono">100,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">System Administration Training</td>
                <td className="p-3 border-b">3 Days</td>
                <td className="p-3 border-b">Up to 5</td>
                <td className="p-3 border-b text-right font-mono">150,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Train-the-Trainer Program</td>
                <td className="p-3 border-b">2 Days</td>
                <td className="p-3 border-b">Up to 10</td>
                <td className="p-3 border-b text-right font-mono">100,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Training Materials & Documentation</td>
                <td className="p-3 border-b">-</td>
                <td className="p-3 border-b">All Modules</td>
                <td className="p-3 border-b text-right font-mono">80,000.00</td>
              </tr>
              <tr className="subtotal-row">
                <td colSpan={3} className="bg-secondary/10 p-3 font-semibold text-right">Subtotal - Training</td>
                <td className="bg-secondary/10 p-3 text-right font-semibold font-mono">730,000.00</td>
              </tr>
            </tbody>
          </table>

          {/* Support */}
          <div className="section-title bg-secondary text-white p-3 rounded font-semibold uppercase mb-4">
            5. Support & Maintenance (First Year)
          </div>
          <table className="cost-table w-full border-collapse mb-6">
            <thead>
              <tr>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Support Package</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">SLA</th>
                <th className="bg-primary text-white p-3 text-left text-xs font-semibold uppercase">Coverage</th>
                <th className="bg-primary text-white p-3 text-right text-xs font-semibold uppercase">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border-b">Premium Support Package</td>
                <td className="p-3 border-b">4hr Response</td>
                <td className="p-3 border-b">24/7</td>
                <td className="p-3 border-b text-right font-mono">480,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Software Updates & Patches</td>
                <td className="p-3 border-b">-</td>
                <td className="p-3 border-b">12 Months</td>
                <td className="p-3 border-b text-right font-mono">285,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Dedicated Account Manager</td>
                <td className="p-3 border-b">-</td>
                <td className="p-3 border-b">12 Months</td>
                <td className="p-3 border-b text-right font-mono">180,000.00</td>
              </tr>
              <tr>
                <td className="p-3 border-b">Quarterly Business Reviews</td>
                <td className="p-3 border-b">-</td>
                <td className="p-3 border-b">4 Sessions</td>
                <td className="p-3 border-b text-right font-mono">120,000.00</td>
              </tr>
              <tr className="subtotal-row">
                <td colSpan={3} className="bg-secondary/10 p-3 font-semibold text-right">Subtotal - Support</td>
                <td className="bg-secondary/10 p-3 text-right font-semibold font-mono">1,065,000.00</td>
              </tr>
            </tbody>
          </table>

          {/* Total Section */}
          <div className="total-section bg-gradient-to-r from-secondary to-secondary/80 text-white p-6 rounded-lg mt-8">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Investment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/20">
                <span>Platform Licensing & Initial Setup</span>
                <span className="font-mono">ETB 5,700,000.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/20">
                <span>Implementation & Integration Services</span>
                <span className="font-mono">ETB 3,155,000.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/20">
                <span>Infrastructure & Hosting (First Year)</span>
                <span className="font-mono">ETB 1,380,000.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/20">
                <span>Training & Knowledge Transfer</span>
                <span className="font-mono">ETB 730,000.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/20">
                <span>Support & Maintenance (First Year)</span>
                <span className="font-mono">ETB 1,065,000.00</span>
              </div>
              <Separator className="bg-primary my-4" />
              <div className="flex justify-between py-3 text-xl font-bold">
                <span>TOTAL INVESTMENT</span>
                <span className="font-mono text-primary">ETB 12,030,000.00</span>
              </div>
              <div className="flex justify-between py-2 text-sm opacity-80">
                <span>VAT (15%)</span>
                <span className="font-mono">ETB 1,804,500.00</span>
              </div>
              <Separator className="bg-primary my-4" />
              <div className="flex justify-between py-3 text-2xl font-bold">
                <span>GRAND TOTAL (Including VAT)</span>
                <span className="font-mono text-primary">ETB 13,834,500.00</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="notes-section bg-amber-50 p-5 border-l-4 border-primary rounded-r-lg mt-6">
            <h4 className="text-secondary text-sm font-semibold mb-3">Terms & Conditions</h4>
            <ul className="space-y-2 text-xs">
              <li className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                This quotation is valid for 30 days from the date of issue
              </li>
              <li className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                Payment Terms: 40% upon contract signing, 40% upon UAT completion, 20% upon Go-Live
              </li>
              <li className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                Implementation timeline: 16-20 weeks from project kickoff
              </li>
              <li className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                Annual support and maintenance renewal: 15% of license cost
              </li>
              <li className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                Infrastructure costs are subject to annual renewal
              </li>
              <li className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                All prices are in Ethiopian Birr (ETB) and subject to exchange rate fluctuations
              </li>
            </ul>
          </div>

          {/* Payment Section */}
          <div className="payment-section grid grid-cols-2 gap-4 mt-6">
            <div className="payment-box border rounded-lg p-4">
              <h4 className="text-secondary text-sm font-semibold uppercase mb-3">Payment Schedule</h4>
              <div className="space-y-2 text-xs">
                <p><strong>Phase 1 (40%):</strong> ETB 5,533,800.00</p>
                <p className="text-muted-foreground">Due upon contract signing</p>
                <p><strong>Phase 2 (40%):</strong> ETB 5,533,800.00</p>
                <p className="text-muted-foreground">Due upon UAT completion</p>
                <p><strong>Phase 3 (20%):</strong> ETB 2,766,900.00</p>
                <p className="text-muted-foreground">Due upon Go-Live</p>
              </div>
            </div>
            <div className="payment-box border rounded-lg p-4">
              <h4 className="text-secondary text-sm font-semibold uppercase mb-3">Bank Details</h4>
              <div className="space-y-1 text-xs">
                <p><strong>Bank:</strong> Commercial Bank of Ethiopia</p>
                <p><strong>Account Name:</strong> Guba Technology PLC</p>
                <p><strong>Account No:</strong> 1000XXXXXXXXX</p>
                <p><strong>Branch:</strong> Bole Branch</p>
                <p><strong>Swift Code:</strong> CBETETAA</p>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="signature-section grid grid-cols-2 gap-12 mt-12">
            <div className="signature-box pt-16 border-t text-center">
              <p className="text-sm text-muted-foreground">Authorized Signature - Guba Technology</p>
              <p className="text-xs text-muted-foreground mt-1">Name: ___________________</p>
              <p className="text-xs text-muted-foreground">Date: ___________________</p>
            </div>
            <div className="signature-box pt-16 border-t text-center">
              <p className="text-sm text-muted-foreground">Authorized Signature - Ethio Telecom</p>
              <p className="text-xs text-muted-foreground mt-1">Name: ___________________</p>
              <p className="text-xs text-muted-foreground">Date: ___________________</p>
            </div>
          </div>

          {/* Footer */}
          <div className="footer mt-8 pt-4 border-t-2 border-primary flex justify-between items-center">
            <div className="footer-left">
              <p className="text-xs text-muted-foreground">Guba Technology PLC | Enterprise Digital Solutions</p>
              <p className="text-xs text-muted-foreground">Addis Ababa, Ethiopia | TIN: XXXXXXXXXX</p>
            </div>
            <div className="footer-right text-right">
              <p className="text-xs text-muted-foreground">Document: PCB-ET-2024-001</p>
              <p className="text-xs text-muted-foreground">Page 1 of 1 | Confidential</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDocument;
