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
}

export const PrintableReceiptSheet: React.FC<PrintableReceiptSheetProps> = ({
  report,
  settings,
  showReportNumberBadge = true,
  sheetId = 'official-receipt-sheet',
}) => {
  const meetingParts = splitDateParts(report.meetingDate);
  const issueParts = splitDateParts(report.issueDate);

  // تصفية الأصناف: إذا كان الإدخال صنفاً واحداً، يظهر هذا الصنف فقط ولا توضع أي صفوف أخرى بجدول التقرير
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

  return (
    <div
      id={sheetId}
      dir="rtl"
      className="official-a4-sheet bg-white text-black mx-auto w-full max-w-[210mm] min-h-[292mm] p-3 sm:p-5 shadow-sm border border-slate-300 print:border-0 print:p-0 font-official select-text relative"
    >
      {/* Outer Border Box */}
      <div
        className={`border-[2.5px] border-black ${
          isClassicDouble ? 'p-[3px]' : 'p-4 sm:p-6'
        } min-h-[280mm] flex flex-col justify-between relative bg-white`}
      >
        {/* Inner Border Frame (Classic Double Border style) */}
        <div
          className={`${
            isClassicDouble ? 'border border-black p-4 sm:p-6' : ''
          } min-h-[277mm] flex flex-col justify-between relative bg-white`}
        >
          {/* Subtle Security Watermark Background */}
          {settings.showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.038] select-none z-0">
              <OfficialLogo className="w-[120mm] h-[120mm]" />
            </div>
          )}

          <div className="relative z-10">
            {/* Top Official Header: Right Org Info + Left Logo & QR */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b-[2px] border-black">
              <div className="text-right space-y-1 pt-1">
                <p className="text-[17px] sm:text-[18.5px] font-bold leading-snug text-black tracking-normal">
                  {settings.holdingCompanyName || 'الشركة القابضة لمياه الشرب والصرف الصحي'}
                </p>
                <p className="text-[15.5px] sm:text-[17px] font-bold leading-snug text-black">
                  {settings.subsidiaryCompanyName || 'شركه مياه الشرب والصرف الصحي بكفر الشيخ'}
                </p>
                <div className="flex items-center gap-3 pt-0.5">
                  <p className="text-[15.5px] sm:text-[17px] font-bold leading-snug text-black pr-6">
                    {settings.areaName || 'منطقة مياه دسوق'}
                  </p>
                  {showReportNumberBadge && report.reportNumber && (
                    <span className="text-[12px] font-bold text-black border border-black px-2 py-0.5 rounded-xs font-mono-num">
                      رقم المحضر: {report.reportNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Logo & Verification Badge on Left */}
              <div className="flex items-center gap-3 shrink-0">
                {settings.showQrCode && (
                  <div className="hidden sm:flex flex-col items-center border border-black/80 p-1 rounded-xs bg-white text-center">
                    <svg viewBox="0 0 100 100" className="w-14 h-14" fill="#000">
                      <rect x="0" y="0" width="30" height="30" fill="#000" />
                      <rect x="5" y="5" width="20" height="20" fill="#fff" />
                      <rect x="10" y="10" width="10" height="10" fill="#000" />

                      <rect x="70" y="0" width="30" height="30" fill="#000" />
                      <rect x="75" y="5" width="20" height="20" fill="#fff" />
                      <rect x="80" y="10" width="10" height="10" fill="#000" />

                      <rect x="0" y="70" width="30" height="30" fill="#000" />
                      <rect x="5" y="75" width="20" height="20" fill="#fff" />
                      <rect x="10" y="80" width="10" height="10" fill="#000" />

                      <rect x="40" y="10" width="20" height="10" fill="#000" />
                      <rect x="10" y="40" width="10" height="20" fill="#000" />
                      <rect x="35" y="35" width="30" height="30" fill="#000" />
                      <rect x="45" y="45" width="10" height="10" fill="#fff" />
                      <rect x="75" y="40" width="15" height="10" fill="#000" />
                      <rect x="40" y="75" width="15" height="15" fill="#000" />
                      <rect x="65" y="70" width="15" height="10" fill="#000" />
                      <rect x="85" y="85" width="10" height="10" fill="#000" />
                    </svg>
                    <span className="text-[8px] font-mono font-bold tracking-tight text-black mt-0.5">
                      اعتماد رقمي
                    </span>
                  </div>
                )}
                <OfficialLogo className="w-28 h-24 sm:w-32 sm:h-24" />
              </div>
            </div>

            {/* Dark Charcoal Title Banner: محضر استلام */}
            <div className="my-3.5 bg-[#404040] text-white text-center py-2 px-4 border-[1.5px] border-black shadow-xs">
              <h1 className="text-[20px] sm:text-[22px] font-bold tracking-wide">
                {report.reportTitle || settings.defaultReportTitle || 'محضر استلام'}
              </h1>
            </div>

            {/* Opening Date & Day Line */}
            <div className="mt-4 mb-4 text-[16px] sm:text-[17.5px] font-bold leading-relaxed text-black">
              <span>إنه في يوم ( </span>
              <span className="inline-block min-w-[80px] text-center px-2 border-b border-dotted border-black/80">
                {report.dayName || '............'}
              </span>
              <span> ) الموافق </span>
              <span className="inline-block min-w-[34px] text-center font-mono-num px-1">
                {meetingParts.day}
              </span>
              <span> / </span>
              <span className="inline-block min-w-[34px] text-center font-mono-num px-1">
                {meetingParts.month}
              </span>
              <span> / </span>
              <span className="inline-block min-w-[50px] text-center font-mono-num px-1">
                {meetingParts.year}
              </span>
              <span> اجتمعت اللجنة المشكلة من كلا من:</span>
            </div>

            {/* Committee Members Numbered List at Top */}
            <div className="space-y-2.5 my-4 pr-1 sm:pr-2">
              {report.committeeMembers.map((member, index) => (
                <div
                  key={member.id || index}
                  className="grid grid-cols-12 items-baseline gap-2 text-[15.5px] sm:text-[17px] font-bold text-black"
                >
                  <div className="col-span-9 sm:col-span-8 flex items-baseline gap-1.5">
                    <span className="shrink-0 font-mono-num">{index + 1}-</span>
                    <span className="shrink-0">{member.prefix || 'السيد الأستاذ /'}</span>
                    <span className="flex-1 border-b border-dotted border-black px-2 pb-0.5 text-right min-h-[24px]">
                      {member.name || ''}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-4 text-right pr-2 sm:pr-4">
                    <span>{member.committeeRole || 'عضوا'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Section Subheader: تسليم عهدة عبارة عن: */}
            <div className="mt-5 mb-2.5 text-[16px] sm:text-[17.5px] font-bold text-black">
              تسليم عهدة عبارة عن:
            </div>

            {/* Items Table: فقط الأصناف الفعلية بدون أي صفوف تكميلية أو منقطة */}
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse border-[2px] border-black text-[14px] sm:text-[15.5px]">
                <thead>
                  <tr className="bg-[#404040] text-white font-bold text-center">
                    <th className="border-[1.5px] border-black py-2.5 px-2 w-[44px]">م</th>
                    <th className="border-[1.5px] border-black py-2.5 px-3 min-w-[220px]">
                      أسم الصنف وبياناته
                    </th>
                    <th className="border-[1.5px] border-black py-2.5 px-2 w-[76px]">الوحدة</th>
                    <th className="border-[1.5px] border-black py-2.5 px-2 w-[76px]">الكمية</th>
                    <th className="border-[1.5px] border-black py-2.5 px-2 w-[120px]">تفقيط</th>
                    <th className="border-[1.5px] border-black py-2.5 px-2 w-[130px]">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="text-black font-semibold align-middle hover:bg-slate-50/50"
                    >
                      <td className="border-[1.5px] border-black py-2.5 px-1.5 text-center font-mono-num">
                        {idx + 1}
                      </td>
                      <td className="border-[1.5px] border-black py-2.5 px-3 text-right leading-relaxed">
                        <div className="font-bold">
                          {item.itemName || '................................................'}
                        </div>
                        {settings.showSerialColumnInPrint && item.serialNumber && (
                          <div className="text-[12px] text-black/80 font-mono-num mt-0.5">
                            بيان/سيريال: {item.serialNumber}
                          </div>
                        )}
                      </td>
                      <td className="border-[1.5px] border-black py-2.5 px-2 text-center">
                        {item.unit || 'عدد'}
                      </td>
                      <td className="border-[1.5px] border-black py-2.5 px-2 text-center font-mono-num font-bold">
                        {item.quantity ?? 1}
                      </td>
                      <td className="border-[1.5px] border-black py-2.5 px-2 text-center text-[13px] leading-snug">
                        {item.tafqeet || 'واحد فقط لا غير'}
                      </td>
                      <td className="border-[1.5px] border-black py-2.5 px-2 text-center text-[13px] leading-snug">
                        {item.notes || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {report.generalNotes && (
              <div className="mt-2.5 text-[14px] font-semibold text-black">
                <span className="font-bold">بيان / ملاحظات اللجنة: </span>
                <span className="font-normal">{report.generalNotes}</span>
              </div>
            )}

            {/* Issue Date */}
            <div className="mt-4 mb-3 text-[16px] sm:text-[17.5px] font-bold text-right text-black">
              <span>تحريرا في: </span>
              <span className="inline-block min-w-[34px] text-center font-mono-num">
                {issueParts.day}
              </span>
              <span> / </span>
              <span className="inline-block min-w-[34px] text-center font-mono-num">
                {issueParts.month}
              </span>
              <span> / </span>
              <span className="inline-block min-w-[50px] text-center font-mono-num">
                {issueParts.year}
              </span>
            </div>

            {/* Recipient Details Block */}
            <div className="mt-3 space-y-3 max-w-[76%] text-[15.5px] sm:text-[17px] font-bold text-black">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 min-w-[120px]">اسم المستلم /</span>
                <span className="flex-1 border-b border-dotted border-black px-2 pb-0.5 min-h-[24px]">
                  {report.recipientName || ''}
                  {settings.showRecipientJobTitleInPrint && report.recipientJobTitle ? (
                    <span className="text-[14px] font-semibold text-black/80 mr-2">
                      ({report.recipientJobTitle})
                    </span>
                  ) : null}
                  {settings.showEmployeeCodeInPrint && report.recipientEmployeeCode ? (
                    <span className="text-[13px] font-mono-num text-black/70 mr-2">
                      [كود: {report.recipientEmployeeCode}]
                    </span>
                  ) : null}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="shrink-0 min-w-[120px]">الإدارة التابعة /</span>
                <span className="flex-1 border-b border-dotted border-black px-2 pb-0.5 min-h-[24px]">
                  {report.departmentName || ''}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="shrink-0 min-w-[120px]">توقيع المستلم /</span>
                <span className="flex-1 border-b border-dotted border-black px-2 pb-0.5 min-h-[24px]"></span>
              </div>
            </div>

            {/* Committee Bottom Signatures Block */}
            <div className="mt-6">
              <div className="grid grid-cols-12 gap-3 text-[16px] sm:text-[17.5px] font-bold text-black mb-2.5">
                <div className="col-span-5 text-right pr-2">اللجنة:</div>
                <div className="col-span-3 text-center">الصفة</div>
                <div className="col-span-4 text-center">التوقيع</div>
              </div>

              <div className="space-y-3">
                {report.committeeMembers.map((member, index) => (
                  <div
                    key={`sig-${member.id || index}`}
                    className="grid grid-cols-12 items-baseline gap-3 text-[15px] sm:text-[16.5px] font-bold text-black"
                  >
                    <div className="col-span-5 flex items-baseline gap-1.5">
                      <span className="shrink-0 font-mono-num">{index + 1}-</span>
                      <span className="flex-1 border-b border-dotted border-black px-2 pb-0.5 min-h-[24px] truncate">
                        {member.name || ''}
                      </span>
                    </div>
                    <div className="col-span-3 text-center border-b border-dotted border-black px-1 pb-0.5 min-h-[24px] text-[14px]">
                      {getSignatureRoleText(member)}
                    </div>
                    <div className="col-span-4 border-b border-dotted border-black px-2 pb-0.5 min-h-[24px]"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Left Endorsement Block + Official Stamp */}
          <div className="mt-7 pt-2 flex items-end justify-between px-2 sm:px-6 relative z-10">
            {/* Stamp on Left/Middle if toggled */}
            <div className="w-36 h-28 flex items-center justify-center">
              {settings.showOfficialStamp && (
                <OfficialStamp
                  companyName={settings.subsidiaryCompanyName}
                  areaName={settings.areaName}
                  departmentName={report.departmentName || 'إدارة المخازن والعهد'}
                  dateStr={report.meetingDate.replace(/-/g, '/')}
                  className="w-32 h-32"
                />
              )}
            </div>

            {/* Approval Box */}
            <div className="text-center space-y-1.5 min-w-[210px]">
              <p className="text-[16px] sm:text-[18px] font-bold text-black">
                {settings.defaultApproverHeader || 'يعتمد'}
              </p>
              <p className="text-[16.5px] sm:text-[18.5px] font-bold text-black">
                {report.approverTitle || settings.defaultApproverTitle || 'مدير عام المنطقة'}
              </p>
              {report.approverName && (
                <p className="text-[15px] font-semibold text-black pt-1">{report.approverName}</p>
              )}
              <div className="h-9"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
