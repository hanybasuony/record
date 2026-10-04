import React from 'react';
import { CustodyReport, OrganizationSettings } from '../types';
import { OfficialLogo } from './OfficialLogo';
import { OfficialStamp } from './OfficialStamp';
import { numberToArabicTafqeet } from '../utils/arabicTafqeet';
import { FileText, Share2, CheckCircle2, QrCode } from 'lucide-react';

interface PrintableArchiveLedgerProps {
  sheetId?: string;
  reports: CustodyReport[];
  settings: OrganizationSettings;
  filterDescription?: string;
  dateRangeDescription?: string;
  showKpiSummary?: boolean;
  showItemDetails?: boolean;
  showSignatures?: boolean;
  orientation?: 'landscape' | 'portrait';
  printFontSize?: 'small' | 'medium' | 'large';
}

export const PrintableArchiveLedger: React.FC<PrintableArchiveLedgerProps> = ({
  sheetId = 'official-archive-ledger-sheet',
  reports = [],
  settings,
  filterDescription = 'كافة المحاضر والأذون المقيدة',
  dateRangeDescription,
  showKpiSummary = true,
  showItemDetails = true,
  showSignatures = true,
  orientation = 'landscape',
  printFontSize = 'medium',
}) => {
  // Statistics calculations
  const totalReportsCount = reports.length;
  const receiptsCount = reports.filter(
    (r) => r.reportType !== 'transfer' && !Boolean(r.delivererName && r.delivererName.trim())
  ).length;
  const transfersCount = reports.filter(
    (r) => r.reportType === 'transfer' || Boolean(r.delivererName && r.delivererName.trim())
  ).length;
  const totalItemsCount = reports.reduce((acc, r) => acc + (r.items ? r.items.length : 0), 0);
  const approvedReportsCount = reports.filter((r) => r.status === 'معتمد').length;

  const isLandscape = orientation === 'landscape';

  const fontScaleClasses = {
    small: 'text-[9.5px]',
    medium: 'text-[11px]',
    large: 'text-[12px]',
  }[printFontSize];

  const currentDateFormatted = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  const currentTimeFormatted = new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());

  return (
    <div
      id={sheetId}
      dir="rtl"
      className={`official-archive-sheet bg-white text-slate-800 mx-auto w-full ${
        isLandscape ? 'max-w-[297mm] min-h-[200mm]' : 'max-w-[210mm] min-h-[285mm]'
      } p-3 sm:p-5 shadow-sm border border-slate-300 print:border-0 print:p-0 font-official select-text relative`}
    >
      {/* Outer Executive Frame */}
      <div className="border-2 border-[#16324f] p-2.5 sm:p-3.5 min-h-full flex flex-col justify-between relative bg-white">
        {/* Inner Fine Border Frame */}
        <div className="border border-slate-300 p-2.5 sm:p-3.5 flex flex-col justify-between relative bg-white">
          
          {/* Subtle Security Watermark Background */}
          {settings.showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
              <OfficialLogo
                className={isLandscape ? 'w-[140mm] h-[140mm]' : 'w-[110mm] h-[110mm]'}
                customLogoUrl={settings.customLogoUrl}
              />
            </div>
          )}

          <div className="relative z-10 space-y-3">
            {/* Top Official Executive Corporate Header */}
            <div className="flex items-start justify-between gap-3 pb-2.5 border-b-2 border-slate-300">
              {/* Right: Company & Area Hierarchy */}
              <div className="text-right space-y-0.5 pt-0.5 min-w-[200px]">
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {settings.holdingCompanyName || 'الشركة القابضة لمياه الشرب والصرف الصحي'}
                </p>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight">
                  {settings.subsidiaryCompanyName || 'شركة مياه الشرب والصرف الصحي بكفر الشيخ'}
                </p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="w-1.5 h-1.5 bg-sky-700 rounded-full inline-block"></span>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                    {settings.areaName || 'منطقة مياه دسوق'} — إدارة المخازن والعهد
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold pt-0.5">
                  قسم السجلات الرقمية والأرشيف العام
                </p>
              </div>

              {/* Center: Official Company Logo & Document Formal Title */}
              <div className="text-center flex-1 px-2 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <OfficialLogo
                    className="w-14 h-14 sm:w-16 sm:h-16 aspect-square shrink-0"
                    customLogoUrl={settings.customLogoUrl}
                  />
                  <div className="text-right">
                    <span className="inline-block bg-[#16324f] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1 tracking-wider">
                      سجل رسمي معتمد
                    </span>
                    <h1 className="text-sm sm:text-base font-black text-[#16324f] tracking-wide leading-snug">
                      سجل حصر وقيد محاضر الاستلام وأذون مناقيل العهد
                    </h1>
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-600 font-medium max-w-xl text-center">
                  سجل وثائقي رسمي معتمد لقيد وتداول العهد العينية والشخصية ومهمات التشغيل والصيانة
                </p>
              </div>

              {/* Left: Administrative Registry Metadata & Digital Verification */}
              <div className="text-left space-y-1 min-w-[180px] shrink-0">
                <div className="bg-[#f8fafc] border border-slate-300 rounded p-1.5 text-right space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">كود السجل:</span>
                    <span className="font-mono-num font-bold text-slate-900">س-ع/دسوق/2026</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">تاريخ الاستخراج:</span>
                    <span className="font-bold text-slate-900">{currentDateFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">توقيت الطباعة:</span>
                    <span className="font-mono-num font-bold text-slate-700">{currentTimeFormatted}</span>
                  </div>
                  {dateRangeDescription && (
                    <div className="flex items-center justify-between text-[10px] border-t border-slate-200 pt-0.5">
                      <span className="text-slate-500 font-medium">الفترة الزمنية:</span>
                      <span className="font-bold text-sky-800 text-[9.5px]">{dateRangeDescription}</span>
                    </div>
                  )}
                </div>

                {settings.showQrCode && (
                  <div className="flex items-center justify-end gap-1.5 text-[9px] text-slate-500 pt-0.5">
                    <span className="font-semibold">اعتماد رقمي مشفر</span>
                    <QrCode className="w-3.5 h-3.5 text-sky-800" />
                  </div>
                )}
              </div>
            </div>

            {/* Executive KPI Summary Cards Banner */}
            {showKpiSummary && (
              <div className="bg-gradient-to-l from-slate-50 via-sky-50/40 to-slate-50 border border-slate-300 rounded p-2.5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                {/* Total Reports */}
                <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-bold">إجمالي المحاضر المقيدة</div>
                  <div className="text-base font-black text-[#16324f] font-mono-num">
                    {totalReportsCount} <span className="text-[10px] font-normal text-slate-600">محضر/إذن</span>
                  </div>
                </div>

                {/* Custody Receipts */}
                <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs">
                  <div className="text-[10px] text-sky-700 font-bold flex items-center justify-center gap-1">
                    <FileText className="w-3 h-3 text-sky-700" />
                    <span>محاضر استلام عهدة</span>
                  </div>
                  <div className="text-base font-black text-sky-900 font-mono-num">
                    {receiptsCount} <span className="text-[10px] font-normal text-slate-600">محضر</span>
                  </div>
                </div>

                {/* Transfer Permits */}
                <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs">
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                    <Share2 className="w-3 h-3 text-emerald-700" />
                    <span>أذون مناقيل عهدة</span>
                  </div>
                  <div className="text-base font-black text-emerald-900 font-mono-num">
                    {transfersCount} <span className="text-[10px] font-normal text-slate-600">إذن</span>
                  </div>
                </div>

                {/* Total Item Records */}
                <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs">
                  <div className="text-[10px] text-slate-600 font-bold">إجمالي الأصناف المحصورة</div>
                  <div className="text-base font-black text-slate-900 font-mono-num">
                    {totalItemsCount} <span className="text-[10px] font-normal text-slate-600">بند/صنف</span>
                  </div>
                </div>

                {/* Approval Status */}
                <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>محاضر معتمدة رسمياً</span>
                  </div>
                  <div className="text-base font-black text-emerald-800 font-mono-num">
                    {approvedReportsCount}{' '}
                    <span className="text-[10px] font-normal text-slate-500">
                      ({totalReportsCount > 0 ? Math.round((approvedReportsCount / totalReportsCount) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scope / Filter Description Notification */}
            <div className="flex items-center justify-between text-[10.5px] px-1 text-slate-600 font-medium">
              <div>
                <strong className="text-slate-900">نطاق السجل المطبوع:</strong> {filterDescription}
              </div>
              <div>
                عدد البنود المعروضة:{' '}
                <strong className="text-slate-900 font-mono-num">{reports.length}</strong> محضر
              </div>
            </div>

            {/* The Official Government Registry Ledger Table */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className={`w-full text-right border-collapse ${fontScaleClasses}`}>
                <thead>
                  <tr className="bg-[#16324f] text-white border-b border-[#0d2135] font-bold text-center">
                    <th className="py-2 px-1.5 w-8 border-l border-slate-600">م</th>
                    <th className="py-2 px-2 w-24 border-l border-slate-600 text-right">رقم المحضر</th>
                    <th className="py-2 px-2 w-20 border-l border-slate-600">تاريخ الانعقاد</th>
                    <th className="py-2 px-2 w-24 border-l border-slate-600">نوع المستند</th>
                    <th className="py-2 px-2 border-l border-slate-600 text-right">الطرف المستلم والصفة</th>
                    <th className="py-2 px-2 border-l border-slate-600 text-right">الإدارة / المحطة</th>
                    {showItemDetails && (
                      <th className="py-2 px-2 border-l border-slate-600 text-right">
                        بيان الأصناف والكميات المحصورة
                      </th>
                    )}
                    <th className="py-2 px-2 border-l border-slate-600 text-right">لجنة الفحص والاستلام</th>
                    <th className="py-2 px-2 w-16 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={showItemDetails ? 9 : 8}
                        className="py-8 text-center text-slate-500 font-semibold"
                      >
                        لا توجد محاضر مقيدة مطابقة لمعايير السجل الحالية.
                      </td>
                    </tr>
                  ) : (
                    reports.map((rep, index) => {
                      const isTransfer =
                        rep.reportType === 'transfer' ||
                        Boolean(rep.delivererName && rep.delivererName.trim());

                      return (
                        <tr
                          key={rep.id || index}
                          className="hover:bg-slate-50/80 even:bg-slate-50/40 transition-colors"
                        >
                          {/* Seq */}
                          <td className="py-2 px-1 text-center font-mono-num font-bold text-slate-700 border-l border-slate-200">
                            {index + 1}
                          </td>

                          {/* Report Number */}
                          <td className="py-2 px-2 font-mono-num font-black text-slate-900 border-l border-slate-200 whitespace-nowrap">
                            {rep.reportNumber}
                          </td>

                          {/* Meeting Date */}
                          <td className="py-2 px-2 text-center font-mono-num text-slate-700 border-l border-slate-200 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{rep.meetingDate}</div>
                            <div className="text-[9.5px] text-slate-500">يوم {rep.dayName}</div>
                          </td>

                          {/* Document Type */}
                          <td className="py-2 px-2 border-l border-slate-200 whitespace-nowrap">
                            {isTransfer ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                                <Share2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                <span>إذن مناقيل</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-300 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                                <FileText className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                                <span>محضر استلام</span>
                              </span>
                            )}
                          </td>

                          {/* Recipient Party */}
                          <td className="py-2 px-2 border-l border-slate-200">
                            {isTransfer ? (
                              <div className="space-y-0.5 text-[10.5px]">
                                <div>
                                  <span className="text-slate-500 font-medium">المستلم: </span>
                                  <strong className="text-slate-900">{rep.recipientName || '—'}</strong>
                                  {rep.recipientJobTitle && (
                                    <span className="text-slate-500 text-[9.5px]"> ({rep.recipientJobTitle})</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-600">
                                  <span className="text-slate-500 font-medium">المسلّم: </span>
                                  <span className="font-semibold text-slate-800">{rep.delivererName || '—'}</span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-slate-900">
                                  {rep.recipientName || 'غير محدد'}
                                </div>
                                <div className="text-[9.5px] text-slate-500 flex items-center gap-1.5">
                                  {rep.recipientJobTitle && <span>{rep.recipientJobTitle}</span>}
                                  {rep.recipientEmployeeCode && (
                                    <span className="font-mono-num font-semibold text-slate-700">
                                      كود: {rep.recipientEmployeeCode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Department */}
                          <td className="py-2 px-2 font-medium text-slate-800 border-l border-slate-200">
                            {isTransfer && rep.delivererDepartmentName ? (
                              <div className="text-[10px] space-y-0.5">
                                <div className="text-slate-500">من: {rep.delivererDepartmentName}</div>
                                <div className="text-slate-900 font-bold">إلى: {rep.departmentName || '—'}</div>
                              </div>
                            ) : (
                              <div className="text-[10.5px] font-semibold text-slate-800">
                                {rep.departmentName || '—'}
                              </div>
                            )}
                          </td>

                          {/* Items Breakdown */}
                          {showItemDetails && (
                            <td className="py-2 px-2 border-l border-slate-200 max-w-[280px]">
                              {rep.items && rep.items.length > 0 ? (
                                <div className="space-y-0.5">
                                  {rep.items.slice(0, 3).map((item, itemIdx) => (
                                    <div
                                      key={itemIdx}
                                      className="text-[10px] text-slate-800 flex items-center justify-between gap-1 border-b border-slate-100 last:border-0 pb-0.5"
                                    >
                                      <span className="truncate max-w-[190px]">
                                        • {item.itemName}
                                      </span>
                                      <span className="font-mono-num font-bold text-slate-900 whitespace-nowrap">
                                        {item.quantity} {item.unit}
                                      </span>
                                    </div>
                                  ))}
                                  {rep.items.length > 3 && (
                                    <div className="text-[9px] text-sky-800 font-bold pt-0.5">
                                      + {rep.items.length - 3} أصناف إضافية أخرى
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">لا توجد أصناف</span>
                              )}
                            </td>
                          )}

                          {/* Committee Members */}
                          <td className="py-2 px-2 text-[10px] text-slate-700 border-l border-slate-200">
                            {rep.committeeMembers && rep.committeeMembers.length > 0 ? (
                              <div className="space-y-0.5">
                                {rep.committeeMembers.map((cm, cmIdx) => (
                                  <div key={cmIdx} className="truncate max-w-[160px]">
                                    <span className="font-medium text-slate-900">{cm.name}</span>
                                    <span className="text-slate-500 text-[9px]"> ({cm.committeeRole})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">بدون لجنة</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2 px-1 text-center font-bold text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-extrabold ${
                                rep.status === 'معتمد'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : rep.status === 'مسلم'
                                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {rep.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Records Tafqeet & Closing Clause */}
            <div className="bg-slate-50 border border-slate-300 rounded p-2 text-xs flex flex-wrap items-center justify-between gap-2 font-medium">
              <div>
                <strong className="text-slate-900">إجمالي قيد السجل:</strong>{' '}
                <span className="font-bold text-sky-900 font-mono-num">{totalReportsCount}</span> محضر وإذن، فقط{' '}
                <strong className="text-slate-900 underline decoration-slate-400">
                  {numberToArabicTafqeet(totalReportsCount)}
                </strong>{' '}
                محضر لا غير.
              </div>
              <div className="text-[11px] text-slate-600">
                إجمالي الأصناف العينية المقيدة:{' '}
                <strong className="text-slate-900 font-mono-num">{totalItemsCount}</strong> صنفاً وبنداً مسجلاً ومطابقاً لدفاتر العهد.
              </div>
            </div>

            {/* Official Endorsement & Signatures Block */}
            {showSignatures && (
              <div className="pt-2 border-t border-slate-300">
                <div className="text-center font-bold text-slate-800 text-[11px] mb-2 tracking-wide">
                  اعتماد ومطابقة سجل قيد العهد والأرشيف العام لمنطقة مياه دسوق
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* 1. Archivist */}
                  <div className="p-2 border border-slate-200 rounded bg-white space-y-1">
                    <p className="font-bold text-slate-800 text-[11px]">مسؤول السجل والأرشيف</p>
                    <p className="text-[10px] text-slate-500">الاسم والتوقيع:</p>
                    <div className="pt-6 border-b border-dashed border-slate-300 w-3/4 mx-auto"></div>
                    <p className="text-[9.5px] text-slate-400">التاريخ: ... / ... / 2026</p>
                  </div>

                  {/* 2. Storekeeper */}
                  <div className="p-2 border border-slate-200 rounded bg-white space-y-1">
                    <p className="font-bold text-slate-800 text-[11px]">أمين المخزن والعهد المختص</p>
                    <p className="text-[10px] text-slate-500">الاسم والتوقيع:</p>
                    <div className="pt-6 border-b border-dashed border-slate-300 w-3/4 mx-auto"></div>
                    <p className="text-[9.5px] text-slate-400">التاريخ: ... / ... / 2026</p>
                  </div>

                  {/* 3. Stores & Custody Manager */}
                  <div className="p-2 border border-slate-200 rounded bg-white space-y-1">
                    <p className="font-bold text-slate-800 text-[11px]">مدير إدارة المخازن والعهد</p>
                    <p className="text-[10px] text-slate-500">الاسم والتوقيع:</p>
                    <div className="pt-6 border-b border-dashed border-slate-300 w-3/4 mx-auto"></div>
                    <p className="text-[9.5px] text-slate-400">التاريخ: ... / ... / 2026</p>
                  </div>

                  {/* 4. Approver & Official Stamp */}
                  <div className="p-2 border border-slate-200 rounded bg-white space-y-1 relative">
                    <p className="font-black text-slate-900 text-[11px]">
                      {settings.defaultApproverHeader || 'يعتمد'}
                    </p>
                    <p className="text-[10.5px] font-bold text-slate-700">
                      {settings.defaultApproverTitle || 'مدير عام منطقة مياه دسوق'}
                    </p>
                    <div className="pt-6 border-b border-dashed border-slate-300 w-3/4 mx-auto"></div>
                    <p className="text-[10px] font-bold text-slate-800">
                      {settings.defaultApproverName || 'م. سامي كامل عبد العزيز'}
                    </p>

                    {/* Official Rubber Stamp */}
                    {settings.showOfficialStamp && (
                      <div className="absolute -top-3 -left-3 pointer-events-none opacity-85">
                        <OfficialStamp
                          className="w-24 h-24"
                          companyName={settings.subsidiaryCompanyName}
                          areaName={settings.areaName}
                          departmentName="إدارة المخازن والعهد"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Document Security & Official Authority Footer */}
            <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-200">
              <div>
                منظومة عهدتي الرقمية المعتمدة © شركة مياه الشرب والصرف الصحي بكفر الشيخ — منطقة مياه دسوق
              </div>
              <div className="font-mono-num">
                سجل إلكتروني معتمد ونافذ قانونياً • رمز التحقق: HCWW-DSQ-ARCH-2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
