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
          setDb(data);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
          if (data.reports.length > 0) {
            setCurrentReport(data.reports[0]);
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

  const handleCreateNewReport = (reportType: 'receipt' | 'transfer' = 'receipt') => {
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
      {/* Top Bar (3-Zone Header, hidden in print) */}
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#editor"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('editor');
          }}
          className="text-base lg:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-700"></span>
          <span>عهدتي</span>
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            | منظومة محاضر العهد الشخصية
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'editor'
                ? 'border-sky-700 text-sky-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            تحرير محضر استلام
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'archive'
                ? 'border-sky-700 text-sky-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            سجل المحاضر والبحث ({db.reports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recipients')}
            className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'recipients'
                ? 'border-sky-700 text-sky-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            المستلمون والإدارات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('committees')}
            className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'committees'
                ? 'border-sky-700 text-sky-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            اللجان والأصناف
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
              activeTab === 'settings'
                ? 'border-sky-700 text-sky-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            إعدادات الترويسة والبيانات
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Export PDF, DOCX, Print) */}
        <div className="flex items-center gap-2">
          {/* Quick Create Buttons */}
          <button
            type="button"
            onClick={() => handleCreateNewReport('receipt')}
            className="hidden xl:flex px-3 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors whitespace-nowrap items-center gap-1.5 shadow-xs"
            title="إنشاء نموذج محضر استلام عهدة جديد"
          >
            <Plus className="w-3.5 h-3.5 text-sky-700" />
            <span>محضر استلام جديد</span>
          </button>

          <button
            type="button"
            onClick={() => handleCreateNewReport('transfer')}
            className="hidden xl:flex px-3 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap items-center gap-1.5 shadow-xs"
            title="إنشاء نموذج إذن مناقيل عهدة جديد (مُسلِّم ومُستلم)"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>إذن مناقيل جديد</span>
          </button>

          {/* Quick PDF Export with jspdf & html2canvas */}
          <button
            type="button"
            onClick={() => handleExportPdf(currentReport)}
            disabled={isExportingPdf}
            className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            title="تصدير محضر الاستلام إلى ملف PDF باستخدام jspdf و html2canvas"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 text-rose-600" />
            )}
            <span>تصدير PDF</span>
          </button>

          {/* Quick DOCX Export */}
          <button
            type="button"
            onClick={() => handleExportDocx(currentReport)}
            disabled={isExportingDocx}
            className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            title="تصدير محضر الاستلام إلى ملف Word (DOCX)"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>تصدير DOCX</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleSaveReport();
              setTimeout(() => window.print(), 150);
            }}
            className="px-3.5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة ورقية</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="no-print md:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'editor', label: 'تحرير المحضر' },
          { id: 'archive', label: `السجل والبحث (${db.reports.length})` },
          { id: 'recipients', label: 'المستلمون والإدارات' },
          { id: 'committees', label: 'اللجان والأصناف' },
          { id: 'settings', label: 'الإعدادات' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-sky-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toast Notification */}
      {saveBanner && (
        <div className="no-print fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2.5 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-5 no-print">
        {/* Unboxed clean metadata header */}
        <div className="mb-5 pb-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="text-slate-900 font-bold">{db.settings.holdingCompanyName}</span>
            <span aria-hidden="true">·</span>
            <span>{db.settings.subsidiaryCompanyName}</span>
            <span aria-hidden="true">·</span>
            <span className="text-sky-800 font-bold">{db.settings.areaName}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">المحاضر: {db.reports.length}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">المستلمون: {db.recipients.length}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">الإدارات: {db.departments.length}</span>
          </div>

          {activeTab === 'editor' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
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
                className="px-4 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ بقاعدة البيانات</span>
              </button>
            </div>
          )}
        </div>

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

                {/* Section 2: Flexible Recipient & Department Input */}
                <section className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">
                      02. بيانات المستلم والإدارة التابعة (إدخال مرن أو من الدليل)
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
                    onClick={handleCreateNewReport}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>محضر استلام جديد</span>
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

              {/* Filter Results Counter */}
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
                <span>
                  عرض <strong className="text-slate-900 font-mono-num">{filteredArchiveReports.length}</strong> محضر من إجمالي{' '}
                  <strong className="text-slate-900 font-mono-num">{db.reports.length}</strong> محضر مسجل
                </span>
                {hasActiveFilters && (
                  <span className="text-sky-700 font-bold">
                    تم تطبيق شروط التصفية المحددة
                  </span>
                )}
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
                          <td className="py-3 px-3 font-mono-num font-bold text-sky-900">
                            {rep.reportNumber}
                          </td>
                          <td className="py-3 px-3 font-mono-num text-slate-700">
                            <div>{rep.meetingDate}</div>
                            <div className="text-[11px] text-slate-500">يوم {rep.dayName}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">
                              {rep.recipientName || 'غير محدد'}
                            </div>
                            {rep.recipientJobTitle && (
                              <div className="text-[11px] text-slate-500">
                                {rep.recipientJobTitle}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {rep.departmentName || '—'}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  دليل المستلمين والموظفين ({db.recipients.length})
                </h2>
                <p className="text-xs text-slate-500">
                  سجل بيانات العاملين لسرعة اختيارهم وتعبئة بيانات العهدة والإدارة تلقائياً
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="text-xs font-bold text-slate-800">إضافة مستلم جديد:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                    placeholder="الاسم رباعي *"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold"
                  />
                  <input
                    type="text"
                    value={newRecipient.jobTitle}
                    onChange={(e) =>
                      setNewRecipient({ ...newRecipient, jobTitle: e.target.value })
                    }
                    placeholder="الصفة الوظيفية"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                  <input
                    type="text"
                    list="dept-datalist"
                    value={newRecipient.departmentName}
                    onChange={(e) =>
                      setNewRecipient({ ...newRecipient, departmentName: e.target.value })
                    }
                    placeholder="الإدارة التابعة"
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={newRecipient.employeeCode}
                    onChange={(e) =>
                      setNewRecipient({ ...newRecipient, employeeCode: e.target.value })
                    }
                    placeholder="الرقم الوظيفي"
                    className="px-3 py-1.5 text-xs font-mono-num bg-white border border-slate-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={newRecipient.nationalId}
                    onChange={(e) =>
                      setNewRecipient({ ...newRecipient, nationalId: e.target.value })
                    }
                    placeholder="الرقم القومي (اختياري)"
                    className="px-3 py-1.5 text-xs font-mono-num bg-white border border-slate-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newRecipient.name.trim()) return;
                      const rec: RecipientRecord = {
                        ...newRecipient,
                        id: `rec-${Date.now()}`,
                        name: newRecipient.name.trim(),
                      };
                      await syncDatabase(
                        { ...db, recipients: [rec, ...db.recipients] },
                        `تمت إضافة "${rec.name}" إلى دليل المستلمين`
                      );
                      setNewRecipient({
                        name: '',
                        jobTitle: '',
                        departmentName: '',
                        employeeCode: '',
                        nationalId: '',
                        phone: '',
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-md flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>حفظ المستلم بالدليل</span>
                  </button>
                </div>
              </div>

              <datalist id="dept-datalist">
                {db.departments.map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-3">اسم المستلم</th>
                      <th className="py-2.5 px-3">الصفة الوظيفية</th>
                      <th className="py-2.5 px-3">الإدارة التابعة</th>
                      <th className="py-2.5 px-3">المحاضر</th>
                      <th className="py-2.5 px-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {db.recipients.map((rec) => {
                      const count = db.reports.filter(
                        (r) => r.recipientName.trim() === rec.name.trim()
                      ).length;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            <div>{rec.name}</div>
                            {rec.employeeCode && (
                              <div className="text-[10px] font-mono-num text-slate-400">
                                كود: {rec.employeeCode}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{rec.jobTitle || '—'}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {rec.departmentName || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono-num font-bold text-sky-800">
                            {count} محضر
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
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
                                  showToast(`تم اختيار المستلم "${rec.name}" في المحضر الحالي`);
                                }}
                                className="px-2 py-1 text-[11px] font-bold bg-sky-50 text-sky-800 hover:bg-sky-100 rounded border border-sky-200"
                              >
                                إدراج بمحضر
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  syncDatabase(
                                    {
                                      ...db,
                                      recipients: db.recipients.filter((r) => r.id !== rec.id),
                                    },
                                    'تم حذف المستلم من الدليل'
                                  )
                                }
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
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

            {/* Departments */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  الإدارات والمحطات التابعة ({db.departments.length})
                </h2>
                <p className="text-xs text-slate-500">
                  الهيكل الإداري والمحطات التابعة لمنطقة مياه دسوق
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-800">إضافة إدارة جديدة:</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) =>
                      setNewDepartment({ ...newDepartment, name: e.target.value })
                    }
                    placeholder="اسم الإدارة التابعة *"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newDepartment.managerName}
                      onChange={(e) =>
                        setNewDepartment({ ...newDepartment, managerName: e.target.value })
                      }
                      placeholder="اسم مدير الإدارة (اختياري)"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                    />
                    <input
                      type="text"
                      value={newDepartment.code}
                      onChange={(e) =>
                        setNewDepartment({ ...newDepartment, code: e.target.value })
                      }
                      placeholder="كود الإدارة"
                      className="px-3 py-1.5 text-xs font-mono-num bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newDepartment.name.trim()) return;
                      const dept: DepartmentRecord = {
                        ...newDepartment,
                        id: `dept-${Date.now()}`,
                        name: newDepartment.name.trim(),
                        code: newDepartment.code || `DSQ-0${db.departments.length + 1}`,
                      };
                      await syncDatabase(
                        { ...db, departments: [dept, ...db.departments] },
                        `تمت إضافة "${dept.name}" إلى قاعدة البيانات`
                      );
                      setNewDepartment({
                        name: '',
                        managerName: '',
                        location: 'منطقة مياه دسوق',
                        code: '',
                      });
                    }}
                    className="w-full py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-md flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة الإدارة التابعة</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {db.departments.map((dept) => {
                  const repCount = db.reports.filter(
                    (r) => r.departmentName.trim() === dept.name.trim()
                  ).length;
                  return (
                    <div
                      key={dept.id}
                      className="p-3 hover:bg-slate-50 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{dept.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {dept.managerName ? `مدير الإدارة: ${dept.managerName} · ` : ''}
                          <span className="font-mono-num">المحاضر: {repCount}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          syncDatabase(
                            {
                              ...db,
                              departments: db.departments.filter((d) => d.id !== dept.id),
                            },
                            'تم حذف الإدارة من الدليل'
                          )
                        }
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
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
        <PrintableReceiptSheet
          sheetId="official-receipt-sheet-print"
          report={activeReport}
          settings={activeDb.settings}
          showReportNumberBadge={true}
          fontSizeScale={printFontSize}
        />
      </div>
    </div>
  );
}
