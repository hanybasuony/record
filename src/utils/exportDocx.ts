import { CustodyReport, OrganizationSettings } from '../types';
import { splitDateParts } from './arabicTafqeet';

export function exportReportToDocx(
  report: CustodyReport,
  settings: OrganizationSettings
): boolean {
  try {
    const meetingParts = splitDateParts(report.meetingDate);
    const issueParts = splitDateParts(report.issueDate);

    const isTransfer =
      report.reportType === 'transfer' ||
      Boolean(report.delivererName && report.delivererName.trim());

    const cleanNum = report.reportNumber
      ? report.reportNumber.replace(/[/\\?%*:|"<>]/g, '_')
      : '2026';
    const recipientName = report.recipientName
      ? `_${report.recipientName.replace(/\s+/g, '_')}`
      : '';
    const filename = isTransfer
      ? `إذن_مناقلة_عهدة_${cleanNum}${recipientName}.doc`
      : `محضر_استلام_عهدة_${cleanNum}${recipientName}.doc`;

    const getSignatureRole = (m: CustodyReport['committeeMembers'][number]) => {
      if (report.signatureTableRoleDisplay === 'committeeRole') {
        return m.committeeRole || '';
      }
      if (report.signatureTableRoleDisplay === 'both') {
        return m.jobTitle && m.committeeRole ? `${m.jobTitle} (${m.committeeRole})` : m.jobTitle || m.committeeRole;
      }
      return m.jobTitle || m.committeeRole || '';
    };

    const filledItems = report.items.filter((item) => (item.itemName || '').trim() !== '');
    const activeItems =
      filledItems.length > 0 ? filledItems : report.items.length > 0 ? [report.items[0]] : [];

    const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${report.reportTitle || 'محضر استلام'}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 21.0cm 29.7cm;
      margin: 1.2cm 1.2cm 1.2cm 1.2cm;
      mso-header-margin: 0.5cm;
      mso-footer-margin: 0.5cm;
    }
    div.Section1 {
      page: Section1;
      direction: rtl;
    }
    body {
      font-family: 'Cairo', 'Amiri', 'Traditional Arabic', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      direction: rtl;
      text-align: right;
      color: #000000;
    }
    .outer-double-frame {
      border: 2.5pt double #000000;
      padding: 12pt;
      min-height: 890pt;
    }
    table.header-tbl {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1.5pt solid #000000;
      margin-bottom: 8pt;
    }
    .banner-title {
      background-color: #374151;
      color: #ffffff;
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      padding: 4.5pt;
      margin-top: 8pt;
      margin-bottom: 10pt;
      border: 1pt solid #000000;
      letter-spacing: 0.5pt;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6pt;
      margin-bottom: 10pt;
      font-size: 10pt;
    }
    .items-table th {
      background-color: #374151;
      color: #ffffff;
      font-weight: bold;
      border: 1pt solid #000000;
      padding: 5pt 4pt;
      text-align: center;
    }
    .items-table td {
      border: 1pt solid #000000;
      padding: 4.5pt 4pt;
      vertical-align: middle;
    }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10pt;
      font-size: 10.5pt;
    }
    .sig-table th {
      padding: 4pt;
      font-weight: bold;
    }
    .sig-table td {
      padding: 5pt 4pt;
    }
    .stamp-box {
      border: 2pt dashed #1e40af;
      padding: 8pt;
      text-align: center;
      color: #1e40af;
      font-weight: bold;
      font-size: 10.5pt;
      border-radius: 8pt;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <div class="outer-double-frame">
      <!-- Organization Header -->
      <table class="header-tbl">
        <tr>
          <td style="text-align: right; vertical-align: top; width: 72%;">
            <div style="font-size: 14.5pt; font-weight: bold; color: #000;">${settings.holdingCompanyName || 'الشركة القابضة لمياه الشرب والصرف الصحي'}</div>
            <div style="font-size: 13.5pt; font-weight: bold; color: #000;">${settings.subsidiaryCompanyName || 'شركه مياه الشرب والصرف الصحي بكفر الشيخ'}</div>
            <div style="font-size: 13.5pt; font-weight: bold; padding-right: 18pt; margin-top: 2pt;">
              ${settings.areaName || 'منطقة مياه دسوق'}
              ${report.reportNumber ? ` &nbsp; &nbsp; <span style="font-size: 11pt; border: 1pt solid #000; padding: 1pt 5pt;">رقم المحضر: ${report.reportNumber}</span>` : ''}
            </div>
          </td>
          <td style="text-align: left; vertical-align: middle; width: 28%;">
            <div style="border: 1.5pt solid #0284c7; padding: 6pt; text-align: center; font-weight: bold; font-size: 10.5pt; color: #0369a1; background-color: #f0f9ff;">
              <div>الشركة القابضة</div>
              <div style="font-size: 9pt;">لمياه الشرب والصرف الصحي</div>
              <div style="font-size: 8.5pt; color: #555; margin-top: 2pt;">[معتمد رسمياً]</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Banner Title -->
      <div class="banner-title">
        ${report.reportTitle || 'محضر استلام'}
      </div>

      <!-- Opening Statement -->
      <p style="font-size: 13.5pt; font-weight: bold; margin: 10pt 0;">
        إنه في يوم ( &nbsp; <u>${report.dayName || '............'}</u> &nbsp; ) 
        الموافق &nbsp; <b>${meetingParts.day}</b> / <b>${meetingParts.month}</b> / <b>${meetingParts.year}</b> &nbsp; 
        اجتمعت اللجنة المشكلة من كلا من:
      </p>

      <!-- Committee Members -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt;">
        ${report.committeeMembers
          .map(
            (m, i) => `
        <tr>
          <td style="width: 75%; font-weight: bold; font-size: 12.5pt; padding: 3pt 0;">
            ${i + 1}- ${m.prefix || 'السيد الأستاذ /'} 
            <span style="border-bottom: 1pt dotted #000; padding: 0 10pt;">${m.name || '................................................'}</span>
          </td>
          <td style="width: 25%; font-weight: bold; font-size: 12.5pt; text-align: right;">
            ${m.committeeRole || 'عضوا'}
          </td>
        </tr>`
          )
          .join('')}
      </table>

      <!-- Section Title -->
      <p style="font-size: 13.5pt; font-weight: bold; margin: 12pt 0 4pt 0;">
        تسليم عهدة عبارة عن:
      </p>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 6%;">م</th>
            <th style="width: 41%;">أسم الصنف وبياناته</th>
            <th style="width: 10%;">الوحدة</th>
            <th style="width: 8%;">الكمية</th>
            <th style="width: 17%;">تفقيط</th>
            <th style="width: 18%;">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${activeItems
            .map(
              (item, i) => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${i + 1}</td>
            <td style="text-align: right; font-weight: bold;">${item.itemName || ''}</td>
            <td style="text-align: center;">${item.unit || ''}</td>
            <td style="text-align: center; font-weight: bold;">${item.quantity ?? ''}</td>
            <td style="text-align: center; font-size: 10.5pt;">${item.tafqeet || ''}</td>
            <td style="text-align: center; font-size: 10.5pt;">${item.notes || ''}</td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>

      ${
        report.generalNotes
          ? `<p style="font-size: 11.5pt; font-weight: bold; margin: 4pt 0;">بيان / ملاحظات اللجنة: <span style="font-weight: normal;">${report.generalNotes}</span></p>`
          : ''
      }

      <!-- Issue Date -->
      <p style="font-size: 13pt; font-weight: bold; margin-top: 10pt; margin-bottom: 12pt;">
        تحريرا في: &nbsp; <b>${issueParts.day}</b> / <b>${issueParts.month}</b> / <b>${issueParts.year}</b>
      </p>

      <!-- Recipient / Deliverer Block -->
      ${
        report.reportType === 'transfer' || Boolean(report.delivererName && report.delivererName.trim())
          ? `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt; border: 1.5pt solid #0a2540;">
        <tr>
          <td colspan="2" style="background-color: #f0f7ff; padding: 5pt; font-size: 10pt; font-weight: bold; border-bottom: 1pt solid #0a2540;">
            إقرار مناقلة عهدة رسمي: أقر أنا الطرف المُسَلِّم بالتنازل ونقل قيد العهدة المبينة أعلاه للمستلم، وأقر أنا الطرف المُسْتَلِم باستلام الأصناف بعاليه كاملة وبحالة جيدة ومطابقة للمواصفات وقيدها عهدة في ذمتي.
          </td>
        </tr>
        <tr>
          <td style="width: 50%; vertical-align: top; padding: 6pt; border-left: 1pt solid #cbd5e1; font-size: 10.5pt;">
            <b style="color: #0a2540; font-size: 11pt;">الطرف الأول (المُسَلِّم):</b><br/>
            اسم المسلّم: <b>${report.delivererName || ''}</b> ${report.delivererEmployeeCode ? `[${report.delivererEmployeeCode}]` : ''}<br/>
            الوظيفة: ${report.delivererJobTitle || ''}<br/>
            الإدارة التابعة: <b>${report.delivererDepartmentName || ''}</b><br/>
            توقيع المسلّم: ............................................
          </td>
          <td style="width: 50%; vertical-align: top; padding: 6pt; font-size: 10.5pt;">
            <b style="color: #0a2540; font-size: 11pt;">الطرف الثاني (المُسْتَلِم):</b><br/>
            اسم المستلم: <b>${report.recipientName || ''}</b> ${report.recipientEmployeeCode ? `[${report.recipientEmployeeCode}]` : ''}<br/>
            الوظيفة: ${report.recipientJobTitle || ''}<br/>
            الإدارة التابعة: <b>${report.departmentName || ''}</b><br/>
            توقيع المستلم: ............................................
          </td>
        </tr>
      </table>`
          : `
      <table style="width: 78%; border-collapse: collapse; margin-bottom: 16pt;">
        <tr>
          <td style="width: 28%; font-weight: bold; font-size: 11pt; padding: 3pt 0;">اسم المستلم /</td>
          <td style="width: 72%; font-weight: bold; font-size: 11pt; border-bottom: 1pt dotted #000;">
            ${report.recipientName || ''} 
            ${report.recipientJobTitle ? ` (${report.recipientJobTitle})` : ''}
            ${report.recipientEmployeeCode ? ` [كود: ${report.recipientEmployeeCode}]` : ''}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; font-size: 11pt; padding: 3pt 0;">الإدارة التابعة /</td>
          <td style="font-weight: bold; font-size: 11pt; border-bottom: 1pt dotted #000;">
            ${report.departmentName || ''}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; font-size: 11pt; padding: 3pt 0;">توقيع المستلم /</td>
          <td style="border-bottom: 1pt dotted #000;">&nbsp;</td>
        </tr>
      </table>`
      }

      <!-- Committee Signatures Table -->
      <table class="sig-table">
        <thead>
          <tr>
            <th style="width: 45%; text-align: right;">اللجنة:</th>
            <th style="width: 25%; text-align: center;">الصفة</th>
            <th style="width: 30%; text-align: center;">التوقيع</th>
          </tr>
        </thead>
        <tbody>
          ${report.committeeMembers
            .map(
              (m, i) => `
          <tr>
            <td style="font-weight: bold; border-bottom: 1pt dotted #000;">
              ${i + 1}- ${m.name || ''}
            </td>
            <td style="text-align: center; border-bottom: 1pt dotted #000;">
              ${getSignatureRole(m)}
            </td>
            <td style="border-bottom: 1pt dotted #000;">&nbsp;</td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>

      <!-- Approval Block (Bottom Left) + Stamp Section -->
      <table style="width: 100%; margin-top: 24pt;">
        <tr>
          <td style="width: 50%; vertical-align: middle;">
            <div class="stamp-box">
              <div>[خاتم شعار المنطقة الرسمي]</div>
              <div style="font-size: 9pt; margin-top: 3pt;">شركة مياه الشرب والصرف الصحي بكفر الشيخ - منطقة دسوق</div>
            </div>
          </td>
          <td style="width: 50%; text-align: center; font-weight: bold; font-size: 13.5pt; vertical-align: top;">
            <div>${settings.defaultApproverHeader || 'يعتمد'}</div>
            <div style="margin-top: 4pt;">${report.approverTitle || settings.defaultApproverTitle || 'مدير عام المنطقة'}</div>
            ${report.approverName ? `<div style="margin-top: 4pt; font-size: 12pt;">${report.approverName}</div>` : ''}
            <div style="height: 45pt;">&nbsp;</div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob(['\ufeff', docContent], {
      type: 'application/msword;charset=utf-8',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    return true;
  } catch (err) {
    console.error('Error generating DOCX document:', err);
    return false;
  }
}
