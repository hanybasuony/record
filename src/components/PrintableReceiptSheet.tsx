import React from 'react';
import { CustodyReport, OrganizationSettings } from '../types';
import { splitDateParts } from '../utils/arabicTafqeet';
import { OfficialLogo } from './OfficialLogo';
import { OfficialStamp } from './OfficialStamp';

interface PrintableReceiptSheetProps {
  report: CustodyReport;
  settings: OrganizationSettings;
  showReportNumberBadge?: boolean;
  sheetId?: string;
  fontSizeScale?: 'compact' | 'standard' | 'spacious';
}

export const PrintableReceiptSheet: React.FC<PrintableReceiptSheetProps> = ({
  report,
  settings,
  showReportNumberBadge = true,
  sheetId = 'official-receipt-sheet',
  fontSizeScale = 'compact',
}) => {
  const meetingParts = splitDateParts(report.meetingDate);
  const issueParts = splitDateParts(report.issueDate);

  const isTransfer =
    report.reportType === 'transfer' ||
    Boolean(report.delivererName && report.delivererName.trim().length > 0);

  // تصفية الأصناف: إذا تم إدخال صنف واحد فقط يظهر هذا الصنف فقط دون أي صفوف أخرى إضافية
  const filledItems = report.items.filter((item) => (item.itemName || '').trim() !== '');
  const activeItems =
    filledItems.length > 0 ? filledItems : report.items.length > 0 ? [report.items[0]] : [];

  const getSignatureRoleText = (member: CustodyReport['committeeMembers'][number]) => {
    if (report.signatureTableRoleDisplay === 'committeeRole') {
      return member.committeeRole || '';
    }
    if (report.signatureTableRoleDisplay === 'both') {
      if (member.jobTitle && member.committeeRole) {
        return `${member.jobTitle} (${member.committeeRole})`;
      }
      return member.jobTitle || member.committeeRole || '';
    }
    return member.jobTitle || member.committeeRole || '';
  };

  const isClassicDouble = settings.frameStyle !== 'executive_single';

  // مقياس أحجام الخطوط المصغرة والاحترافية للشركات ذات التباين العالي
  const typography = {
    compact: {
      orgTitle: 'text-[14px] sm:text-[15px]',
      orgSub: 'text-[12.5px] sm:text-[13.5px]',
      bannerTitle: 'text-[16px] sm:text-[17px]',
      body: 'text-[12px] sm:text-[12.5px]',
      subhead: 'text-[12.5px] sm:text-[13px]',
      tableHead: 'text-[11.5px] sm:text-[12px]',
      tableBody: 'text-[11.5px] sm:text-[12px]',
      tableSmall: 'text-[10.5px]',
      sigs: 'text-[11.5px] sm:text-[12px]',
      approverHeader: 'text-[13px] sm:text-[14px]',
      approverTitle: 'text-[13px] sm:text-[14px]',
    },
    standard: {
      orgTitle: 'text-[15.5px] sm:text-[16.5px]',
      orgSub: 'text-[13.5px] sm:text-[14.5px]',
      bannerTitle: 'text-[18px] sm:text-[19px]',
      body: 'text-[13px] sm:text-[13.5px]',
      subhead: 'text-[13.5px] sm:text-[14px]',
      tableHead: 'text-[12.5px] sm:text-[13px]',
      tableBody: 'text-[12px] sm:text-[12.5px]',
      tableSmall: 'text-[11px]',
      sigs: 'text-[12.5px] sm:text-[13px]',
      approverHeader: 'text-[14px] sm:text-[15px]',
      approverTitle: 'text-[14px] sm:text-[15px]',
    },
    spacious: {
      orgTitle: 'text-[17px] sm:text-[18px]',
      orgSub: 'text-[15px] sm:text-[16px]',
      bannerTitle: 'text-[20px] sm:text-[21px]',
      body: 'text-[14px] sm:text-[15px]',
      subhead: 'text-[14.5px] sm:text-[15px]',
      tableHead: 'text-[13.5px]',
      tableBody: 'text-[13px]',
      tableSmall: 'text-[12px]',
      sigs: 'text-[13.5px]',
      approverHeader: 'text-[15px]',
      approverTitle: 'text-[15px]',
    },
  }[fontSizeScale || 'compact'];

  return (
    <div
      id={sheetId}
      dir="rtl"
      className="official-a4-sheet bg-white text-slate-950 mx-auto w-full max-w-[210mm] min-h-[292mm] p-2 sm:p-4 shadow-sm border border-slate-300 print:border-0 print:p-0 font-official select-text relative"
    >
      {/* Outer Executive Frame: Ultra High-Contrast Deep Navy Blue */}
      <div
        className={`border-[2.5px] border-[#081c30] ${
          isClassicDouble ? 'p-[3.5px]' : 'p-3 sm:p-5'
        } min-h-[282mm] flex flex-col justify-between relative bg-white`}
      >
        {/* Inner Border Frame: Crisp Hairline Accent */}
        <div
          className={`${
            isClassicDouble ? 'border border-[#0c2f52] p-3 sm:p-5' : ''
          } min-h-[278mm] flex flex-col justify-between relative bg-white`}
        >
          {/* Subtle Security Watermark Background */}
          {settings.showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
              <OfficialLogo className="w-[105mm] h-[105mm]" />
            </div>
          )}

          <div className="relative z-10">
            {/* Top Official Corporate Header (High Contrast) */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#081c30]">
              {/* Right: Company & Area Hierarchy Only (بدون إدارة شبكات مياه دسوق في الهيدر بناءً على الطلب) */}
              <div className="text-right space-y-0.5 pt-0.5">
                <p className={`${typography.orgTitle} font-black leading-tight text-[#081c30] tracking-normal`}>
                  {settings.holdingCompanyName || 'الشركة القابضة لمياه الشرب والصرف الصحي'}
                </p>
                <p className={`${typography.orgSub} font-extrabold leading-tight text-[#0f3459]`}>
                  {settings.subsidiaryCompanyName || 'شركه مياه الشرب والصرف الصحي بكفر الشيخ'}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="w-1.5 h-1.5 bg-[#081c30] rounded-full inline-block"></span>
                  <p className={`${typography.orgSub} font-black leading-tight text-[#081c30]`}>
                    {settings.areaName || 'منطقة مياه دسوق'}
                  </p>
                </div>
              </div>

              {/* Left: Verification QR Code & Official Logo */}
              <div className="flex items-center gap-3 shrink-0">
                {settings.showQrCode && (
                  <div className="hidden sm:flex flex-col items-center border-2 border-[#081c30] p-1.5 rounded-xs bg-[#f8fafc] text-center shadow-2xs">
                    <svg viewBox="0 0 100 100" className="w-11 h-11" fill="#081c30">
                      <rect x="0" y="0" width="30" height="30" fill="#081c30" />
                      <rect x="5" y="5" width="20" height="20" fill="#fff" />
                      <rect x="10" y="10" width="10" height="10" fill="#081c30" />

                      <rect x="70" y="0" width="30" height="30" fill="#081c30" />
                      <rect x="75" y="5" width="20" height="20" fill="#fff" />
                      <rect x="80" y="10" width="10" height="10" fill="#081c30" />

                      <rect x="0" y="70" width="30" height="30" fill="#081c30" />
                      <rect x="5" y="75" width="20" height="20" fill="#fff" />
                      <rect x="10" y="80" width="10" height="10" fill="#081c30" />

                      <rect x="40" y="10" width="20" height="10" fill="#081c30" />
                      <rect x="10" y="40" width="10" height="20" fill="#081c30" />
                      <rect x="35" y="35" width="30" height="30" fill="#081c30" />
                      <rect x="45" y="45" width="10" height="10" fill="#fff" />
                      <rect x="75" y="40" width="15" height="10" fill="#081c30" />
                      <rect x="40" y="75" width="15" height="15" fill="#081c30" />
                      <rect x="65" y="70" width="15" height="10" fill="#081c30" />
                      <rect x="85" y="85" width="10" height="10" fill="#081c30" />
                    </svg>
                    <span className="text-[7.5px] font-mono font-black tracking-tight text-[#081c30] mt-0.5">
                      اعتماد رقمي
                    </span>
                  </div>
                )}
                <OfficialLogo className="w-22 h-18 sm:w-24 sm:h-20" />
              </div>
            </div>

            {/* Corporate Sleek High-Contrast Title Banner with Integrated Official Number Badge */}
            <div className="my-2.5 flex items-stretch border-2 border-[#081c30] shadow-sm rounded-xs overflow-hidden">
              <div className="flex-1 bg-gradient-to-l from-[#06182a] via-[#0c2f52] to-[#06182a] text-white text-center py-2 px-4 flex items-center justify-center">
                <h1 className={`${typography.bannerTitle} font-black tracking-wide drop-shadow-xs`}>
                  {report.reportTitle || (isTransfer ? 'محضر إذن مناقيل عهدة' : 'محضر استلام عهدة')}
                  {report.custodyType && (
                    <span className="text-[11.5px] font-semibold text-sky-200 mr-2.5">
                      ({report.custodyType})
                    </span>
                  )}
                </h1>
              </div>

              {showReportNumberBadge && report.reportNumber && (
                <div className="bg-[#eef6ff] border-r-2 border-[#081c30] px-4 py-1.5 flex flex-col items-center justify-center shrink-0 min-w-[145px]">
                  <span className="text-[9.5px] font-black text-[#0c2f52] uppercase tracking-wider">
                    {isTransfer ? 'رقم إذن المناقيل' : 'رقم المحضر'}
                  </span>
                  <span className="text-[15px] font-black font-mono-num text-[#081c30] tracking-wider mt-0.5">
                    {report.reportNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Opening Date & Committee Assembly Line */}
            <div className={`mt-2 mb-2 ${typography.body} font-bold leading-normal text-slate-950 flex items-center flex-wrap gap-1.5`}>
              <span>إنه في يوم ( </span>
              <span className="inline-block min-w-[75px] text-center px-1 border-b-2 border-dotted border-slate-800 text-[#081c30] font-black">
                {report.dayName || '............'}
              </span>
              <span> ) الموافق </span>
              <span className="inline-block min-w-[28px] text-center font-mono-num font-black text-[#081c30] px-0.5">
                {meetingParts.day}
              </span>
              <span> / </span>
              <span className="inline-block min-w-[28px] text-center font-mono-num font-black text-[#081c30] px-0.5">
                {meetingParts.month}
              </span>
              <span> / </span>
              <span className="inline-block min-w-[44px] text-center font-mono-num font-black text-[#081c30] px-0.5">
                {meetingParts.year}
              </span>
              <span>
                م، اجتمعت اللجنة المشكلة {isTransfer ? 'لإجراء مناقلة وقيد العهدة والمهمات من كلاً من:' : 'من كلاً من:'}
              </span>
            </div>

            {/* Committee Members Top Preview (خط متقطع في مستوي أفقي متساوٍ تماماً) */}
            <div className="my-2 bg-[#f8fafc] p-2 border-2 border-slate-300 rounded-xs">
              <table className="w-full border-collapse table-fixed">
                <tbody>
                  {report.committeeMembers.map((member, index) => (
                    <tr
                      key={member.id || index}
                      className={`${typography.body} font-bold text-slate-950 h-7`}
                    >
                      <td className="w-8/12 align-bottom pb-1 pr-1 pl-2">
                        <div className="flex items-center gap-1.5 border-b border-dotted border-slate-700 pb-0.5 h-6">
                          <span className="shrink-0 font-mono-num font-black text-white bg-[#081c30] px-1.5 py-0.2 rounded-xs text-[10.5px]">
                            {index + 1}
                          </span>
                          <span className="shrink-0 text-slate-800 font-bold">{member.prefix || 'السيد الأستاذ /'}</span>
                          <span className="truncate text-slate-950 font-black">{member.name || ''}</span>
                        </div>
                      </td>
                      <td className="w-4/12 align-bottom pb-1 pr-2">
                        <div className="border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center pr-2">
                          <span className="text-[#081c30] font-black">{member.committeeRole || 'عضوا'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section Subheader */}
            <div className={`mt-2.5 mb-1.5 ${typography.subhead} font-black text-[#081c30] flex items-center justify-between border-r-4 border-[#081c30] pr-2.5`}>
              <span>
                {isTransfer ? 'وذلك لإجراء مناقلة العهدة والمهمات الآتية:' : 'تسليم عهدة عبارة عن الأصناف الآتية:'}
              </span>
              {isTransfer && report.transferReason && (
                <span className="text-[11px] font-bold text-[#081c30] bg-[#eef6ff] px-2.5 py-0.5 border border-sky-300 rounded-xs">
                  سبب المناقلة: {report.transferReason}
                </span>
              )}
            </div>

            {/* High-Contrast Corporate Items Table */}
            <div className="w-full overflow-x-auto rounded-xs overflow-hidden border-2 border-[#081c30]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#081c30] text-white font-black text-center">
                    <th className={`border-b-2 border-l border-[#081c30] py-2 px-1.5 w-[38px] ${typography.tableHead}`}>م</th>
                    <th className={`border-b-2 border-l border-[#081c30] py-2 px-2.5 min-w-[200px] ${typography.tableHead}`}>
                      اسم الصنف والمواصفات
                    </th>
                    <th className={`border-b-2 border-l border-[#081c30] py-2 px-1.5 w-[65px] ${typography.tableHead}`}>الوحدة</th>
                    <th className={`border-b-2 border-l border-[#081c30] py-2 px-1.5 w-[65px] ${typography.tableHead}`}>العدد</th>
                    <th className={`border-b-2 border-l border-[#081c30] py-2 px-2 w-[115px] ${typography.tableHead}`}>تفقيط الكمية</th>
                    <th className={`border-b-2 border-[#081c30] py-2 px-2 w-[125px] ${typography.tableHead}`}>حالة الصنف والملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className={`text-slate-950 font-bold align-middle transition-colors ${
                        idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'
                      }`}
                    >
                      <td className={`border-t border-l border-slate-400 py-2 px-1 text-center font-mono-num font-black text-[#081c30] ${typography.tableBody}`}>
                        {idx + 1}
                      </td>
                      <td className={`border-t border-l border-slate-400 py-2 px-2.5 text-right leading-snug ${typography.tableBody}`}>
                        <div className="font-black text-slate-950">
                          {item.itemName || '................................................'}
                        </div>
                        {settings.showSerialColumnInPrint && item.serialNumber && (
                          <div className={`inline-block font-mono-num text-[#081c30] bg-[#eef6ff] border border-sky-300 px-1.5 py-0.5 rounded-xs mt-1 font-black ${typography.tableSmall}`}>
                            سيريال / كود: {item.serialNumber}
                          </div>
                        )}
                      </td>
                      <td className={`border-t border-l border-slate-400 py-2 px-1 text-center text-slate-900 ${typography.tableBody}`}>
                        {item.unit || 'عدد'}
                      </td>
                      <td className={`border-t border-l border-slate-400 py-2 px-1 text-center font-mono-num font-black text-[#081c30] text-[13.5px] ${typography.tableBody}`}>
                        {item.quantity ?? 1}
                      </td>
                      <td className={`border-t border-l border-slate-400 py-2 px-1.5 text-center leading-tight font-black text-[#0c2f52] ${typography.tableBody}`}>
                        {item.tafqeet || 'واحد فقط لا غير'}
                      </td>
                      <td className={`border-t border-slate-400 py-2 px-1.5 text-center leading-tight text-slate-900 font-bold ${typography.tableBody}`}>
                        {item.notes || 'بحالة جيدة وصالح للعمل'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* General Committee Notes */}
            {report.generalNotes && (
              <div className="mt-2 text-[11.5px] font-semibold text-slate-950 bg-amber-50/70 p-2 border-r-4 border-amber-600 border-y border-l border-amber-300 rounded-xs">
                <span className="font-black text-amber-950">ملاحظات وقرار اللجنة: </span>
                <span className="font-bold text-slate-900">{report.generalNotes}</span>
              </div>
            )}

            {/* Date of Issue */}
            <div className={`mt-2.5 mb-2 ${typography.body} font-black text-right text-slate-950`}>
              <span>تحريراً في: </span>
              <span className="inline-block min-w-[28px] text-center font-mono-num font-black text-[#081c30] px-0.5">
                {issueParts.day}
              </span>
              <span> / </span>
              <span className="inline-block min-w-[28px] text-center font-mono-num font-black text-[#081c30] px-0.5">
                {issueParts.month}
              </span>
              <span> / </span>
              <span className="inline-block min-w-[44px] text-center font-mono-num font-black text-[#081c30] px-0.5">
                {issueParts.year}
              </span>
              <span>م</span>
            </div>

            {/* ============================================================== */}
            {/* التقرير لمناقلة العهدة (مُسلِّم + مُستلِم) بتباين عالٍ واحترافية فائقة */}
            {/* ============================================================== */}
            {isTransfer ? (
              <div className="mt-2 p-2.5 border-2 border-[#081c30] rounded-xs bg-[#f8fafc] shadow-xs">
                {/* Official Transfer Acknowledgment */}
                <div className="text-[11px] font-bold text-slate-950 mb-2.5 leading-relaxed bg-white p-2 border border-slate-300 rounded-xs shadow-2xs">
                  <span className="font-black text-[#081c30]">إقرار مناقلة عهدة رسمي: </span>
                  أقر أنا الطرف الأول (المُسَلِّم) بالتنازل ونقل قيد عهدة الأصناف المبينة عاليه بحالتها، وأقر أنا الطرف الثاني (المُسْتَلِم) بأنني عاينت واستلمت كافة الأصناف المذكورة بعاليه كاملة وبحالة جيدة ومطابقة وتدخل في عهدتي وتحت مسؤوليتي الكاملة من تاريخه.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-950">
                  {/* الطرف الأول: المُسَلِّم (المتنازل عن العهدة) */}
                  <div className="border-2 border-[#081c30] rounded-xs bg-white overflow-hidden shadow-2xs">
                    <div className="bg-[#081c30] text-white px-2.5 py-1 text-xs font-black flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                        <span>الطرف الأول (المُسَلِّم):</span>
                      </span>
                      <span className="text-[10px] text-sky-200 font-bold">المتنازل عن العهدة</span>
                    </div>

                    <div className="p-2 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-slate-800 text-[11px] font-black">اسم المسلّم /</span>
                        <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center">
                          <span className="font-black text-slate-950 text-[12px]">{report.delivererName || ''}</span>
                          {report.delivererEmployeeCode && (
                            <span className="text-[10px] font-mono-num font-black text-[#081c30] bg-[#eef6ff] border border-sky-300 px-1 py-0.2 rounded-xs mr-1.5">
                              [كود: {report.delivererEmployeeCode}]
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-slate-800 text-[11px] font-black">الوظيفة /</span>
                        <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center">
                          <span className="text-[11.5px] text-slate-900 font-bold">{report.delivererJobTitle || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-slate-800 text-[11px] font-black">الإدارة التابعة /</span>
                        <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center">
                          <span className="text-[11.5px] text-[#081c30] font-black">{report.delivererDepartmentName || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="shrink-0 text-slate-800 text-[11px] font-black">توقيع المسلّم /</span>
                        <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6"></div>
                      </div>
                    </div>
                  </div>

                  {/* الطرف الثاني: المُسْتَلِم (المستلم الجديد للعهدة) */}
                  <div className="border-2 border-[#081c30] rounded-xs bg-white overflow-hidden shadow-2xs">
                    <div className="bg-[#081c30] text-white px-2.5 py-1 text-xs font-black flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                        <span>الطرف الثاني (المُسْتَلِم):</span>
                      </span>
                      <span className="text-[10px] text-sky-200 font-bold">المستلم الجديد للعهدة</span>
                    </div>

                    <div className="p-2 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-slate-800 text-[11px] font-black">اسم المستلم /</span>
                        <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center">
                          <span className="font-black text-slate-950 text-[12px]">{report.recipientName || ''}</span>
                          {report.recipientEmployeeCode && (
                            <span className="text-[10px] font-mono-num font-black text-[#081c30] bg-[#eef6ff] border border-sky-300 px-1 py-0.2 rounded-xs mr-1.5">
                              [كود: {report.recipientEmployeeCode}]
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-slate-800 text-[11px] font-black">الوظيفة /</span>
                        <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center">
                          <span className="text-[11.5px] text-slate-900 font-bold">{report.recipientJobTitle || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-slate-800 text-[11px] font-black">الإدارة التابعة /</span>
                        <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center">
                          <span className="text-[11.5px] text-[#081c30] font-black">{report.departmentName || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="shrink-0 text-slate-800 text-[11px] font-black">توقيع المستلم /</span>
                        <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ============================================================== */
              /* محضر استلام عهدة (مستلم واحد) */
              /* ============================================================== */
              <div className="mt-2 p-2.5 border-2 border-[#081c30] rounded-xs bg-[#f8fafc] shadow-xs">
                <div className="text-[11px] font-bold text-slate-950 mb-2 leading-relaxed bg-white p-2 border border-slate-300 rounded-xs shadow-2xs">
                  <span className="font-black text-[#081c30]">إقرار استلام رسمي: </span>
                  أقر أنا الموقع أدناه باستلام الأصناف المبينة بعاليه كاملة وبحالة جيدة ومطابقة للمواصفات، وعلى سبيل العهدة الشخصية، وأتعهد بالمحافظة عليها وردها عند طلب جهة العمل أو إخلاء الطرف.
                </div>

                <div className={`space-y-2 ${typography.body} font-black text-slate-950`}>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 min-w-[105px] text-slate-800 font-black">اسم المستلم /</span>
                    <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center">
                      <span className="text-slate-950 font-black">{report.recipientName || ''}</span>
                      {settings.showRecipientJobTitleInPrint && report.recipientJobTitle ? (
                        <span className="text-[11.5px] font-bold text-[#0c2f52] mr-2">
                          ({report.recipientJobTitle})
                        </span>
                      ) : null}
                      {settings.showEmployeeCodeInPrint && report.recipientEmployeeCode ? (
                        <span className="text-[11px] font-mono-num font-black text-[#081c30] bg-[#eef6ff] border border-sky-300 px-1 py-0.2 rounded-xs mr-2">
                          [كود: {report.recipientEmployeeCode}]
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-7 flex items-center gap-2">
                      <span className="shrink-0 min-w-[105px] text-slate-800 font-black">الإدارة التابعة /</span>
                      <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6 flex items-center">
                        <span className="text-[#081c30] font-black">{report.departmentName || ''}</span>
                      </div>
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <span className="shrink-0 text-slate-800 font-black">توقيع المستلم /</span>
                      <div className="flex-1 border-b border-dotted border-slate-700 pb-0.5 h-6"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Committee Bottom Signatures Block: خط متقطع في مستوي أفقي واحد متساوٍ تماماً */}
            <div className="mt-3">
              <table className="w-full table-fixed border-collapse border-2 border-[#081c30]">
                <thead>
                  <tr className={`${typography.subhead} font-black text-white bg-[#081c30] text-center`}>
                    <th className="w-5/12 text-right pr-2.5 py-1.5 font-black border-l border-white/30">
                      {isTransfer ? 'أعضاء لجنة المناقلة والمعاينة' : 'أعضاء لجنة الفحص والاستلام'}
                    </th>
                    <th className="w-3/12 text-center py-1.5 font-black border-l border-white/30">الصفة باللجنة / الوظيفة</th>
                    <th className="w-4/12 text-center py-1.5 font-black">
                      {isTransfer ? 'التوقيع بإتمام المناقلة' : 'التوقيع بالاستلام والفحص'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {report.committeeMembers.map((member, index) => (
                    <tr
                      key={`sig-${member.id || index}`}
                      className={`${typography.sigs} font-bold text-slate-950 h-8 border-t border-slate-300`}
                    >
                      {/* عمود الاسم: خط متقطع في نفس الارتفاع المتساوي */}
                      <td className="w-5/12 align-bottom pb-1 pr-1 pl-2 border-l border-slate-300">
                        <div className="flex items-center gap-1.5 border-b border-dotted border-slate-700 pb-0.5 h-6">
                          <span className="shrink-0 font-mono-num font-black text-[#081c30]">{index + 1}-</span>
                          <span className="truncate text-slate-950 font-black">{member.name || ''}</span>
                        </div>
                      </td>

                      {/* عمود الصفة: خط متقطع في نفس الارتفاع المتساوي بالضبط */}
                      <td className="w-3/12 align-bottom pb-1 px-2 border-l border-slate-300">
                        <div className="text-center border-b border-dotted border-slate-700 pb-0.5 h-6 truncate flex items-center justify-center text-[11.5px] text-[#081c30] font-black">
                          <span>{getSignatureRoleText(member)}</span>
                        </div>
                      </td>

                      {/* عمود التوقيع: خط متقطع في نفس الارتفاع المتساوي بالضبط */}
                      <td className="w-4/12 align-bottom pb-1 pl-1 pr-2">
                        <div className="border-b border-dotted border-slate-700 pb-0.5 h-6"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Endorsement & Official Seal Block */}
          <div className="mt-3.5 pt-1 flex items-end justify-between px-2 sm:px-5 relative z-10">
            {/* Official Stamp */}
            <div className="w-32 h-26 flex items-center justify-center">
              {settings.showOfficialStamp && (
                <OfficialStamp
                  companyName={settings.subsidiaryCompanyName}
                  areaName={settings.areaName}
                  departmentName={report.departmentName || 'إدارة المخازن والعهد'}
                  dateStr={report.meetingDate.replace(/-/g, '/')}
                  className="w-28 h-28"
                />
              )}
            </div>

            {/* Executive Approver Box (مربع اعتماد تنفيذي أنيق عالي التباين) */}
            <div className="text-center space-y-1 min-w-[210px] bg-[#f8fafc] p-2.5 border-2 border-[#081c30] rounded-xs shadow-xs">
              <p className={`${typography.approverHeader} font-black text-[#081c30] tracking-wide`}>
                {settings.defaultApproverHeader || 'يعتمد'}
              </p>
              <p className={`${typography.approverTitle} font-black text-[#0c2f52]`}>
                {report.approverTitle || settings.defaultApproverTitle || 'مدير عام المنطقة'}
              </p>
              {report.approverName && (
                <p className="text-[12px] font-black text-slate-900 pt-0.5">{report.approverName}</p>
              )}
              <div className="h-6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
