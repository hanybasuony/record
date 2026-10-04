import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  Save,
  Plus,
  Trash2,
  FileText,
  Users,
  Building2,
  Package,
  Settings,
  Search,
  Copy,
  CheckCircle2,
  Download,
  Upload,
  UserPlus,
  ChevronDown,
  BookmarkPlus,
  FileDown,
  FileCheck,
  Calendar,
  Filter,
  X,
  Loader2,
  Share2,
  ArrowLeftRight,
  RefreshCw,
  Phone,
  LayoutGrid,
  List,
  Briefcase,
  ShieldCheck,
  FileSpreadsheet,
  UserCheck,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import {
  DatabaseSchema,
  CustodyReport,
  CustodyItem,
  CommitteeMemberEntry,
  RecipientRecord,
  DepartmentRecord,
  CommitteeMemberRecord,
  CommitteePreset,
  CatalogItemRecord,
} from './types';
import {
  numberToArabicTafqeet,
  getArabicDayName,
} from './utils/arabicTafqeet';
import { PrintableReceiptSheet } from './components/PrintableReceiptSheet';
import { PrintableArchiveLedger } from './components/PrintableArchiveLedger';
import { OfficialLogo } from './components/OfficialLogo';
import { exportReportToPdf } from './utils/exportPdf';
import { exportReportToDocx } from './utils/exportDocx';
import { DEFAULT_DATABASE } from './data/defaultDatabase';

const LOCAL_STORAGE_KEY = 'desouk_water_custody_db_v1';

const DEFAULT_PREFIXES = [
  'السيد الأستاذ /',
  'السيد المهندس /',
  'السيد المحاسب /',
  'السيد الكيميائي /',
  'السيد الفني /',
  'السيد الدكتور /',
  'السيدة الأستاذة /',
  'السيدة المهندسة /',
];

const DEFAULT_COMMITTEE_ROLES = [
  'رئيسا',
  'عضوا',
  'عضوا فنيا',
  'عضوا ماليا',
  'أمين مخزن',
  'مراقب عهدة',
];

const DEFAULT_UNITS = [
  'عدد',
  'طقم',
  'جهاز',
  'قطعة',
  'وحدة',
  'متر',
  'كرتونة',
  'علبة',
  'لتر',
];

function createEmptyReport(
  nextNumber: string,
  defaultPreset?: CommitteePreset,
  defaultTitle = 'محضر استلام',
  defaultApproverTitle = 'مدير عام المنطقة',
  defaultApproverName = '',
  reportType: 'receipt' | 'transfer' = 'receipt'
): CustodyReport {
  const today = '2026-10-02';
  const defaultMembers: CommitteeMemberEntry[] =
    defaultPreset && defaultPreset.members.length > 0
      ? defaultPreset.members.map((m, idx) => ({
          ...m,
          id: `cm-init-${Date.now()}-${idx}`,
        }))
      : [
          {
            id: `cm-init-1`,
            prefix: 'السيد الأستاذ /',
            name: 'أشرف كمال أبو زيد',
            committeeRole: 'رئيسا',
            jobTitle: 'مدير إدارة المخازن والعهد',
          },
          {
            id: `cm-init-2`,
            prefix: 'السيد المهندس /',
            name: 'طارق عبد العزيز الشهاوي',
            committeeRole: 'عضوا',
            jobTitle: 'مدير إدارة شبكات مياه دسوق',
          },
          {
            id: `cm-init-3`,
            prefix: 'السيد الأستاذ /',
            name: 'عادل عبد الحميد النحاس',
            committeeRole: 'عضوا',
            jobTitle: 'مراقب عهدة ومخازن رئيسي',
          },
        ];

  return {
    id: `rep-${Date.now()}`,
    reportNumber: nextNumber,
    reportTitle: reportType === 'transfer' ? 'إذن مناقلة عهدة' : defaultTitle,
    reportType,
    dayName: getArabicDayName(today) || 'الجمعة',
    meetingDate: today,
    issueDate: today,
    committeeMembers: defaultMembers,
    items: [
      {
        id: `item-${Date.now()}-1`,
        itemName: '',
        unit: 'عدد',
        quantity: 1,
        tafqeet: numberToArabicTafqeet(1),
        notes: 'جديد وصالح للعمل',
      },
    ],
    // الطرف المستلم
    recipientName: '',
    recipientJobTitle: '',
    recipientEmployeeCode: '',
    recipientNationalId: '',
    departmentName: '',
    // الطرف المسلّم (للمناقلة)
    delivererName: '',
    delivererJobTitle: '',
    delivererDepartmentName: '',
    delivererEmployeeCode: '',
    delivererNationalId: '',
    transferReason: reportType === 'transfer' ? 'إعادة توزيع عهدة ومهمات' : '',
    approverTitle: defaultApproverTitle,
    approverName: defaultApproverName,
    status: 'معتمد',
    custodyType: reportType === 'transfer' ? 'مهمات تشغيل وصيانة' : 'عهدة شخصية مستديمة',
    signatureTableRoleDisplay: 'jobTitle',
    generalNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function App() {
  const [db, setDb] = useState<DatabaseSchema>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as DatabaseSchema;
        if (parsed && Array.isArray(parsed.reports)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_DATABASE;
  });

  const [currentReport, setCurrentReport] = useState<CustodyReport>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as DatabaseSchema;
        if (parsed && Array.isArray(parsed.reports) && parsed.reports.length > 0) {
          return parsed.reports[0];
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_DATABASE.reports[0] || createEmptyReport('2026/101');
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [printFontSize, setPrintFontSize] = useState<'compact' | 'standard' | 'spacious'>('compact');
  const [activeTab, setActiveTab] = useState<
    'editor' | 'archive' | 'recipients' | 'committees' | 'settings'
  >('editor');
  const [autoSaveToDirectory, setAutoSaveToDirectory] = useState<boolean>(true);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [editorViewMode, setEditorViewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // Advanced Search & Filter states for Archive
  const [archiveSearch, setArchiveSearch] = useState('');
  const [filterRecipient, setFilterRecipient] = useState('all');
  const [filterCommitteeMember, setFilterCommitteeMember] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterReportType, setFilterReportType] = useState<'all' | 'receipt' | 'transfer'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Archive Ledger Printing & Preview states
  const [isArchivePrintModalOpen, setIsArchivePrintModalOpen] = useState(false);
  const [archivePrintOrientation, setArchivePrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [archivePrintShowKpis, setArchivePrintShowKpis] = useState(true);
  const [archivePrintShowItemDetails, setArchivePrintShowItemDetails] = useState(true);
  const [archivePrintShowSignatures, setArchivePrintShowSignatures] = useState(true);
  const [archivePrintFontSize, setArchivePrintFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [printTarget, setPrintTarget] = useState<'report' | 'archive'>('report');

  // Flexible Combobox dropdown visibility states
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [showDelivererDropdown, setShowDelivererDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showDelivererDeptDropdown, setShowDelivererDeptDropdown] = useState(false);
  const [activeCommitteeDropdownIndex, setActiveCommitteeDropdownIndex] = useState<number | null>(
    null
  );
  const [activeCatalogDropdownIndex, setActiveCatalogDropdownIndex] = useState<number | null>(null);

  // Preset save modal/inline input
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Directory management states (Recipients & Departments tab)
  const [newRecipient, setNewRecipient] = useState<Omit<RecipientRecord, 'id'>>({
    name: '',
    jobTitle: '',
    departmentName: '',
    employeeCode: '',
    nationalId: '',
    phone: '',
  });
  const [newDepartment, setNewDepartment] = useState<Omit<DepartmentRecord, 'id'>>({
    name: '',
    managerName: '',
    location: 'منطقة مياه دسوق',
    code: '',
  });

  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [recipientDeptFilter, setRecipientDeptFilter] = useState('all');
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState('');
  const [directorySubTab, setDirectorySubTab] = useState<'employees' | 'departments'>('employees');
  const [directoryViewMode, setDirectoryViewMode] = useState<'table' | 'cards'>('table');
  const [isAddRecipientModalOpen, setIsAddRecipientModalOpen] = useState(false);
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Committees & Catalog tab states
  const [newCommitteeMember, setNewCommitteeMember] = useState<Omit<CommitteeMemberRecord, 'id'>>({
    prefix: 'السيد الأستاذ /',
    name: '',
    jobTitle: '',
    defaultCommitteeRole: 'عضوا',
    departmentName: 'منطقة مياه دسوق',
  });
  const [newCatalogItem, setNewCatalogItem] = useState<Omit<CatalogItemRecord, 'id'>>({
    itemName: '',
    defaultUnit: 'عدد',
    category: 'مهمات تشغيل وصيانة',
    defaultNotes: 'جديد وصالح للعمل',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setSaveBanner(msg);
    setTimeout(() => {
      setSaveBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Load Database on Mount (try to sync with server if available, otherwise offline/Vercel ready)
  useEffect(() => {
    let isMounted = true;
    async function fetchDatabase() {
      try {
        const res = await fetch('/api/db');
        if (!res.ok) throw new Error('Failed to fetch from server');
        const data = (await res.json()) as DatabaseSchema;
        if (isMounted && data && Array.isArray(data.reports)) {
          const validRecipients =
            data.recipients && data.recipients.length > 0
              ? data.recipients
              : DEFAULT_DATABASE.recipients;
          const validDepartments =
            data.departments && data.departments.length > 0
              ? data.departments
              : DEFAULT_DATABASE.departments;
          const cleanData: DatabaseSchema = {
            ...data,
            recipients: validRecipients,
            departments: validDepartments,
          };
          setDb(cleanData);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanData));
          } catch {
            // ignore
          }
          if (cleanData.reports.length > 0) {
            setCurrentReport(cleanData.reports[0]);
          }
        }
      } catch {
        // Running on Vercel static hosting or offline: already initialized with DEFAULT_DATABASE or localStorage!
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  const syncDatabase = async (updatedDb: DatabaseSchema, toastMessage?: string) => {
    setDb(updatedDb);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDb));
    try {
      await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDb),
      });
    } catch {
      // Saved in localStorage as fallback
    }
    if (toastMessage) showToast(toastMessage);
  };

  const handleSaveReport = async () => {
    if (!currentReport || !db) return;
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: currentReport,
          autoSaveDirectory: autoSaveToDirectory,
        }),
      });
      if (res.ok) {
        const updatedDb = (await res.json()) as DatabaseSchema;
        setDb(updatedDb);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDb));
        showToast(`تم حفظ محضر الاستلام رقم (${currentReport.reportNumber}) في قاعدة البيانات`);
        return;
      }
    } catch {
      // Fallback local save
    }

    const exists = db.reports.some((r) => r.id === currentReport.id);
    const updatedReports = exists
      ? db.reports.map((r) =>
          r.id === currentReport.id ? { ...currentReport, updatedAt: new Date().toISOString() } : r
        )
      : [{ ...currentReport, updatedAt: new Date().toISOString() }, ...db.reports];

    await syncDatabase(
      { ...db, reports: updatedReports },
      `تم حفظ محضر الاستلام رقم (${currentReport.reportNumber}) بنجاح`
    );
  };

  // Export current report to PDF via jspdf & html2canvas
  const handleExportPdf = async (reportToExport = currentReport) => {
    if (!reportToExport) return;
    setIsExportingPdf(true);
    showToast('جاري إنشاء ملف PDF وتجهيز محضر الاستلام...');
    try {
      // Ensure the printable sheet is rendered
      const success = await exportReportToPdf({
        elementId: 'official-receipt-sheet',
        report: reportToExport,
      });
      if (success) {
        showToast(`تم تصدير محضر الاستلام رقم (${reportToExport.reportNumber}) إلى PDF بنجاح`);
      } else {
        showToast('حدث خطأ أثناء تصدير PDF، يرجى المحاولة مرة أخرى');
      }
    } catch {
      showToast('تعذر تصدير ملف PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export current report to DOCX
  const handleExportDocx = (reportToExport = currentReport) => {
    if (!reportToExport || !db) return;
    setIsExportingDocx(true);
    try {
      const success = exportReportToDocx(reportToExport, db.settings);
      if (success) {
        showToast(`تم تصدير محضر الاستلام بصيغة Word (DOCX) مع الحفاظ على التنسيق`);
      } else {
        showToast('تعذر تصدير مستند Word');
      }
    } catch {
      showToast('تعذر تصدير مستند Word');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleCreateNewReport = (
    reportType: 'receipt' | 'transfer' = 'receipt',
    prefill?: {
      recipient?: RecipientRecord;
      deliverer?: RecipientRecord;
    }
  ) => {
    if (!db) return;
    const nextSeq = 101 + db.reports.length;
    const nextNumber = `2026/${nextSeq}`;
    const fresh = createEmptyReport(
      nextNumber,
      db.committeePresets[0],
      reportType === 'transfer' ? 'إذن مناقلة عهدة' : db.settings.defaultReportTitle,
      db.settings.defaultApproverTitle,
      db.settings.defaultApproverName,
      reportType
    );
    if (prefill?.recipient) {
      fresh.recipientName = prefill.recipient.name;
      fresh.recipientJobTitle = prefill.recipient.jobTitle;
      fresh.departmentName = prefill.recipient.departmentName;
      fresh.recipientEmployeeCode = prefill.recipient.employeeCode;
      fresh.recipientNationalId = prefill.recipient.nationalId;
    }
    if (prefill?.deliverer) {
      fresh.delivererName = prefill.deliverer.name;
      fresh.delivererJobTitle = prefill.deliverer.jobTitle;
      fresh.delivererDepartmentName = prefill.deliverer.departmentName;
      fresh.delivererEmployeeCode = prefill.deliverer.employeeCode;
      fresh.delivererNationalId = prefill.deliverer.nationalId;
    }
    setCurrentReport(fresh);
    setActiveTab('editor');
    showToast(
      reportType === 'transfer'
        ? `تم إنشاء إذن مناقلة عهدة جديد رقم (${nextNumber})`
        : `تم إنشاء نموذج محضر استلام جديد رقم (${nextNumber})`
    );
  };

  const handleDuplicateReport = (rep: CustodyReport) => {
    if (!db) return;
    const nextSeq = 101 + db.reports.length;
    const copy: CustodyReport = {
      ...rep,
      id: `rep-${Date.now()}`,
      reportNumber: `2026/${nextSeq}`,
      status: 'مسودة',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentReport(copy);
    setActiveTab('editor');
    showToast(`تم نسخ بيانات المحضر إلى نموذج جديد رقم (${copy.reportNumber})`);
  };

  const handleSwapDelivererAndRecipient = () => {
    if (!currentReport) return;
    setCurrentReport({
      ...currentReport,
      delivererName: currentReport.recipientName,
      delivererJobTitle: currentReport.recipientJobTitle,
      delivererDepartmentName: currentReport.departmentName,
      delivererEmployeeCode: currentReport.recipientEmployeeCode,
      delivererNationalId: currentReport.recipientNationalId,
      recipientName: currentReport.delivererName || '',
      recipientJobTitle: currentReport.delivererJobTitle || '',
      departmentName: currentReport.delivererDepartmentName || '',
      recipientEmployeeCode: currentReport.delivererEmployeeCode || '',
      recipientNationalId: currentReport.delivererNationalId || '',
    });
    showToast('تم تبديل أطراف المناقلة (المسلّم والمستلم) بنجاح');
  };

  const handleDeleteReport = async (id: string) => {
    if (!db) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedDb = (await res.json()) as DatabaseSchema;
        setDb(updatedDb);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDb));
        showToast('تم حذف المحضر من قاعدة البيانات');
        return;
      }
    } catch {
      // fallback
    }
    const filtered = db.reports.filter((r) => r.id !== id);
    await syncDatabase({ ...db, reports: filtered }, 'تم حذف المحضر من قاعدة البيانات');
  };

  const updateCommitteeMember = (
    index: number,
    field: keyof CommitteeMemberEntry,
    value: string
  ) => {
    if (!currentReport) return;
    const updated = [...currentReport.committeeMembers];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentReport({ ...currentReport, committeeMembers: updated });
  };

  const selectSavedCommitteeMember = (index: number, memberRecord: CommitteeMemberRecord) => {
    if (!currentReport) return;
    const updated = [...currentReport.committeeMembers];
    updated[index] = {
      ...updated[index],
      prefix: memberRecord.prefix || 'السيد الأستاذ /',
      name: memberRecord.name,
      jobTitle: memberRecord.jobTitle,
      committeeRole: updated[index].committeeRole || memberRecord.defaultCommitteeRole || 'عضوا',
    };
    setCurrentReport({ ...currentReport, committeeMembers: updated });
    setActiveCommitteeDropdownIndex(null);
  };

  const addCommitteeMemberRow = () => {
    if (!currentReport) return;
    setCurrentReport({
      ...currentReport,
      committeeMembers: [
        ...currentReport.committeeMembers,
        {
          id: `cm-${Date.now()}`,
          prefix: 'السيد الأستاذ /',
          name: '',
          committeeRole: 'عضوا',
          jobTitle: '',
        },
      ],
    });
  };

  const removeCommitteeMemberRow = (index: number) => {
    if (!currentReport || currentReport.committeeMembers.length <= 1) return;
    const updated = currentReport.committeeMembers.filter((_, i) => i !== index);
    setCurrentReport({ ...currentReport, committeeMembers: updated });
  };

  const applyCommitteePreset = (preset: CommitteePreset) => {
    if (!currentReport) return;
    setCurrentReport({
      ...currentReport,
      committeeMembers: preset.members.map((m, idx) => ({
        ...m,
        id: `cm-preset-${Date.now()}-${idx}`,
      })),
    });
    showToast(`تم تطبيق تشكيل "${preset.presetName}"`);
  };

  const handleSaveCurrentCommitteeAsPreset = async () => {
    if (!db || !currentReport || !newPresetName.trim()) return;
    const newPreset: CommitteePreset = {
      id: `preset-${Date.now()}`,
      presetName: newPresetName.trim(),
      description: `لجنة مكونة من ${currentReport.committeeMembers.length} أعضاء`,
      members: currentReport.committeeMembers.map((m) => ({ ...m })),
    };
    await syncDatabase(
      { ...db, committeePresets: [newPreset, ...db.committeePresets] },
      `تم حفظ قالب اللجنة "${newPreset.presetName}" في قاعدة البيانات`
    );
    setNewPresetName('');
    setIsSavingPreset(false);
  };

  const updateItemRow = (index: number, field: keyof CustodyItem, value: string | number) => {
    if (!currentReport) return;
    const updated = [...currentReport.items];
    const currentItem = { ...updated[index] };

    if (field === 'quantity') {
      const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
      currentItem.quantity = numVal;
      currentItem.tafqeet = numberToArabicTafqeet(numVal);
    } else {
      (currentItem as Record<string, unknown>)[field] = value;
    }

    updated[index] = currentItem;
    setCurrentReport({ ...currentReport, items: updated });
  };

  const selectCatalogItemForRow = (index: number, catItem: CatalogItemRecord) => {
    if (!currentReport) return;
    const updated = [...currentReport.items];
    const qty = updated[index].quantity || 1;
    updated[index] = {
      ...updated[index],
      itemName: catItem.itemName,
      unit: catItem.defaultUnit || 'عدد',
      quantity: qty,
      tafqeet: numberToArabicTafqeet(qty),
      notes: catItem.defaultNotes || updated[index].notes,
    };
    setCurrentReport({ ...currentReport, items: updated });
    setActiveCatalogDropdownIndex(null);
  };

  const addItemRow = () => {
    if (!currentReport) return;
    setCurrentReport({
      ...currentReport,
      items: [
        ...currentReport.items,
        {
          id: `item-${Date.now()}-${currentReport.items.length + 1}`,
          itemName: '',
          unit: 'عدد',
          quantity: 1,
          tafqeet: numberToArabicTafqeet(1),
          notes: '',
        },
      ],
    });
  };

  const removeItemRow = (index: number) => {
    if (!currentReport || currentReport.items.length <= 1) return;
    setCurrentReport({
      ...currentReport,
      items: currentReport.items.filter((_, i) => i !== index),
    });
  };

  const filteredRecipients = useMemo(() => {
    if (!db || !currentReport) return [];
    const q = (currentReport.recipientName || '').trim().toLowerCase();
    if (!q) return db.recipients;
    return db.recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q) ||
        r.employeeCode.includes(q)
    );
  }, [db, currentReport?.recipientName]);

  const filteredDeliverers = useMemo(() => {
    if (!db || !currentReport) return [];
    const q = (currentReport.delivererName || '').trim().toLowerCase();
    if (!q) return db.recipients;
    return db.recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q) ||
        r.employeeCode.includes(q)
    );
  }, [db, currentReport?.delivererName]);

  const filteredDepartments = useMemo(() => {
    if (!db || !currentReport) return [];
    const q = (currentReport.departmentName || '').trim().toLowerCase();
    if (!q) return db.departments;
    return db.departments.filter(
      (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [db, currentReport?.departmentName]);

  const filteredDelivererDepartments = useMemo(() => {
    if (!db || !currentReport) return [];
    const q = (currentReport.delivererDepartmentName || '').trim().toLowerCase();
    if (!q) return db.departments;
    return db.departments.filter(
      (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [db, currentReport?.delivererDepartmentName]);

  const receiptReportsCount = useMemo(() => {
    if (!db) return 0;
    return db.reports.filter(
      (r) => r.reportType !== 'transfer' && (!r.delivererName || !r.delivererName.trim())
    ).length;
  }, [db]);

  const transferReportsCount = useMemo(() => {
    if (!db) return 0;
    return db.reports.filter(
      (r) => r.reportType === 'transfer' || Boolean(r.delivererName && r.delivererName.trim())
    ).length;
  }, [db]);

  // Advanced Filtering for Archive
  const filteredArchiveReports = useMemo(() => {
    if (!db) return [];
    return db.reports.filter((rep) => {
      // 0. Report Type filter
      if (filterReportType !== 'all') {
        const isTransfer =
          rep.reportType === 'transfer' || Boolean(rep.delivererName && rep.delivererName.trim());
        if (filterReportType === 'transfer' && !isTransfer) return false;
        if (filterReportType === 'receipt' && isTransfer) return false;
      }
      // 1. Recipient filter
      if (filterRecipient !== 'all' && rep.recipientName !== filterRecipient) {
        return false;
      }
      // 2. Committee member filter
      if (filterCommitteeMember !== 'all') {
        const hasMember = rep.committeeMembers.some((m) => m.name === filterCommitteeMember);
        if (!hasMember) return false;
      }
      // 3. Department filter
      if (filterDepartment !== 'all' && rep.departmentName !== filterDepartment) {
        return false;
      }
      // 4. Status filter
      if (filterStatus !== 'all' && rep.status !== filterStatus) {
        return false;
      }
      // 5. Date From
      if (filterDateFrom && rep.meetingDate < filterDateFrom) {
        return false;
      }
      // 6. Date To
      if (filterDateTo && rep.meetingDate > filterDateTo) {
        return false;
      }
      // 7. General search query
      const q = archiveSearch.trim().toLowerCase();
      if (!q) return true;

      const inRecipient = rep.recipientName.toLowerCase().includes(q);
      const inDeliverer = (rep.delivererName || '').toLowerCase().includes(q);
      const inNumber = rep.reportNumber.toLowerCase().includes(q);
      const inDept = rep.departmentName.toLowerCase().includes(q);
      const inItems = rep.items.some((i) => i.itemName.toLowerCase().includes(q));
      const inCommittee = rep.committeeMembers.some((c) => c.name.toLowerCase().includes(q));
      const inNotes = (rep.generalNotes || '').toLowerCase().includes(q);
      const inReason = (rep.transferReason || '').toLowerCase().includes(q);

      return inRecipient || inDeliverer || inNumber || inDept || inItems || inCommittee || inNotes || inReason;
    });
  }, [
    db,
    archiveSearch,
    filterRecipient,
    filterCommitteeMember,
    filterDepartment,
    filterStatus,
    filterReportType,
    filterDateFrom,
    filterDateTo,
  ]);

  const resetFilters = () => {
    setArchiveSearch('');
    setFilterRecipient('all');
    setFilterCommitteeMember('all');
    setFilterDepartment('all');
    setFilterStatus('all');
    setFilterReportType('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters =
    archiveSearch ||
    filterRecipient !== 'all' ||
    filterCommitteeMember !== 'all' ||
    filterDepartment !== 'all' ||
    filterStatus !== 'all' ||
    filterDateFrom ||
    filterDateTo;

  // Unique lists for filter dropdowns
  const uniqueRecipientsList = useMemo(() => {
    if (!db) return [];
    const set = new Set<string>();
    db.reports.forEach((r) => {
      if (r.recipientName.trim()) set.add(r.recipientName.trim());
    });
    db.recipients.forEach((r) => set.add(r.name.trim()));
    return Array.from(set).sort();
  }, [db]);

  const uniqueCommitteeMembersList = useMemo(() => {
    if (!db) return [];
    const set = new Set<string>();
    db.reports.forEach((r) => {
      r.committeeMembers.forEach((m) => {
        if (m.name.trim()) set.add(m.name.trim());
      });
    });
    db.committeeMembers.forEach((m) => set.add(m.name.trim()));
    return Array.from(set).sort();
  }, [db]);

  const filteredDirectoryRecipients = useMemo(() => {
    if (!db || !db.recipients) return [];
    let list = db.recipients;
    if (recipientDeptFilter !== 'all') {
      list = list.filter((r) => r.departmentName === recipientDeptFilter);
    }
    const q = recipientSearchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.nationalId.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    );
  }, [db, recipientSearchQuery, recipientDeptFilter]);

  const filteredDirectoryDepartments = useMemo(() => {
    if (!db || !db.departments) return [];
    const q = departmentSearchQuery.trim().toLowerCase();
    if (!q) return db.departments;
    return db.departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.managerName.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
    );
  }, [db, departmentSearchQuery]);

  const archiveFilterDescription = useMemo(() => {
    const parts: string[] = [];
    if (filterReportType === 'receipt') parts.push('محاضر استلام عهدة');
    else if (filterReportType === 'transfer') parts.push('أذون مناقيل عهدة');

    if (filterRecipient !== 'all') parts.push(`المستلم: ${filterRecipient}`);
    if (filterCommitteeMember !== 'all') parts.push(`اللجنة: ${filterCommitteeMember}`);
    if (filterDepartment !== 'all') parts.push(`الإدارة: ${filterDepartment}`);
    if (filterStatus !== 'all') parts.push(`الحالة: ${filterStatus}`);
    if (archiveSearch.trim()) parts.push(`بحث: "${archiveSearch.trim()}"`);

    return parts.length > 0 ? parts.join(' • ') : 'كافة المحاضر والأذون المقيدة بالسجل العام';
  }, [filterReportType, filterRecipient, filterCommitteeMember, filterDepartment, filterStatus, archiveSearch]);

  const archiveDateRangeDescription = useMemo(() => {
    if (filterDateFrom && filterDateTo) return `من ${filterDateFrom} إلى ${filterDateTo}`;
    if (filterDateFrom) return `من تاريخ ${filterDateFrom}`;
    if (filterDateTo) return `حتى تاريخ ${filterDateTo}`;
    return undefined;
  }, [filterDateFrom, filterDateTo]);

  const handlePrintArchiveLedger = () => {
    setPrintTarget('archive');
    if (archivePrintOrientation === 'landscape') {
      document.body.classList.add('print-ledger-landscape');
    } else {
      document.body.classList.remove('print-ledger-landscape');
    }
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-ledger-landscape');
      }, 800);
    }, 150);
  };

  const handleExportArchiveLedgerPdf = async () => {
    setIsExportingPdf(true);
    showToast('جاري تجهيز وتصدير سجل المحاضر والأرشيف إلى PDF...');
    try {
      const success = await exportReportToPdf({
        elementId: 'official-archive-ledger-sheet-modal',
        filename: `سجل_قيد_محاضر_العهد_${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: archivePrintOrientation,
      });
      if (success) {
        showToast('تم تصدير سجل المحاضر والأرشيف إلى ملف PDF بنجاح');
      } else {
        showToast('حدث خطأ أثناء تصدير ملف PDF للسجل');
      }
    } catch {
      showToast('تعذر تصدير سجل المحاضر إلى PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportArchiveLedgerCsv = () => {
    if (filteredArchiveReports.length === 0) {
      showToast('لا توجد بيانات لتصديرها');
      return;
    }
    const headers = [
      'مسلسل',
      'رقم المحضر',
      'تاريخ الانعقاد',
      'اليوم',
      'نوع المستند',
      'الطرف المستلم',
      'الصفة الوظيفية للمستلم',
      'كود الموظف',
      'الإدارة / المحطة',
      'الطرف المسلّم',
      'إدارة المسلّم',
      'بيان الأصناف والكميات',
      'عدد الأصناف',
      'أعضاء لجنة الفحص والاستلام',
      'حالة الاعتماد'
    ];
    const rows = filteredArchiveReports.map((rep, idx) => [
      idx + 1,
      `"${rep.reportNumber}"`,
      `"${rep.meetingDate}"`,
      `"${rep.dayName}"`,
      `"${rep.reportType === 'transfer' ? 'إذن مناقيل عهدة' : 'محضر استلام عهدة'}"`,
      `"${rep.recipientName || ''}"`,
      `"${rep.recipientJobTitle || ''}"`,
      `"${rep.recipientEmployeeCode || ''}"`,
      `"${rep.departmentName || ''}"`,
      `"${rep.delivererName || ''}"`,
      `"${rep.delivererDepartmentName || ''}"`,
      `"${rep.items.map((i) => `${i.itemName} (${i.quantity} ${i.unit})`).join(' | ')}"`,
      rep.items.length,
      `"${rep.committeeMembers.map((m) => `${m.name} (${m.committeeRole})`).join(' | ')}"`,
      `"${rep.status}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_قيد_محاضر_العهد_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير كشف سجل المحاضر والأرشيف (Excel/CSV) بنجاح');
  };

  const handleExportDatabase = () => {
    if (!db) return;
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `قاعدة_بيانات_عهدتي_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير نسخة احتياطية كاملة من قاعدة البيانات');
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result)) as DatabaseSchema;
        if (parsed && Array.isArray(parsed.reports)) {
          await syncDatabase(parsed, 'تم استيراد واستعادة قاعدة البيانات بنجاح');
          if (parsed.reports.length > 0) {
            setCurrentReport(parsed.reports[0]);
          }
        }
      } catch {
        showToast('تعذر قراءة ملف قاعدة البيانات، تأكد من صحة ملف JSON');
      }
    };
    reader.readAsText(file);
  };

  const activeDb = db || DEFAULT_DATABASE;
  const activeReport = currentReport || activeDb.reports[0] || createEmptyReport('2026/101');

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Executive Governmental & Corporate Header */}
      <header className="no-print sticky top-0 z-30 shadow-md">
        {/* Tier 1: Institutional Authority Bar & Quick Actions */}
        <div className="bg-gradient-to-r from-[#07192b] via-[#0b2742] to-[#0f3459] text-white px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 border-b border-sky-950">
          {/* Institutional Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 p-0.5 rounded-xl bg-white/10 border border-sky-400/30 flex items-center justify-center shadow-inner shrink-0 select-none">
              <OfficialLogo
                className="w-full h-full"
                customLogoUrl={db.settings.customLogoUrl}
                showText={false}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black tracking-wide text-white">
                  منظومة عهدتي الرقمية
                </span>
                <span className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-200 border border-sky-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {db.settings.areaName || 'منطقة مياه دسوق'}
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80 font-medium hidden sm:block">
                {db.settings.subsidiaryCompanyName || 'شركة مياه الشرب والصرف الصحي بكفر الشيخ'} — السجل المعتمد للعهد والمناقيل
              </p>
            </div>
          </div>

          {/* Executive Fast Actions Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Create: Receipt */}
            <button
              type="button"
              onClick={() => handleCreateNewReport('receipt')}
              className="px-3.5 py-1.5 text-xs font-black text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 border border-sky-400/40 whitespace-nowrap"
              title="إنشاء نموذج محضر استلام عهدة جديد"
            >
              <Plus className="w-4 h-4 text-sky-100" />
              <span className="hidden sm:inline">محضر استلام جديد</span>
              <span className="sm:hidden">استلام</span>
            </button>

            {/* Quick Create: Transfer */}
            <button
              type="button"
              onClick={() => handleCreateNewReport('transfer')}
              className="px-3.5 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 border border-emerald-400/40 whitespace-nowrap"
              title="إنشاء نموذج إذن مناقيل عهدة جديد (مُسلِّم ومُستلم)"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-100" />
              <span className="hidden sm:inline">إذن مناقيل جديد</span>
              <span className="sm:hidden">مناقيل</span>
            </button>

            <div className="h-6 w-px bg-white/20 mx-1 hidden md:block"></div>

            {/* Print A4 */}
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'archive') {
                  setIsArchivePrintModalOpen(true);
                } else {
                  setPrintTarget('report');
                  handleSaveReport();
                  setTimeout(() => window.print(), 150);
                }
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors flex items-center gap-1.5 border border-white/20 shadow-xs whitespace-nowrap"
              title={activeTab === 'archive' ? 'معاينة وطباعة سجل المحاضر والأرشيف A4' : 'طباعة الورقة الرسمية A4 مباشرة'}
            >
              <Printer className="w-3.5 h-3.5 text-sky-300" />
              <span className="hidden md:inline">
                {activeTab === 'archive' ? 'طباعة السجل A4' : 'طباعة A4'}
              </span>
              <span className="md:hidden">طباعة</span>
            </button>

            {/* Quick PDF Export */}
            <button
              type="button"
              onClick={() => handleExportPdf(currentReport)}
              disabled={isExportingPdf}
              className="px-2.5 py-1.5 text-xs font-bold text-rose-200 bg-rose-950/50 hover:bg-rose-900/60 rounded-xl transition-colors flex items-center gap-1 border border-rose-500/30 whitespace-nowrap disabled:opacity-50"
              title="تصدير المستند الحالي إلى PDF"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden xl:inline">PDF</span>
            </button>

            {/* Quick DOCX Export */}
            <button
              type="button"
              onClick={() => handleExportDocx(currentReport)}
              disabled={isExportingDocx}
              className="px-2.5 py-1.5 text-xs font-bold text-sky-200 bg-sky-950/50 hover:bg-sky-900/60 rounded-xl transition-colors flex items-center gap-1 border border-sky-500/30 whitespace-nowrap disabled:opacity-50"
              title="تصدير المستند الحالي إلى ملف Word (DOCX)"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Word</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Dedicated Unified Navigation Tab Bar */}
        <div className="bg-white border-b border-slate-200/90 px-3 lg:px-8 shadow-xs">
          <div className="overflow-x-auto no-scrollbar py-1">
            <nav className="flex items-center gap-1.5 sm:gap-2 min-w-max">
              {[
                {
                  id: 'editor',
                  label: 'محرر النماذج والمحاضر',
                  icon: FileText,
                  badge: currentReport?.reportType === 'transfer' ? 'مناقيل' : 'استلام',
                  badgeNumber: currentReport?.reportNumber,
                  badgeColor:
                    currentReport?.reportType === 'transfer'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-sky-100 text-sky-900 border-sky-300',
                },
                {
                  id: 'archive',
                  label: 'سجل وأرشيف المحاضر',
                  icon: Search,
                  badge: `${db.reports.length} محضر`,
                  badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
                },
                {
                  id: 'recipients',
                  label: 'دليل المستلمين والموظفين',
                  icon: Users,
                  badge: `${db.recipients.length} موظفاً`,
                  badgeColor: 'bg-sky-100 text-sky-900 border-sky-200 font-bold',
                },
                {
                  id: 'committees',
                  label: 'تشكيل اللجان وقائمة الأصناف',
                  icon: Package,
                  badge: `${db.catalogItems?.length || 0} صنف`,
                  badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
                },
                {
                  id: 'settings',
                  label: 'إعدادات المنظومة والترويسة',
                  icon: Settings,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`relative px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap select-none ${
                      isActive
                        ? 'bg-[#0b2742] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-sky-300' : 'text-slate-500'
                      }`}
                    />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`text-[11px] font-mono-num font-extrabold px-2 py-0.5 rounded-full border transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : tab.badgeColor
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute -bottom-1 left-4 right-4 h-0.5 bg-sky-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {saveBanner && (
        <div className="no-print fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2.5 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-5 no-print">
        {/* Editor Toolbar (Only in Editor Tab) */}
        {activeTab === 'editor' && (
          <div className="mb-4 bg-white border border-slate-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            {/* Active Document Status Indicator */}
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-md ${
                  activeReport.reportType === 'transfer'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-sky-100 text-sky-800 border border-sky-300'
                }`}
              >
                {activeReport.reportType === 'transfer' ? 'إذن مناقيل' : 'محضر استلام'}
              </span>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>رقم:</span>
                <span className="font-mono-num font-black text-[#081c30]">
                  {activeReport.reportNumber}
                </span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="text-xs text-slate-600 hidden sm:flex items-center gap-1">
                <span className="text-slate-500">الحالة:</span>
                <span className="font-bold text-slate-800">{activeReport.status}</span>
              </div>
            </div>

            {/* View Mode Switcher and Save */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditorViewMode('split')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                    editorViewMode === 'split'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  إدخال ومعاينة فورية
                </button>
                <button
                  type="button"
                  onClick={() => setEditorViewMode('form')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                    editorViewMode === 'form'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  نموذج الإدخال فقط
                </button>
                <button
                  type="button"
                  onClick={() => setEditorViewMode('preview')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                    editorViewMode === 'preview'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  معاينة الورقة الرسمية A4
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveReport}
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-2xs"
              >
                <Save className="w-3.5 h-3.5 text-emerald-700" />
                <span>حفظ بقاعدة البيانات</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 1: REPORT BUILDER & PREVIEW ==================== */}
        {activeTab === 'editor' && (
          <div
            className={`grid gap-6 items-start ${
              editorViewMode === 'split'
                ? 'grid-cols-1 xl:grid-cols-12'
                : 'grid-cols-1'
            }`}
          >
            {/* Editor Form Column */}
            {(editorViewMode === 'split' || editorViewMode === 'form') && (
              <div
                className={`${
                  editorViewMode === 'split' ? 'xl:col-span-6' : 'max-w-4xl mx-auto w-full'
                } bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6`}
              >
                {/* Section 1: Basic Report Info */}
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">
                      01. نوع النموذج وبيانات المحضر
                    </h2>
                    <span className="text-xs text-slate-500">
                      يرتبط اليوم تلقائياً بالتاريخ المختار
                    </span>
                  </div>

                  {/* Document Type Selector: محضر استلام أم إذن مناقلة */}
                  <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#0a2540]">اختر نوع النموذج المطلوب إعداده:</span>
                      <span className="text-[11px] text-slate-600">يتم تكييف الحقول والتقرير تلقائياً</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentReport({
                            ...currentReport,
                            reportType: 'receipt',
                            reportTitle: 'محضر استلام',
                          });
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          currentReport.reportType !== 'transfer'
                            ? 'bg-[#0a2540] text-white border-[#0a2540] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-sky-400" />
                        <span>محضر استلام عهدة (مستلم واحد)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentReport({
                            ...currentReport,
                            reportType: 'transfer',
                            reportTitle: 'إذن مناقلة عهدة',
                            transferReason: currentReport.transferReason || 'إعادة توزيع عهدة ومهمات تشغيلية',
                          });
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          currentReport.reportType === 'transfer'
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Share2 className="w-4 h-4 text-emerald-300" />
                        <span>إذن مناقلة عهدة (مُسلِّم ومُستلم)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {currentReport.reportType === 'transfer' ? 'رقم إذن المناقلة' : 'رقم المحضر'}
                      </label>
                      <input
                        type="text"
                        value={currentReport.reportNumber}
                        onChange={(e) =>
                          setCurrentReport({ ...currentReport, reportNumber: e.target.value })
                        }
                        placeholder="مثال: 2026/101"
                        className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        عنوان التقرير الرسمي
                      </label>
                      <input
                        type="text"
                        value={currentReport.reportTitle}
                        onChange={(e) =>
                          setCurrentReport({ ...currentReport, reportTitle: e.target.value })
                        }
                        placeholder="محضر استلام"
                        className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        حالة المحضر
                      </label>
                      <select
                        value={currentReport.status}
                        onChange={(e) =>
                          setCurrentReport({
                            ...currentReport,
                            status: e.target.value as CustodyReport['status'],
                          })
                        }
                        className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                      >
                        <option value="معتمد">معتمد</option>
                        <option value="مسلم">تم التسليم للمستلم</option>
                        <option value="مسودة">مسودة قيد المراجعة</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        تاريخ انعقاد اللجنة (الموافق)
                      </label>
                      <input
                        type="date"
                        value={currentReport.meetingDate}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          const autoDay = getArabicDayName(newDate);
                          setCurrentReport({
                            ...currentReport,
                            meetingDate: newDate,
                            issueDate: newDate,
                            dayName: autoDay || currentReport.dayName,
                          });
                        }}
                        className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        إنه في يوم (قابل للتعديل)
                      </label>
                      <input
                        type="text"
                        value={currentReport.dayName}
                        onChange={(e) =>
                          setCurrentReport({ ...currentReport, dayName: e.target.value })
                        }
                        placeholder="الجمعة"
                        className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        تحريراً في (تاريخ التحرير)
                      </label>
                      <input
                        type="date"
                        value={currentReport.issueDate}
                        onChange={(e) =>
                          setCurrentReport({ ...currentReport, issueDate: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                      />
                    </div>
                  </div>
                </section>

                {/* Section 2: Parties Input (Transfer or Single Recipient) */}
                <section className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">
                      {currentReport.reportType === 'transfer'
                        ? '02. أطراف محضر إذن المناقيل (الطرف المُسلِّم والطرف المُستلِم)'
                        : '02. بيانات المستلم والإدارة التابعة (إدخال مرن أو من الدليل)'}
                    </h2>
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSaveToDirectory}
                        onChange={(e) => setAutoSaveToDirectory(e.target.checked)}
                        className="rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                      />
                      <span>حفظ الأسماء والإدارات الجديدة تلقائياً بالدليل</span>
                    </label>
                  </div>

                  {currentReport.reportType === 'transfer' ? (
                    <div className="space-y-4">
                      {/* Reason for Transfer with Quick Suggestions */}
                      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 space-y-2">
                        <label className="block text-xs font-extrabold text-[#0a2540]">
                          سبب إجراء المناقلة الرسمية للعهدة والمهمات:
                        </label>
                        <input
                          type="text"
                          value={currentReport.transferReason || ''}
                          onChange={(e) =>
                            setCurrentReport({ ...currentReport, transferReason: e.target.value })
                          }
                          placeholder="مثال: إعادة توزيع عهدة ومهمات تشغيلية / نقل موظف / صيانة محطة..."
                          className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-600">اقتراحات سريعة:</span>
                          {[
                            'إعادة توزيع عهدة ومهمات تشغيلية',
                            'نقل موظف لقسم أو موقع آخر',
                            'صيانة وتشغيل محطة/شبكة',
                            'استبدال عهدة متهالكة بجديدة',
                            'إخلاء طرف وتسليم للبديل',
                          ].map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() =>
                                setCurrentReport({ ...currentReport, transferReason: reason })
                              }
                              className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors"
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Deliverer & Recipient Cards Container */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                        {/* 1. Deliverer Card (المُسلِّم) */}
                        <div className="lg:col-span-6 bg-rose-50/40 border-2 border-rose-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                            <span className="flex items-center gap-1.5 font-extrabold text-xs text-rose-900">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                              <span>الطرف الأول: المُسَلِّم (المتنازل عن العهدة)</span>
                            </span>
                            <span className="text-[10.5px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full">
                              مُسلِّم العهدة
                            </span>
                          </div>

                          {/* Deliverer Name with Autocomplete */}
                          <div className="relative">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700">
                                اسم المسلّم (من الدليل أو كتابة مباشرة)
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowDelivererDropdown((v) => !v)}
                                className="text-[11px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                              >
                                <span>دليل العاملين ({db.recipients.length})</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={currentReport.delivererName || ''}
                              onFocus={() => setShowDelivererDropdown(true)}
                              onBlur={() => setTimeout(() => setShowDelivererDropdown(false), 180)}
                              onChange={(e) =>
                                setCurrentReport({ ...currentReport, delivererName: e.target.value })
                              }
                              placeholder="اكتب اسم المسلّم أو اختر من الدليل..."
                              className="w-full px-3 py-2 text-sm font-bold bg-white border border-rose-200 rounded-lg focus:outline-none focus:border-rose-600"
                            />

                            {showDelivererDropdown && filteredDeliverers.length > 0 && (
                              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                                {filteredDeliverers.map((rec) => (
                                  <button
                                    key={`del-${rec.id}`}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setCurrentReport({
                                        ...currentReport,
                                        delivererName: rec.name,
                                        delivererJobTitle: rec.jobTitle || currentReport.delivererJobTitle,
                                        delivererDepartmentName:
                                          rec.departmentName || currentReport.delivererDepartmentName,
                                        delivererEmployeeCode: rec.employeeCode,
                                        delivererNationalId: rec.nationalId,
                                      });
                                      setShowDelivererDropdown(false);
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-rose-50 transition-colors flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="text-xs font-bold text-slate-900">{rec.name}</div>
                                      <div className="text-[11px] text-slate-500">
                                        {rec.jobTitle} · {rec.departmentName}
                                      </div>
                                    </div>
                                    {rec.employeeCode && (
                                      <span className="text-[11px] font-mono-num text-slate-400">
                                        #{rec.employeeCode}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Deliverer Job Title */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              وظيفة المسلّم / الصفة
                            </label>
                            <input
                              type="text"
                              value={currentReport.delivererJobTitle || ''}
                              onChange={(e) =>
                                setCurrentReport({ ...currentReport, delivererJobTitle: e.target.value })
                              }
                              placeholder="مثال: فني تشغيل / مهندس شبكات..."
                              className="w-full px-3 py-2 text-sm bg-white border border-rose-200 rounded-lg focus:outline-none focus:border-rose-600"
                            />
                          </div>

                          {/* Deliverer Department */}
                          <div className="relative">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700">
                                الإدارة التابعة للمسلّم (الموقع السابق)
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowDelivererDeptDropdown((v) => !v)}
                                className="text-[11px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                              >
                                <span>الإدارات ({db.departments.length})</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={currentReport.delivererDepartmentName || ''}
                              onFocus={() => setShowDelivererDeptDropdown(true)}
                              onBlur={() => setTimeout(() => setShowDelivererDeptDropdown(false), 180)}
                              onChange={(e) =>
                                setCurrentReport({
                                  ...currentReport,
                                  delivererDepartmentName: e.target.value,
                                })
                              }
                              placeholder="مثال: إدارة شبكات مياه دسوق..."
                              className="w-full px-3 py-2 text-sm font-bold bg-white border border-rose-200 rounded-lg focus:outline-none focus:border-rose-600"
                            />

                            {showDelivererDeptDropdown && filteredDelivererDepartments.length > 0 && (
                              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {filteredDelivererDepartments.map((dept) => (
                                  <button
                                    key={`del-dept-${dept.id}`}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setCurrentReport({
                                        ...currentReport,
                                        delivererDepartmentName: dept.name,
                                      });
                                      setShowDelivererDeptDropdown(false);
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-rose-50 transition-colors flex items-center justify-between"
                                  >
                                    <span className="text-xs font-bold text-slate-900">{dept.name}</span>
                                    <span className="text-[11px] font-mono-num text-slate-400">
                                      {dept.code}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              {db.departments.slice(0, 4).map((dept) => (
                                <button
                                  key={`quick-del-${dept.id}`}
                                  type="button"
                                  onClick={() =>
                                    setCurrentReport({
                                      ...currentReport,
                                      delivererDepartmentName: dept.name,
                                    })
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors whitespace-nowrap ${
                                    currentReport.delivererDepartmentName === dept.name
                                      ? 'bg-rose-700 text-white'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-100'
                                  }`}
                                >
                                  {dept.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Code and National ID for Deliverer */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                كود الموظف
                              </label>
                              <input
                                type="text"
                                value={currentReport.delivererEmployeeCode || ''}
                                onChange={(e) =>
                                  setCurrentReport({
                                    ...currentReport,
                                    delivererEmployeeCode: e.target.value,
                                  })
                                }
                                placeholder="مثال: 10482"
                                className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-white border border-rose-200 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                الرقم القومي
                              </label>
                              <input
                                type="text"
                                value={currentReport.delivererNationalId || ''}
                                onChange={(e) =>
                                  setCurrentReport({
                                    ...currentReport,
                                    delivererNationalId: e.target.value,
                                  })
                                }
                                placeholder="14 رقم"
                                className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-white border border-rose-200 rounded-md"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Recipient Card (المُستلِم) */}
                        <div className="lg:col-span-6 bg-emerald-50/40 border-2 border-emerald-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                            <span className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-900">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                              <span>الطرف الثاني: المُسْتَلِم (مستلم العهدة الجديد)</span>
                            </span>
                            <span className="text-[10.5px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                              مُستلِم العهدة
                            </span>
                          </div>

                          {/* Recipient Name with Autocomplete */}
                          <div className="relative">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700">
                                اسم المستلم (من الدليل أو كتابة مباشرة)
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowRecipientDropdown((v) => !v)}
                                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                              >
                                <span>دليل العاملين ({db.recipients.length})</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={currentReport.recipientName}
                              onFocus={() => setShowRecipientDropdown(true)}
                              onBlur={() => setTimeout(() => setShowRecipientDropdown(false), 180)}
                              onChange={(e) =>
                                setCurrentReport({ ...currentReport, recipientName: e.target.value })
                              }
                              placeholder="اكتب اسم المستلم أو اختر من الدليل..."
                              className="w-full px-3 py-2 text-sm font-bold bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600"
                            />

                            {showRecipientDropdown && filteredRecipients.length > 0 && (
                              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                                {filteredRecipients.map((rec) => (
                                  <button
                                    key={`rec-trans-${rec.id}`}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setCurrentReport({
                                        ...currentReport,
                                        recipientName: rec.name,
                                        recipientJobTitle: rec.jobTitle || currentReport.recipientJobTitle,
                                        departmentName:
                                          rec.departmentName || currentReport.departmentName,
                                        recipientEmployeeCode: rec.employeeCode,
                                        recipientNationalId: rec.nationalId,
                                      });
                                      setShowRecipientDropdown(false);
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="text-xs font-bold text-slate-900">{rec.name}</div>
                                      <div className="text-[11px] text-slate-500">
                                        {rec.jobTitle} · {rec.departmentName}
                                      </div>
                                    </div>
                                    {rec.employeeCode && (
                                      <span className="text-[11px] font-mono-num text-slate-400">
                                        #{rec.employeeCode}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Recipient Job Title */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              وظيفة المستلم / الصفة
                            </label>
                            <input
                              type="text"
                              value={currentReport.recipientJobTitle}
                              onChange={(e) =>
                                setCurrentReport({
                                  ...currentReport,
                                  recipientJobTitle: e.target.value,
                                })
                              }
                              placeholder="مثال: فني أول تشغيل محطات..."
                              className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          {/* Recipient Department */}
                          <div className="relative">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700">
                                الإدارة التابعة للمستلم (الموقع الجديد)
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowDeptDropdown((v) => !v)}
                                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                              >
                                <span>الإدارات ({db.departments.length})</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={currentReport.departmentName}
                              onFocus={() => setShowDeptDropdown(true)}
                              onBlur={() => setTimeout(() => setShowDeptDropdown(false), 180)}
                              onChange={(e) =>
                                setCurrentReport({ ...currentReport, departmentName: e.target.value })
                              }
                              placeholder="مثال: إدارة محطات المياه والروافع..."
                              className="w-full px-3 py-2 text-sm font-bold bg-white border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600"
                            />

                            {showDeptDropdown && filteredDepartments.length > 0 && (
                              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {filteredDepartments.map((dept) => (
                                  <button
                                    key={`rec-dept-${dept.id}`}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setCurrentReport({
                                        ...currentReport,
                                        departmentName: dept.name,
                                      });
                                      setShowDeptDropdown(false);
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-emerald-50 transition-colors flex items-center justify-between"
                                  >
                                    <span className="text-xs font-bold text-slate-900">{dept.name}</span>
                                    <span className="text-[11px] font-mono-num text-slate-400">
                                      {dept.code}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              {db.departments.slice(0, 4).map((dept) => (
                                <button
                                  key={`quick-rec-${dept.id}`}
                                  type="button"
                                  onClick={() =>
                                    setCurrentReport({ ...currentReport, departmentName: dept.name })
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors whitespace-nowrap ${
                                    currentReport.departmentName === dept.name
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {dept.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Code and National ID for Recipient */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                كود الموظف
                              </label>
                              <input
                                type="text"
                                value={currentReport.recipientEmployeeCode || ''}
                                onChange={(e) =>
                                  setCurrentReport({
                                    ...currentReport,
                                    recipientEmployeeCode: e.target.value,
                                  })
                                }
                                placeholder="مثال: 10819"
                                className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-white border border-emerald-200 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                الرقم القومي
                              </label>
                              <input
                                type="text"
                                value={currentReport.recipientNationalId || ''}
                                onChange={(e) =>
                                  setCurrentReport({
                                    ...currentReport,
                                    recipientNationalId: e.target.value,
                                  })
                                }
                                placeholder="14 رقم"
                                className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-white border border-emerald-200 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Swap Button */}
                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={handleSwapDelivererAndRecipient}
                          className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                          title="عكس بيانات المسلّم والمستلم بضغطة زر واحدة"
                        >
                          <ArrowLeftRight className="w-4 h-4 text-sky-700" />
                          <span>تبديل أطراف المناقلة (المسلّم ⇄ المستلم)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Single Recipient Form */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Flexible Recipient Name Input with Smart Search Dropdown */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            اسم المستلم (اكتب أي اسم أو اختر من القائمة)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowRecipientDropdown((v) => !v)}
                            className="text-[11px] font-bold text-sky-700 hover:underline flex items-center gap-0.5"
                          >
                            <span>دليل المستلمين ({db.recipients.length})</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={currentReport.recipientName}
                          onFocus={() => setShowRecipientDropdown(true)}
                          onBlur={() => setTimeout(() => setShowRecipientDropdown(false), 180)}
                          onChange={(e) =>
                            setCurrentReport({ ...currentReport, recipientName: e.target.value })
                          }
                          placeholder="اكتب اسم المستلم بحرية أو ابحث..."
                          className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                        />

                        {showRecipientDropdown && filteredRecipients.length > 0 && (
                          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                            {filteredRecipients.map((rec) => (
                              <button
                                key={rec.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setCurrentReport({
                                    ...currentReport,
                                    recipientName: rec.name,
                                    recipientJobTitle: rec.jobTitle || currentReport.recipientJobTitle,
                                    departmentName:
                                      rec.departmentName || currentReport.departmentName,
                                    recipientEmployeeCode: rec.employeeCode,
                                    recipientNationalId: rec.nationalId,
                                  });
                                  setShowRecipientDropdown(false);
                                }}
                                className="w-full text-right px-3 py-2 hover:bg-sky-50 transition-colors flex items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="text-xs font-bold text-slate-900">{rec.name}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {rec.jobTitle} · {rec.departmentName}
                                  </div>
                                </div>
                                {rec.employeeCode && (
                                  <span className="text-[11px] font-mono-num text-slate-400">
                                    #{rec.employeeCode}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recipient Job Title */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            الصفة الوظيفية للمستلم (اختياري)
                          </label>
                          <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={db.settings.showRecipientJobTitleInPrint}
                              onChange={(e) =>
                                syncDatabase({
                                  ...db,
                                  settings: {
                                    ...db.settings,
                                    showRecipientJobTitleInPrint: e.target.checked,
                                  },
                                })
                              }
                              className="rounded border-slate-300 text-sky-700"
                            />
                            <span>إظهار بالطباعة</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={currentReport.recipientJobTitle}
                          onChange={(e) =>
                            setCurrentReport({
                              ...currentReport,
                              recipientJobTitle: e.target.value,
                            })
                          }
                          placeholder="مثال: مهندس تشغيل / فني شبكات..."
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                        />
                      </div>

                      {/* Flexible Department Selector */}
                      <div className="relative sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            الإدارة التابعة (اختر من إدارات منطقة مياه دسوق أو اكتب مباشرة)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowDeptDropdown((v) => !v)}
                            className="text-[11px] font-bold text-sky-700 hover:underline flex items-center gap-0.5"
                          >
                            <span>قائمة الإدارات ({db.departments.length})</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={currentReport.departmentName}
                          onFocus={() => setShowDeptDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDeptDropdown(false), 180)}
                          onChange={(e) =>
                            setCurrentReport({ ...currentReport, departmentName: e.target.value })
                          }
                          placeholder="مثال: إدارة شبكات مياه دسوق / محطة مياه دسوق الرئيسية..."
                          className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-700 focus:bg-white"
                        />

                        {showDeptDropdown && filteredDepartments.length > 0 && (
                          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                            {filteredDepartments.map((dept) => (
                              <button
                                key={dept.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setCurrentReport({
                                    ...currentReport,
                                    departmentName: dept.name,
                                  });
                                  setShowDeptDropdown(false);
                                }}
                                className="w-full text-right px-3 py-2 hover:bg-sky-50 transition-colors flex items-center justify-between"
                              >
                                <span className="text-xs font-bold text-slate-900">{dept.name}</span>
                                <span className="text-[11px] font-mono-num text-slate-400">
                                  {dept.code}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {db.departments.slice(0, 5).map((dept) => (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() =>
                                setCurrentReport({ ...currentReport, departmentName: dept.name })
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
                                currentReport.departmentName === dept.name
                                  ? 'bg-sky-700 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {dept.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Section 3: Committee Members & Job Titles */}
                <section className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        03. أسماء اللجنة والصفة الوظيفية
                      </h2>
                      <p className="text-xs text-slate-500">
                        تظهر الأسماء والصفات الوظيفية تلقائياً في ديباجة المحضر وجدول التوقيعات بالأسفل
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSavingPreset((v) => !v)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>حفظ كقالب لجنة</span>
                      </button>
                      <button
                        type="button"
                        onClick={addCommitteeMemberRow}
                        className="px-2.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة عضو لجنة</span>
                      </button>
                    </div>
                  </div>

                  {/* Committee Presets */}
                  {db.committeePresets.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="text-xs font-bold text-slate-700">
                        قوالب اللجان الجاهزة (اضغط لاختيار تشكيل اللجنة):
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {db.committeePresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyCommitteePreset(preset)}
                            className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-sky-50 text-slate-800 border border-slate-300 rounded-md transition-colors whitespace-nowrap"
                          >
                            {preset.presetName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isSavingPreset && (
                    <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="اكتب اسم قالب اللجنة الجديد..."
                        className="flex-1 min-w-[220px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCurrentCommitteeAsPreset}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-md whitespace-nowrap"
                      >
                        تأكيد الحفظ
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSavingPreset(false)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">
                      عمود «الصفة» بجدول التوقيعات أسفل المحضر:
                    </span>
                    <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-md">
                      {[
                        { id: 'jobTitle', label: 'الصفة الوظيفية' },
                        { id: 'committeeRole', label: 'دور اللجنة (رئيسا/عضوا)' },
                        { id: 'both', label: 'الصفة الوظيفية + الدور' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setCurrentReport({
                              ...currentReport,
                              signatureTableRoleDisplay:
                                opt.id as CustodyReport['signatureTableRoleDisplay'],
                            })
                          }
                          className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                            currentReport.signatureTableRoleDisplay === opt.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Committee Rows */}
                  <div className="space-y-3">
                    {currentReport.committeeMembers.map((member, idx) => (
                      <div
                        key={member.id || idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 font-mono-num">
                            عضو اللجنة رقم ({idx + 1})
                          </span>
                          {currentReport.committeeMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCommitteeMemberRow(idx)}
                              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
                              title="حذف العضو"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              اللقب بالديباجة
                            </label>
                            <input
                              type="text"
                              list="prefixes-list"
                              value={member.prefix}
                              onChange={(e) =>
                                updateCommitteeMember(idx, 'prefix', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md"
                            />
                          </div>

                          <div className="sm:col-span-4 relative">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              اسم عضو اللجنة (حر أو من الدليل)
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onFocus={() => setActiveCommitteeDropdownIndex(idx)}
                              onBlur={() =>
                                setTimeout(() => setActiveCommitteeDropdownIndex(null), 180)
                              }
                              onChange={(e) => updateCommitteeMember(idx, 'name', e.target.value)}
                              placeholder="اسم العضو..."
                              className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-md focus:border-sky-700 focus:outline-none"
                            />

                            {activeCommitteeDropdownIndex === idx &&
                              db.committeeMembers.length > 0 && (
                                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-md shadow-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
                                  {db.committeeMembers.map((cmRec) => (
                                    <button
                                      key={cmRec.id}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        selectSavedCommitteeMember(idx, cmRec);
                                      }}
                                      className="w-full text-right px-2.5 py-1.5 hover:bg-sky-50 transition-colors"
                                    >
                                      <div className="text-xs font-bold text-slate-900">
                                        {cmRec.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        {cmRec.jobTitle} · ({cmRec.defaultCommitteeRole})
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              صفة اللجنة
                            </label>
                            <input
                              type="text"
                              list="committee-roles-list"
                              value={member.committeeRole}
                              onChange={(e) =>
                                updateCommitteeMember(idx, 'committeeRole', e.target.value)
                              }
                              placeholder="رئيسا / عضوا"
                              className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-md"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              الصفة الوظيفية
                            </label>
                            <input
                              type="text"
                              value={member.jobTitle}
                              onChange={(e) =>
                                updateCommitteeMember(idx, 'jobTitle', e.target.value)
                              }
                              placeholder="مثال: مدير المخازن / مراقب عهدة"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <datalist id="prefixes-list">
                    {DEFAULT_PREFIXES.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                  <datalist id="committee-roles-list">
                    {DEFAULT_COMMITTEE_ROLES.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </section>

                {/* Section 4: Custody Items Table with Auto Tafqeet */}
                <section className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        04. أصناف العهدة المسلمة (مع التفقيط التلقائي للكميات)
                      </h2>
                      <p className="text-xs text-slate-500">
                        اكتب اسم الصنف أو اختر من الكتالوج، ويتم تفقيط الأعداد تلقائياً بالحروف العربية
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة صنف بالجدول</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {currentReport.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 font-mono-num">
                            الصنف رقم ({idx + 1})
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCatalogDropdownIndex(
                                  activeCatalogDropdownIndex === idx ? null : idx
                                )
                              }
                              className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>كتالوج الأصناف المتكررة</span>
                            </button>
                            {currentReport.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف الصنف</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {activeCatalogDropdownIndex === idx && db.catalogItems.length > 0 && (
                          <div className="bg-white border border-sky-300 rounded-lg p-2 shadow-sm space-y-1 max-h-44 overflow-y-auto">
                            <div className="text-[11px] font-bold text-slate-500 px-2 pb-1">
                              اضغط على الصنف لإدراجه بالسطر الحالي:
                            </div>
                            {db.catalogItems.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => selectCatalogItemForRow(idx, cat)}
                                className="w-full text-right px-2.5 py-1.5 text-xs hover:bg-sky-50 rounded flex items-center justify-between gap-2"
                              >
                                <span className="font-semibold text-slate-900">{cat.itemName}</span>
                                <span className="text-[11px] text-slate-500 shrink-0">
                                  {cat.defaultUnit}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-12">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              اسم الصنف وبياناته بالتفصيل
                            </label>
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => updateItemRow(idx, 'itemName', e.target.value)}
                              placeholder="مثال: جهاز حاسب آلي محمول / طقم عدة ميكانيكية..."
                              className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-md focus:border-sky-700 focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              الوحدة
                            </label>
                            <input
                              type="text"
                              list="units-list"
                              value={item.unit}
                              onChange={(e) => updateItemRow(idx, 'unit', e.target.value)}
                              placeholder="عدد"
                              className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-md text-center"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              الكمية
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-bold font-mono-num bg-white border border-slate-300 rounded-md text-center"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              تفقيط الكمية (تلقائي وقابل للتعديل)
                            </label>
                            <input
                              type="text"
                              value={item.tafqeet}
                              onChange={(e) => updateItemRow(idx, 'tafqeet', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              ملاحظات
                            </label>
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) => updateItemRow(idx, 'notes', e.target.value)}
                              placeholder="جديد وصالح للعمل..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <datalist id="units-list">
                    {DEFAULT_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </section>

                {/* Section 5: Approver & Export Actions */}
                <section className="space-y-4 pt-2">
                  <div className="pb-2 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">
                      05. الاعتماد والخيارات الختامية
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        صفة المعتمد أسفل اليسار
                      </label>
                      <input
                        type="text"
                        value={currentReport.approverTitle}
                        onChange={(e) =>
                          setCurrentReport({ ...currentReport, approverTitle: e.target.value })
                        }
                        placeholder="مدير عام المنطقة"
                        className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        اسم مدير عام المنطقة (اختياري)
                      </label>
                      <input
                        type="text"
                        value={currentReport.approverName}
                        onChange={(e) =>
                          setCurrentReport({ ...currentReport, approverName: e.target.value })
                        }
                        placeholder="يترك فارغاً للتوقيع الحي أو يكتب الاسم..."
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ملاحظات إضافية بالمحضر (اختياري)
                      </label>
                      <input
                        type="text"
                        value={currentReport.generalNotes || ''}
                        onChange={(e) =>
                          setCurrentReport({ ...currentReport, generalNotes: e.target.value })
                        }
                        placeholder="أي بيان إضافي يظهر تحت جدول الأصناف..."
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleSaveReport}
                      className="px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ بقاعدة البيانات</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportDocx(currentReport)}
                      disabled={isExportingDocx}
                      className="px-4 py-2.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>تصدير Word (DOCX)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportPdf(currentReport)}
                      disabled={isExportingPdf}
                      className="px-4 py-2.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isExportingPdf ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileDown className="w-4 h-4 text-rose-600" />
                      )}
                      <span>تصدير PDF (jspdf)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSaveReport();
                        setTimeout(() => window.print(), 150);
                      }}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة A4</span>
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* Live Paper Preview Column */}
            {(editorViewMode === 'split' || editorViewMode === 'preview') && (
              <div
                className={`${
                  editorViewMode === 'split' ? 'xl:col-span-6 sticky top-20' : 'w-full'
                } space-y-3`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      معاينة حية للنموذج الرسمي المعتمد (منطقة مياه دسوق - A4)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportPdf(currentReport)}
                      disabled={isExportingPdf}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded flex items-center gap-1 transition-colors"
                      title="تصدير إلى ملف PDF (jspdf + html2canvas)"
                    >
                      {isExportingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5" />
                      )}
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportDocx(currentReport)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-1 transition-colors"
                      title="تصدير إلى مستند Word (DOCX)"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>DOCX</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded flex items-center gap-1 transition-colors"
                      title="طباعة ورقية مباشرة A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة</span>
                    </button>
                  </div>
                </div>

                {/* Executive Report Customization Controls Bar */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  {/* Font Scale Selector for Corporate standards */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-300">
                    <span className="text-[11px] font-bold text-slate-800 px-1">حجم الخط:</span>
                    <button
                      type="button"
                      onClick={() => setPrintFontSize('compact')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        printFontSize === 'compact'
                          ? 'bg-sky-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                      }`}
                    >
                      مصغر للشركات (12px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintFontSize('standard')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        printFontSize === 'standard'
                          ? 'bg-sky-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                      }`}
                    >
                      متوسط (13px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintFontSize('spacious')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        printFontSize === 'spacious'
                          ? 'bg-sky-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                      }`}
                    >
                      كبير (15px)
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeDb.settings.showOfficialStamp}
                        onChange={(e) =>
                          syncDatabase({
                            ...activeDb,
                            settings: { ...activeDb.settings, showOfficialStamp: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300 text-sky-700"
                      />
                      <span>الختم الرسمي للمنطقة</span>
                    </label>

                    <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeDb.settings.showQrCode}
                        onChange={(e) =>
                          syncDatabase({
                            ...activeDb,
                            settings: { ...activeDb.settings, showQrCode: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300 text-sky-700"
                      />
                      <span>رمز التحقق الرقمي QR</span>
                    </label>

                    <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeDb.settings.showWatermark}
                        onChange={(e) =>
                          syncDatabase({
                            ...activeDb,
                            settings: { ...activeDb.settings, showWatermark: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300 text-sky-700"
                      />
                      <span>العلامة المائية الأمنية</span>
                    </label>

                    <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeDb.settings.frameStyle !== 'executive_single'}
                        onChange={(e) =>
                          syncDatabase({
                            ...activeDb,
                            settings: {
                              ...activeDb.settings,
                              frameStyle: e.target.checked ? 'classic_double' : 'executive_single',
                            },
                          })
                        }
                        className="rounded border-slate-300 text-sky-700"
                      />
                      <span>الإطار الحكومي المزدوج</span>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto pb-6">
                  <PrintableReceiptSheet
                    sheetId="official-receipt-sheet"
                    report={activeReport}
                    settings={activeDb.settings}
                    showReportNumberBadge={true}
                    fontSizeScale={printFontSize}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: ADVANCED SEARCH & ARCHIVE ==================== */}
        {activeTab === 'archive' && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    البحث والتصفية المتقدمة لسجل العهد ومحاضر الاستلام
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تصفية فورية بناءً على: اسم المستلم، أسماء أعضاء اللجنة، الإدارات التابعة، وتاريخ التقرير
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsArchivePrintModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-black text-white bg-[#16324f] hover:bg-[#0f243a] border border-[#0d1e30] rounded-lg flex items-center gap-2 shadow-xs transition-all"
                    title="معاينة وطباعة سجل المحاضر والأرشيف A4"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>طباعة السجل الرسمي (A4)</span>
                    <span className="bg-white/20 text-white text-[10px] font-mono-num px-1.5 py-0.2 rounded-full font-bold">
                      {filteredArchiveReports.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters((v) => !v)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
                      showAdvancedFilters
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>تصفية مخصصة</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateNewReport('receipt')}
                    className="px-3.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-700" />
                    <span>محضر استلام جديد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateNewReport('transfer')}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-200" />
                    <span>إذن مناقيل جديد (مسلّم ومستلم)</span>
                  </button>
                </div>
              </div>

              {/* Report Type Filter Quick Tabs */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                <span className="text-xs font-bold text-slate-700">تصفية نوع المستند:</span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFilterReportType('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      filterReportType === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    جميع النماذج ({db.reports.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterReportType('receipt')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                      filterReportType === 'receipt'
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>محاضر الاستلام ({receiptReportsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterReportType('transfer')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                      filterReportType === 'transfer'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>أذون المناقيل ({transferReportsCount})</span>
                  </button>
                </div>
              </div>

              {/* Main Quick Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو رقم المحضر أو اسم الصنف أو عضو اللجنة أو الإدارة..."
                    className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-sky-700 focus:outline-none font-semibold"
                  />
                </div>

                <div className="sm:col-span-4 flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="معتمد">معتمد</option>
                    <option value="مسلم">تم التسليم</option>
                    <option value="مسودة">مسودة</option>
                  </select>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                      title="إعادة ضبط الفلاتر"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إلغاء التصفية</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Filter Box (Recipients, Committee Members, Departments, Dates) */}
              {showAdvancedFilters && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>خيارات التصفية المتعددة:</span>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      تفريغ جميع الحقول
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Recipient Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        اسم المستلم:
                      </label>
                      <select
                        value={filterRecipient}
                        onChange={(e) => setFilterRecipient(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold"
                      >
                        <option value="all">جميع المستلمين</option>
                        {uniqueRecipientsList.map((recName) => (
                          <option key={recName} value={recName}>
                            {recName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Committee Member Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        عضو اللجنة:
                      </label>
                      <select
                        value={filterCommitteeMember}
                        onChange={(e) => setFilterCommitteeMember(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold"
                      >
                        <option value="all">جميع أعضاء اللجان</option>
                        {uniqueCommitteeMembersList.map((cmName) => (
                          <option key={cmName} value={cmName}>
                            {cmName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Department Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        الإدارة التابعة:
                      </label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold"
                      >
                        <option value="all">جميع الإدارات والمحطات</option>
                        {db.departments.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Date Range Filters */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        الفترة الزمنية (تاريخ المحضر):
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                          className="px-2 py-1 text-[11px] font-mono-num bg-white border border-slate-300 rounded-md"
                          placeholder="من تاريخ"
                          title="من تاريخ انعقاد"
                        />
                        <input
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                          className="px-2 py-1 text-[11px] font-mono-num bg-white border border-slate-300 rounded-md"
                          placeholder="إلى تاريخ"
                          title="إلى تاريخ انعقاد"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Results Counter & Ledger Print Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>
                    عرض <strong className="text-slate-900 font-mono-num">{filteredArchiveReports.length}</strong> محضر من إجمالي{' '}
                    <strong className="text-slate-900 font-mono-num">{db.reports.length}</strong> محضر مسجل
                  </span>
                  {hasActiveFilters && (
                    <span className="text-sky-800 font-bold bg-sky-100 px-2 py-0.5 rounded text-[11px] border border-sky-200">
                      تصفية نشطة ({archiveFilterDescription})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsArchivePrintModalOpen(true)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#16324f] font-bold text-xs border border-slate-300 rounded-md shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-700" />
                    <span>معاينة وطباعة السجل المصفى (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportArchiveLedgerCsv}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-800 font-bold text-xs border border-slate-300 rounded-md shadow-2xs flex items-center gap-1.5 transition-colors"
                    title="تصدير كشف جدول إكسل (CSV)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تصدير Excel/CSV</span>
                  </button>
                </div>
              </div>

              {/* Reports Table with Multi-Format Export Buttons */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="py-3 px-3">رقم المحضر</th>
                      <th className="py-3 px-3">تاريخ الانعقاد</th>
                      <th className="py-3 px-3">المستلم والصفة</th>
                      <th className="py-3 px-3">الإدارة التابعة</th>
                      <th className="py-3 px-3">الأصناف المسلمة</th>
                      <th className="py-3 px-3">أعضاء اللجنة</th>
                      <th className="py-3 px-3">الحالة</th>
                      <th className="py-3 px-3 text-center">تصدير وإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredArchiveReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          لا توجد نتائج تطابق معايير البحث والتصفية المحددة.
                        </td>
                      </tr>
                    ) : (
                      filteredArchiveReports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            {rep.reportType === 'transfer' ||
                            Boolean(rep.delivererName && rep.delivererName.trim()) ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-extrabold mb-1">
                                <Share2 className="w-3 h-3 text-emerald-600" />
                                <span>إذن مناقيل</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.5 rounded text-[10px] font-extrabold mb-1">
                                <FileText className="w-3 h-3 text-sky-600" />
                                <span>محضر استلام</span>
                              </span>
                            )}
                            <div className="font-mono-num font-black text-slate-900 text-xs">
                              {rep.reportNumber}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono-num text-slate-700">
                            <div className="font-bold">{rep.meetingDate}</div>
                            <div className="text-[11px] text-slate-500">يوم {rep.dayName}</div>
                          </td>
                          <td className="py-3 px-3">
                            {rep.reportType === 'transfer' ||
                            Boolean(rep.delivererName && rep.delivererName.trim()) ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                                  <span className="text-slate-500">المُسلِّم:</span>
                                  <span className="font-bold text-slate-900">
                                    {rep.delivererName || '—'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                  <span className="text-slate-500">المُستلِم:</span>
                                  <span className="font-bold text-slate-900">
                                    {rep.recipientName || '—'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-slate-900">
                                  {rep.recipientName || 'غير محدد'}
                                </div>
                                {rep.recipientJobTitle && (
                                  <div className="text-[11px] text-slate-500">
                                    {rep.recipientJobTitle}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {rep.reportType === 'transfer' && rep.delivererDepartmentName ? (
                              <div className="space-y-0.5 text-[11px]">
                                <div className="text-slate-500 truncate max-w-[150px]">
                                  من: {rep.delivererDepartmentName}
                                </div>
                                <div className="text-slate-900 font-bold truncate max-w-[150px]">
                                  إلى: {rep.departmentName || '—'}
                                </div>
                              </div>
                            ) : (
                              rep.departmentName || '—'
                            )}
                          </td>
                          <td className="py-3 px-3 max-w-[240px]">
                            <div className="font-semibold text-slate-900 truncate">
                              {rep.items[0]?.itemName || 'بدون أصناف'}
                            </div>
                            <div className="text-[11px] text-slate-500 tabular-nums">
                              {rep.items.length} صنف مسجل
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-600">
                            {rep.committeeMembers.map((m, i) => (
                              <div key={i} className="truncate max-w-[170px]">
                                {i + 1}- {m.name} ({m.committeeRole})
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-3 font-bold">
                            <span
                              className={
                                rep.status === 'معتمد'
                                  ? 'text-emerald-700'
                                  : rep.status === 'مسلم'
                                  ? 'text-sky-700'
                                  : 'text-amber-700'
                              }
                            >
                              {rep.status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1">
                              {/* Open in Editor */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentReport(rep);
                                  setActiveTab('editor');
                                }}
                                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded border border-sky-200 transition-colors"
                              >
                                فتح
                              </button>

                              {/* Direct PDF Export */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentReport(rep);
                                  setTimeout(() => handleExportPdf(rep), 80);
                                }}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200"
                                title="تصدير إلى ملف PDF (jspdf)"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Direct DOCX Export */}
                              <button
                                type="button"
                                onClick={() => handleExportDocx(rep)}
                                className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200"
                                title="تصدير إلى ملف Word (DOCX)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {/* Direct Print */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentReport(rep);
                                  setTimeout(() => window.print(), 100);
                                }}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300"
                                title="طباعة فورية"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Duplicate */}
                              <button
                                type="button"
                                onClick={() => handleDuplicateReport(rep)}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                title="تكرار المحضر"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(rep.id)}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: RECIPIENTS & DEPARTMENTS ==================== */}
        {activeTab === 'recipients' && (
          <div className="space-y-6">
            {/* Top Directory Executive Banner & KPI Summary Cards */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-600 to-[#0b2742] text-white flex items-center justify-center font-black shadow-md shadow-sky-900/10">
                    <Users className="w-6 h-6 text-sky-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">
                        دليل المستلمين والموظفين والهيكل الإداري
                      </h2>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        سجل رسمي معتمد
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {db.settings.subsidiaryCompanyName || 'شركة مياه الشرب والصرف الصحي بكفر الشيخ'} — منطقة مياه دسوق
                    </p>
                  </div>
                </div>

                {/* Top Action Buttons: Add Employee & Restore Official Directory */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsAddRecipientModalOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 active:bg-sky-900 rounded-xl transition-all shadow-xs flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-sky-200" />
                    <span>إضافة موظف جديد</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('هل تريد استعادة وتحديث السجل الشامل لكافة العاملين (20 موظفاً و10 إدارات) من قاعدة البيانات الرسمية؟')) {
                        await syncDatabase(
                          {
                            ...db,
                            recipients: DEFAULT_DATABASE.recipients,
                            departments: DEFAULT_DATABASE.departments,
                          },
                          'تم بنجاح تحديث وتعبئة السجل الشامل (20 موظفاً و10 إدارات معتمدة)'
                        );
                      }
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="تعبئة واسترجاع الدليل الشامل لكافة موظفي منطقة دسوق (20 موظفاً)"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                    <span>استعادة الدليل الشامل (20 موظفاً)</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-sky-50/70 to-white border border-sky-200/80 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">إجمالي الموظفين والمستلمين</div>
                    <div className="text-xl font-black font-mono-num text-sky-950">
                      {db.recipients.length} <span className="text-xs font-normal text-slate-500">موظفاً</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-200/80 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">الإدارات والمحطات التابعة</div>
                    <div className="text-xl font-black font-mono-num text-indigo-950">
                      {db.departments.length} <span className="text-xs font-normal text-slate-500">إدارات</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">المحاضر والأذون المسجلة</div>
                    <div className="text-xl font-black font-mono-num text-emerald-950">
                      {db.reports.length} <span className="text-xs font-normal text-slate-500">مستند</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/70 to-white border border-amber-200/80 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">حالة قاعدة البيانات</div>
                    <div className="text-sm font-extrabold text-amber-950 flex items-center gap-1">
                      <span>منطقة مياه دسوق</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Navigation: Employees vs Departments */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDirectorySubTab('employees')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                    directorySubTab === 'employees'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-sky-700" />
                  <span>دليل العاملين والمستلمين ({filteredDirectoryRecipients.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDirectorySubTab('departments')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                    directorySubTab === 'departments'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-700" />
                  <span>الهيكل التنظيمي والإدارات والمحطات ({db.departments.length})</span>
                </button>
              </div>

              {/* View Mode Toggle (only for employees sub-tab) */}
              {directorySubTab === 'employees' && (
                <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDirectoryViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      directoryViewMode === 'table'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="عرض الجدول التنفيذي"
                  >
                    <List className="w-4 h-4" />
                    <span className="text-[11px]">جدول</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectoryViewMode('cards')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      directoryViewMode === 'cards'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="عرض البطاقات التعريفية"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-[11px]">بطاقات</span>
                  </button>
                </div>
              )}
            </div>

            {/* ================= SUB-TAB 1: EMPLOYEES DIRECTORY ================= */}
            {directorySubTab === 'employees' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                {/* Advanced Search & Department Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute right-3.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={recipientSearchQuery}
                        onChange={(e) => setRecipientSearchQuery(e.target.value)}
                        placeholder="بحث بالاسم، الصفة الوظيفية، الكود، الرقم القومي، الهاتف..."
                        className="w-full pr-10 pl-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium transition-all"
                      />
                      {recipientSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRecipientSearchQuery('')}
                          className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="shrink-0">
                      <select
                        value={recipientDeptFilter}
                        onChange={(e) => setRecipientDeptFilter(e.target.value)}
                        className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden font-bold text-slate-800"
                      >
                        <option value="all">كافة الإدارات والمحطات (10)</option>
                        {db.departments.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      عرض <span className="font-mono-num text-slate-900 font-black">{filteredDirectoryRecipients.length}</span> من أصل <span className="font-mono-num text-slate-900 font-black">{db.recipients.length}</span> موظفاً
                    </span>
                    {recipientDeptFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setRecipientDeptFilter('all')}
                        className="text-xs text-sky-700 hover:underline font-bold"
                      >
                        إلغاء الفلتر
                      </button>
                    )}
                  </div>
                </div>

                {/* View 1: Full-Width Executive Table */}
                {directoryViewMode === 'table' ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-200 font-black text-[12px]">
                          <th className="py-3 px-3.5 text-center w-16">الكود</th>
                          <th className="py-3 px-4">اسم الموظف والصفة الوظيفية</th>
                          <th className="py-3 px-4">الإدارة التابعة ومقر العمل</th>
                          <th className="py-3 px-4">الرقم القومي (14 رقم)</th>
                          <th className="py-3 px-4">رقم الهاتف المحمول</th>
                          <th className="py-3 px-3 text-center">العهد</th>
                          <th className="py-3 px-4 text-center min-w-[260px]">إجراءات إصدار المحاضر السريعة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredDirectoryRecipients.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500">
                              <p className="text-sm font-bold">لا توجد بيانات موظفين تطابق البحث الحالي.</p>
                              <p className="text-xs mt-1">تأكد من شروط البحث أو اضغط على «استعادة الدليل الشامل (20 موظفاً)».</p>
                            </td>
                          </tr>
                        ) : (
                          filteredDirectoryRecipients.map((rec) => {
                            const count = db.reports.filter(
                              (r) =>
                                r.recipientName?.trim() === rec.name.trim() ||
                                (r.delivererName && r.delivererName.trim() === rec.name.trim())
                            ).length;
                            return (
                              <tr key={rec.id} className="hover:bg-sky-50/40 transition-colors group">
                                {/* Employee Code */}
                                <td className="py-3 px-3 text-center">
                                  <span className="inline-block px-2 py-1 rounded-md text-[11px] font-mono-num font-black bg-slate-100 text-slate-800 border border-slate-300">
                                    {rec.employeeCode || '—'}
                                  </span>
                                </td>

                                {/* Name & Job Title */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-sky-800 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                      {rec.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-black text-slate-900 text-xs sm:text-sm">
                                        {rec.name}
                                      </div>
                                      <div className="text-[11.5px] text-slate-600 font-semibold mt-0.5">
                                        {rec.jobTitle || 'موظف'}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Department & Location */}
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-900 px-2.5 py-1 rounded-lg text-xs font-bold border border-sky-200">
                                    <Building2 className="w-3 h-3 text-sky-700" />
                                    <span>{rec.departmentName || 'منطقة مياه دسوق'}</span>
                                  </span>
                                </td>

                                {/* National ID with Copy */}
                                <td className="py-3 px-4 font-mono-num text-xs">
                                  {rec.nationalId ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText(rec.nationalId);
                                        setCopiedText(rec.nationalId);
                                        setTimeout(() => setCopiedText(null), 1500);
                                      }}
                                      className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-sky-700 bg-slate-50 hover:bg-white px-2 py-1 rounded border border-slate-200 transition-colors"
                                      title="اضغط لنسخ الرقم القومي"
                                    >
                                      <span>{rec.nationalId}</span>
                                      {copiedText === rec.nationalId ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>

                                {/* Phone */}
                                <td className="py-3 px-4 font-mono-num text-xs">
                                  {rec.phone ? (
                                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{rec.phone}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>

                                {/* Custody Reports Count */}
                                <td className="py-3 px-3 text-center font-mono-num">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                                      count > 0
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {count}
                                  </span>
                                </td>

                                {/* Actions: Create Receipt, Create Transfer, Insert */}
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {/* Action 1: Create Receipt for this Employee */}
                                    <button
                                      type="button"
                                      onClick={() => handleCreateNewReport('receipt', { recipient: rec })}
                                      className="px-2.5 py-1 text-[11px] font-black bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                      title="إنشاء نموذج محضر استلام جديد لهذا الموظف فوراً"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>+ استلام</span>
                                    </button>

                                    {/* Action 2: Create Transfer starting with this Employee as Deliverer */}
                                    <button
                                      type="button"
                                      onClick={() => handleCreateNewReport('transfer', { deliverer: rec })}
                                      className="px-2.5 py-1 text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                      title="إنشاء نموذج إذن مناقيل جديد يبدأ من هذا الموظف كمُسلِّم"
                                    >
                                      <ArrowLeftRight className="w-3 h-3" />
                                      <span>⇄ مناقيل</span>
                                    </button>

                                    {/* Action 3: Set as recipient in currently opened report */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCurrentReport({
                                          ...currentReport,
                                          recipientName: rec.name,
                                          recipientJobTitle: rec.jobTitle,
                                          departmentName: rec.departmentName,
                                          recipientEmployeeCode: rec.employeeCode,
                                          recipientNationalId: rec.nationalId,
                                        });
                                        setActiveTab('editor');
                                        showToast(`تم تعيين "${rec.name}" كمستلم في المحضر الحالي`);
                                      }}
                                      className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition-colors"
                                      title="تعبئة بياناته كمستلم في المستند المفتوح حالياً بمحرر المحاضر"
                                    >
                                      <span>تحديد كمستلم</span>
                                    </button>

                                    {/* Delete Employee */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`هل أنت متأكد من حذف الموظف "${rec.name}" من الدليل؟`)) {
                                          syncDatabase(
                                            {
                                              ...db,
                                              recipients: db.recipients.filter((r) => r.id !== rec.id),
                                            },
                                            'تم حذف الموظف من الدليل'
                                          );
                                        }
                                      }}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="حذف من السجل"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* View 2: Corporate Employee ID Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDirectoryRecipients.map((rec) => {
                      const count = db.reports.filter(
                        (r) =>
                          r.recipientName?.trim() === rec.name.trim() ||
                          (r.delivererName && r.delivererName.trim() === rec.name.trim())
                      ).length;
                      return (
                        <div
                          key={rec.id}
                          className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 space-y-3.5 shadow-2xs hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0b2742] to-sky-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                                {rec.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 text-sm">{rec.name}</h4>
                                <p className="text-xs text-slate-600 font-medium">{rec.jobTitle || 'موظف'}</p>
                              </div>
                            </div>
                            {rec.employeeCode && (
                              <span className="text-[11px] font-mono-num font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                #{rec.employeeCode}
                              </span>
                            )}
                          </div>

                          <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500 font-medium">الإدارة:</span>
                              <span className="font-bold text-sky-950">{rec.departmentName || 'منطقة دسوق'}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700 font-mono-num">
                              <span className="text-slate-500 font-medium font-sans">الرقم القومي:</span>
                              <span className="font-bold">{rec.nationalId || '—'}</span>
                            </div>
                            {rec.phone && (
                              <div className="flex items-center justify-between text-slate-700 font-mono-num">
                                <span className="text-slate-500 font-medium font-sans">الهاتف:</span>
                                <span className="font-bold">{rec.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500 font-medium">العهد والوثائق:</span>
                              <span className="font-black text-emerald-800">{count} مستند</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleCreateNewReport('receipt', { recipient: rec })}
                              className="flex-1 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>استلام عهدة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateNewReport('transfer', { deliverer: rec })}
                              className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>إذن مناقيل</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= SUB-TAB 2: DEPARTMENTS & STATIONS DIRECTORY ================= */}
            {directorySubTab === 'departments' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      الهيكل التنظيمي والمحطات التابعة ({db.departments.length} إدارات ومحطات)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      المحطات والشبكات والإدارات الفنية والمالية بمنطقة مياه دسوق
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="relative w-64">
                      <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={departmentSearchQuery}
                        onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                        placeholder="بحث في الإدارات والمحطات..."
                        className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddDepartmentModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة إدارة جديدة</span>
                    </button>
                  </div>
                </div>

                {/* Departments Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-200 font-black text-[12px]">
                        <th className="py-3 px-3 text-center w-24">كود الإدارة</th>
                        <th className="py-3 px-4">اسم الإدارة أو المحطة</th>
                        <th className="py-3 px-4">مدير الإدارة / المسئول</th>
                        <th className="py-3 px-4">المقر وموقع العمل</th>
                        <th className="py-3 px-3 text-center">الموظفون</th>
                        <th className="py-3 px-3 text-center">المحاضر</th>
                        <th className="py-3 px-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDirectoryDepartments.map((dept) => {
                        const repCount = db.reports.filter(
                          (r) => r.departmentName?.trim() === dept.name.trim()
                        ).length;
                        const empCount = db.recipients.filter(
                          (rec) => rec.departmentName?.trim() === dept.name.trim()
                        ).length;
                        return (
                          <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded font-mono-num font-black text-[11px] bg-indigo-50 text-indigo-900 border border-indigo-200">
                                {dept.code || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-black text-slate-900 text-xs sm:text-sm">{dept.name}</div>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-700">
                              {dept.managerName || '—'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {dept.location || 'منطقة مياه دسوق'}
                            </td>
                            <td className="py-3 px-3 text-center font-mono-num">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 text-sky-900 border border-sky-200">
                                {empCount}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono-num font-bold text-slate-700">
                              {repCount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRecipientDeptFilter(dept.name);
                                    setDirectorySubTab('employees');
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200"
                                >
                                  عرض الموظفين ({empCount})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف الإدارة "${dept.name}"؟`)) {
                                      syncDatabase(
                                        {
                                          ...db,
                                          departments: db.departments.filter((d) => d.id !== dept.id),
                                        },
                                        'تم حذف الإدارة من الدليل'
                                      );
                                    }
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= MODAL 1: ADD NEW EMPLOYEE ================= */}
            {isAddRecipientModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">
                        إضافة موظف جديد إلى دليل العاملين
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddRecipientModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الاسم بالكامل (رباعي) *
                      </label>
                      <input
                        type="text"
                        value={newRecipient.name}
                        onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                        placeholder="مثال: حسام أحمد حسن بدوي"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-hidden focus:border-sky-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          الصفة الوظيفية
                        </label>
                        <input
                          type="text"
                          value={newRecipient.jobTitle}
                          onChange={(e) => setNewRecipient({ ...newRecipient, jobTitle: e.target.value })}
                          placeholder="مثال: فني أول تشغيل"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          الرقم الوظيفي (الكود)
                        </label>
                        <input
                          type="text"
                          value={newRecipient.employeeCode}
                          onChange={(e) => setNewRecipient({ ...newRecipient, employeeCode: e.target.value })}
                          placeholder="مثال: 10450"
                          className="w-full px-3 py-2 text-xs font-mono-num bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الإدارة التابعة ومقر العمل
                      </label>
                      <select
                        value={newRecipient.departmentName}
                        onChange={(e) => setNewRecipient({ ...newRecipient, departmentName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-hidden"
                      >
                        <option value="">اختر الإدارة التابعة...</option>
                        {db.departments.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          الرقم القومي (14 رقم)
                        </label>
                        <input
                          type="text"
                          maxLength={14}
                          value={newRecipient.nationalId}
                          onChange={(e) => setNewRecipient({ ...newRecipient, nationalId: e.target.value })}
                          placeholder="29001011500000"
                          className="w-full px-3 py-2 text-xs font-mono-num bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          رقم الهاتف المحمول
                        </label>
                        <input
                          type="text"
                          value={newRecipient.phone}
                          onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                          placeholder="010XXXXXXXX"
                          className="w-full px-3 py-2 text-xs font-mono-num bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddRecipientModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newRecipient.name.trim()) {
                          showToast('يرجى إدخال اسم الموظف رباعياً');
                          return;
                        }
                        const rec: RecipientRecord = {
                          ...newRecipient,
                          id: `rec-${Date.now()}`,
                          name: newRecipient.name.trim(),
                        };
                        await syncDatabase(
                          { ...db, recipients: [rec, ...db.recipients] },
                          `تمت بنجاح إضافة الموظف "${rec.name}" إلى دليل العاملين`
                        );
                        setNewRecipient({
                          name: '',
                          jobTitle: '',
                          departmentName: '',
                          employeeCode: '',
                          nationalId: '',
                          phone: '',
                        });
                        setIsAddRecipientModalOpen(false);
                      }}
                      className="px-5 py-2 text-xs font-black text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs"
                    >
                      حفظ وإضافة إلى السجل
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= MODAL 2: ADD NEW DEPARTMENT ================= */}
            {isAddDepartmentModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">
                        إضافة إدارة أو محطة جديدة
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddDepartmentModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        اسم الإدارة أو المحطة *
                      </label>
                      <input
                        type="text"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                        placeholder="مثال: إدارة محطة مياه فوه الجديدة"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        اسم مدير الإدارة / المشرف
                      </label>
                      <input
                        type="text"
                        value={newDepartment.managerName}
                        onChange={(e) => setNewDepartment({ ...newDepartment, managerName: e.target.value })}
                        placeholder="مثال: م. أحمد البدري"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          كود الإدارة
                        </label>
                        <input
                          type="text"
                          value={newDepartment.code}
                          onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value })}
                          placeholder="DSQ-11"
                          className="w-full px-3 py-2 text-xs font-mono-num bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          مقر العمل / الموقع
                        </label>
                        <input
                          type="text"
                          value={newDepartment.location}
                          onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                          placeholder="منطقة مياه دسوق"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddDepartmentModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newDepartment.name.trim()) {
                          showToast('يرجى إدخال اسم الإدارة');
                          return;
                        }
                        const dept: DepartmentRecord = {
                          ...newDepartment,
                          id: `dept-${Date.now()}`,
                          name: newDepartment.name.trim(),
                          code: newDepartment.code || `DSQ-0${db.departments.length + 1}`,
                        };
                        await syncDatabase(
                          { ...db, departments: [dept, ...db.departments] },
                          `تمت إضافة الإدارة "${dept.name}" بنجاح`
                        );
                        setNewDepartment({
                          name: '',
                          managerName: '',
                          location: 'منطقة مياه دسوق',
                          code: '',
                        });
                        setIsAddDepartmentModalOpen(false);
                      }}
                      className="px-5 py-2 text-xs font-black text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs"
                    >
                      حفظ الإدارة
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: COMMITTEES & CATALOG ==================== */}
        {activeTab === 'committees' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  سجل أعضاء اللجان والصفات الوظيفية ({db.committeeMembers.length})
                </h2>
                <p className="text-xs text-slate-500">
                  أسماء اللجنة والصفة الوظيفية المسجلة لسرعة التعبئة والاختيار
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-800">تسجيل عضو لجنة جديد:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    list="prefixes-list"
                    value={newCommitteeMember.prefix}
                    onChange={(e) =>
                      setNewCommitteeMember({ ...newCommitteeMember, prefix: e.target.value })
                    }
                    placeholder="اللقب (السيد الأستاذ / ...)"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={newCommitteeMember.name}
                    onChange={(e) =>
                      setNewCommitteeMember({ ...newCommitteeMember, name: e.target.value })
                    }
                    placeholder="اسم عضو اللجنة *"
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={newCommitteeMember.jobTitle}
                    onChange={(e) =>
                      setNewCommitteeMember({ ...newCommitteeMember, jobTitle: e.target.value })
                    }
                    placeholder="الصفة الوظيفية"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                  <input
                    type="text"
                    list="committee-roles-list"
                    value={newCommitteeMember.defaultCommitteeRole}
                    onChange={(e) =>
                      setNewCommitteeMember({
                        ...newCommitteeMember,
                        defaultCommitteeRole: e.target.value,
                      })
                    }
                    placeholder="الدور (رئيسا / عضوا)"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newCommitteeMember.name.trim()) return;
                    const cm: CommitteeMemberRecord = {
                      ...newCommitteeMember,
                      id: `cm-db-${Date.now()}`,
                      name: newCommitteeMember.name.trim(),
                    };
                    await syncDatabase(
                      { ...db, committeeMembers: [cm, ...db.committeeMembers] },
                      `تم حفظ عضو اللجنة "${cm.name}" في قاعدة البيانات`
                    );
                    setNewCommitteeMember({
                      prefix: 'السيد الأستاذ /',
                      name: '',
                      jobTitle: '',
                      defaultCommitteeRole: 'عضوا',
                      departmentName: 'منطقة مياه دسوق',
                    });
                  }}
                  className="w-full py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-md"
                >
                  إضافة لدليل أعضاء اللجان
                </button>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {db.committeeMembers.map((cm) => (
                  <div
                    key={cm.id}
                    className="p-3 hover:bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {cm.prefix} {cm.name}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        الصفة الوظيفية: {cm.jobTitle || '—'} · الدور: ({cm.defaultCommitteeRole})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        syncDatabase(
                          {
                            ...db,
                            committeeMembers: db.committeeMembers.filter((x) => x.id !== cm.id),
                          },
                          'تم حذف العضو من الدليل'
                        )
                      }
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Catalog */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  كتالوج أصناف العهد المتكررة ({db.catalogItems.length})
                </h2>
                <p className="text-xs text-slate-500">
                  الأصناف المتكررة لتسريع إدراجها داخل جدول محضر الاستلام
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-800">إضافة صنف جديد للكتالوج:</div>
                <input
                  type="text"
                  value={newCatalogItem.itemName}
                  onChange={(e) =>
                    setNewCatalogItem({ ...newCatalogItem, itemName: e.target.value })
                  }
                  placeholder="اسم الصنف وبياناته بالتفصيل *"
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    list="units-list"
                    value={newCatalogItem.defaultUnit}
                    onChange={(e) =>
                      setNewCatalogItem({ ...newCatalogItem, defaultUnit: e.target.value })
                    }
                    placeholder="الوحدة الافتراضية"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={newCatalogItem.defaultNotes}
                    onChange={(e) =>
                      setNewCatalogItem({ ...newCatalogItem, defaultNotes: e.target.value })
                    }
                    placeholder="الملاحظات الافتراضية"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newCatalogItem.itemName.trim()) return;
                    const item: CatalogItemRecord = {
                      ...newCatalogItem,
                      id: `cat-${Date.now()}`,
                      itemName: newCatalogItem.itemName.trim(),
                    };
                    await syncDatabase(
                      { ...db, catalogItems: [item, ...db.catalogItems] },
                      'تم حفظ الصنف بالكتالوج'
                    );
                    setNewCatalogItem({
                      itemName: '',
                      defaultUnit: 'عدد',
                      category: 'مهمات تشغيل وصيانة',
                      defaultNotes: 'جديد وصالح للعمل',
                    });
                  }}
                  className="w-full py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-md"
                >
                  حفظ الصنف بالكتالوج
                </button>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {db.catalogItems.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 hover:bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{cat.itemName}</div>
                      <div className="text-[11px] text-slate-500">
                        الوحدة: {cat.defaultUnit} · الملاحظات: {cat.defaultNotes || '—'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        syncDatabase(
                          {
                            ...db,
                            catalogItems: db.catalogItems.filter((c) => c.id !== cat.id),
                          },
                          'تم حذف الصنف من الكتالوج'
                        )
                      }
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: SETTINGS & BACKUP ==================== */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                إعدادات الترويسة الرسمية والنسخ الاحتياطي لقاعدة البيانات
              </h2>
              <p className="text-xs text-slate-500">
                تخصيص بيانات الترويسة والاعتماد والنسخ الاحتياطي لقاعدة بيانات عهدتي
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السطر الأول بالترويسة (الشركة القابضة)
                </label>
                <input
                  type="text"
                  value={db.settings.holdingCompanyName}
                  onChange={(e) =>
                    setDb({
                      ...db,
                      settings: { ...db.settings, holdingCompanyName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السطر الثاني بالترويسة (الشركة التابعة)
                </label>
                <input
                  type="text"
                  value={db.settings.subsidiaryCompanyName}
                  onChange={(e) =>
                    setDb({
                      ...db,
                      settings: { ...db.settings, subsidiaryCompanyName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السطر الثالث بالترويسة (المنطقة / الفرع)
                </label>
                <input
                  type="text"
                  value={db.settings.areaName}
                  onChange={(e) =>
                    setDb({
                      ...db,
                      settings: { ...db.settings, areaName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الحد الأدنى لعدد صفوف جدول الأصناف بالطباعة
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={db.settings.minimumTableRowsInPrint}
                  onChange={(e) =>
                    setDb({
                      ...db,
                      settings: {
                        ...db.settings,
                        minimumTableRowsInPrint: parseInt(e.target.value, 10) || 2,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Logo Management Panel */}
              <div className="sm:col-span-2 bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sky-700" />
                    <span className="text-xs font-bold text-slate-800">
                      شعار المؤسسة المعتمد بالتقرير (Logo):
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    يظهر بالترويسة العلوية والعلامة المائية لمحاضر الاستلام والمناقلة
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview */}
                  <div className="w-24 h-24 p-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs flex items-center justify-center shrink-0">
                    <OfficialLogo
                      className="w-full h-full"
                      customLogoUrl={db.settings.customLogoUrl}
                    />
                  </div>

                  {/* Actions & Description */}
                  <div className="space-y-2 flex-1 text-center sm:text-right">
                    <div className="text-xs font-semibold text-slate-700">
                      {db.settings.customLogoUrl ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          يتم حالياً استخدام شعار مخصص مرفوع
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                          <Check className="w-3.5 h-3.5" />
                          الشعار الرسمي المعتمد (الشركة القابضة • كفر الشيخ • دسوق)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      تم تصميم الشعار المتجهي بأعلى درجات الدقة والوضوح الهندسي ليتوافق مع الطباعة الورقية واستخراج مستندات PDF بدقة فائقة. يمكنك أيضاً رفع شعار مخصص لفرعك أو محطتك في أي وقت.
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 rounded-md shadow-2xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-sky-700" />
                        <span>رفع شعار مخصص...</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              setDb({
                                ...db,
                                settings: { ...db.settings, customLogoUrl: result },
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>

                      {db.settings.customLogoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setDb({
                              ...db,
                              settings: { ...db.settings, customLogoUrl: '' },
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 rounded-md transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>استعادة الشعار الرسمي الافتراضي</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Styling Options */}
              <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  خيارات المظهر والتنسيق الرسمي لمحضر الاستلام (A4):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={db.settings.showOfficialStamp}
                      onChange={(e) =>
                        setDb({
                          ...db,
                          settings: { ...db.settings, showOfficialStamp: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-sky-700"
                    />
                    <span>إظهار خاتم شعار المنطقة الرسمي (أزرق بيضاوي)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={db.settings.showQrCode}
                      onChange={(e) =>
                        setDb({
                          ...db,
                          settings: { ...db.settings, showQrCode: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-sky-700"
                    />
                    <span>إظهار رمز الاستجابة السريعة (QR Code) للتحقق الرقمي</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={db.settings.showWatermark}
                      onChange={(e) =>
                        setDb({
                          ...db,
                          settings: { ...db.settings, showWatermark: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-sky-700"
                    />
                    <span>إظهار العلامة المائية الرسمية في خلفية التقرير (خفيفة للطباعة)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={db.settings.frameStyle !== 'executive_single'}
                      onChange={(e) =>
                        setDb({
                          ...db,
                          settings: {
                            ...db.settings,
                            frameStyle: e.target.checked ? 'classic_double' : 'executive_single',
                          },
                        })
                      }
                      className="rounded border-slate-300 text-sky-700"
                    />
                    <span>استخدام الإطار الحكومي المزدوج (Classic Double Border)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={db.settings.showEmployeeCodeInPrint}
                      onChange={(e) =>
                        setDb({
                          ...db,
                          settings: { ...db.settings, showEmployeeCodeInPrint: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-sky-700"
                    />
                    <span>إظهار كود / رقم سجل الموظف في خانة اسم المستلم</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={db.settings.showRecipientJobTitleInPrint}
                      onChange={(e) =>
                        setDb({
                          ...db,
                          settings: {
                            ...db.settings,
                            showRecipientJobTitleInPrint: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300 text-sky-700"
                    />
                    <span>إظهار الصفة الوظيفية للمستلم بجوار اسمه</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => syncDatabase(db, 'تم حفظ إعدادات الترويسة والطباعة بنجاح')}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الإعدادات</span>
              </button>
            </div>

            <div className="border-t border-slate-200 pt-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                النسخ الاحتياطي واستعادة قاعدة البيانات
              </h3>
              <p className="text-xs text-slate-500">
                يتم حفظ جميع المحاضر والمستلمين والإدارات واللجان تلقائياً في قاعدة بيانات الخادم (`custody_database.json`). يمكنك أيضاً تحميل نسخة احتياطية على جهازك أو استعادتها في أي وقت.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير قاعدة البيانات بالكامل (JSON)</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportDatabase}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>استيراد ملف قاعدة بيانات</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hidden container for print */}
      <div className="hidden print:block print-only-container">
        {printTarget === 'archive' ? (
          <PrintableArchiveLedger
            sheetId="official-archive-ledger-sheet-print"
            reports={filteredArchiveReports}
            settings={activeDb.settings}
            filterDescription={archiveFilterDescription}
            dateRangeDescription={archiveDateRangeDescription}
            showKpiSummary={archivePrintShowKpis}
            showItemDetails={archivePrintShowItemDetails}
            showSignatures={archivePrintShowSignatures}
            orientation={archivePrintOrientation}
            printFontSize={archivePrintFontSize}
          />
        ) : (
          <PrintableReceiptSheet
            sheetId="official-receipt-sheet-print"
            report={activeReport}
            settings={activeDb.settings}
            showReportNumberBadge={true}
            fontSizeScale={printFontSize}
          />
        )}
      </div>

      {/* ================= ARCHIVE PRINT & PREVIEW MODAL ================= */}
      {isArchivePrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Executive Header */}
            <div className="bg-[#16324f] text-white px-5 py-3.5 flex items-center justify-between gap-4 border-b border-sky-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-wide">
                      معاينة وطباعة سجل وأرشيف المحاضر والأذون (A4 Ledger)
                    </h2>
                    <span className="bg-sky-500/30 text-sky-200 border border-sky-400/40 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono-num">
                      {filteredArchiveReports.length} محضر محدد
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-200/80 font-medium">
                    طباعة رسمية معتمدة لسجل قيد العهد والمناقيل مطابقة لمعايير شركة مياه الشرب والصرف الصحي بكفر الشيخ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Direct Print Button */}
                <button
                  type="button"
                  onClick={handlePrintArchiveLedger}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
                  title="إرسال السجل للطابعة أو حفظ كـ PDF عبر المتصفح"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>طباعة السجل الآن</span>
                </button>

                {/* Export PDF Button */}
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={handleExportArchiveLedgerPdf}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="تنزيل ملف PDF عالي الجودة للسجل"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>تصدير PDF</span>
                </button>

                {/* Export Excel/CSV Button */}
                <button
                  type="button"
                  onClick={handleExportArchiveLedgerCsv}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                  title="تصدير جدول السجل إلى Excel / CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel / CSV</span>
                </button>

                {/* Close Modal */}
                <button
                  type="button"
                  onClick={() => setIsArchivePrintModalOpen(false)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-1"
                  title="إغلاق المعاينة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Control & Customization Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
              {/* Left Side: Layout & Toggles */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Orientation Selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 p-1 rounded-lg">
                  <span className="text-[11px] font-bold text-slate-600 px-1">الاتجاه:</span>
                  <button
                    type="button"
                    onClick={() => setArchivePrintOrientation('landscape')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      archivePrintOrientation === 'landscape'
                        ? 'bg-[#16324f] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    أفقي A4 (مستحسن للسجلات)
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchivePrintOrientation('portrait')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      archivePrintOrientation === 'portrait'
                        ? 'bg-[#16324f] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    رأسي A4
                  </button>
                </div>

                {/* Font Size Selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 p-1 rounded-lg">
                  <span className="text-[11px] font-bold text-slate-600 px-1">حجم الخط:</span>
                  <button
                    type="button"
                    onClick={() => setArchivePrintFontSize('small')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      archivePrintFontSize === 'small'
                        ? 'bg-sky-700 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    مضغوط
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchivePrintFontSize('medium')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      archivePrintFontSize === 'medium'
                        ? 'bg-sky-700 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    متوسط
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchivePrintFontSize('large')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      archivePrintFontSize === 'large'
                        ? 'bg-sky-700 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    كبير
                  </button>
                </div>

                {/* Checkbox Toggles */}
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={archivePrintShowKpis}
                    onChange={(e) => setArchivePrintShowKpis(e.target.checked)}
                    className="rounded border-slate-300 text-sky-700"
                  />
                  <span>شريط الإحصائيات (KPIs)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={archivePrintShowItemDetails}
                    onChange={(e) => setArchivePrintShowItemDetails(e.target.checked)}
                    className="rounded border-slate-300 text-sky-700"
                  />
                  <span>تفاصيل وحصر الأصناف</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={archivePrintShowSignatures}
                    onChange={(e) => setArchivePrintShowSignatures(e.target.checked)}
                    className="rounded border-slate-300 text-sky-700"
                  />
                  <span>توقيعات الاعتماد والخاتم</span>
                </label>
              </div>

              {/* Right Side: Active Filter Badge */}
              <div className="text-[11px] text-slate-500 font-medium truncate max-w-sm">
                <span className="text-slate-700 font-bold">النطاق: </span>
                {archiveFilterDescription}
              </div>
            </div>

            {/* Live Preview Scrollable Area */}
            <div className="flex-1 bg-slate-300/80 p-3 sm:p-6 overflow-auto flex items-start justify-center">
              <div className="shadow-2xl transition-all">
                <PrintableArchiveLedger
                  sheetId="official-archive-ledger-sheet-modal"
                  reports={filteredArchiveReports}
                  settings={activeDb.settings}
                  filterDescription={archiveFilterDescription}
                  dateRangeDescription={archiveDateRangeDescription}
                  showKpiSummary={archivePrintShowKpis}
                  showItemDetails={archivePrintShowItemDetails}
                  showSignatures={archivePrintShowSignatures}
                  orientation={archivePrintOrientation}
                  printFontSize={archivePrintFontSize}
                />
              </div>
            </div>

            {/* Modal Bottom Footer Bar */}
            <div className="bg-white border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>
                  جاهز للطباعة والتصدير • {filteredArchiveReports.length} محضر مدرج بالسجل الحالي
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsArchivePrintModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={handlePrintArchiveLedger}
                  className="px-5 py-1.5 text-xs font-bold text-white bg-[#16324f] hover:bg-[#0f243a] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>طباعة A4</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
