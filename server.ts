import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'custody_database.json');

export interface CustodyItem {
  id: string;
  itemName: string;
  unit: string;
  quantity: number;
  tafqeet: string;
  notes: string;
  serialNumber?: string;
}

export interface CommitteeMemberEntry {
  id: string;
  prefix: string;
  name: string;
  committeeRole: string;
  jobTitle: string;
  department?: string;
}

export interface CustodyReport {
  id: string;
  reportNumber: string;
  reportTitle: string;
  dayName: string;
  meetingDate: string;
  issueDate: string;
  committeeMembers: CommitteeMemberEntry[];
  items: CustodyItem[];
  recipientName: string;
  recipientJobTitle: string;
  recipientNationalId?: string;
  recipientEmployeeCode?: string;
  departmentName: string;
  approverTitle: string;
  approverName: string;
  status: 'معتمد' | 'مسودة' | 'مسلم';
  custodyType: 'عهدة شخصية مستديمة' | 'عهدة فرعية' | 'مهمات تشغيل وصيانة' | 'أجهزة وحاسب آلي';
  signatureTableRoleDisplay: 'jobTitle' | 'committeeRole' | 'both';
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientRecord {
  id: string;
  name: string;
  jobTitle: string;
  departmentName: string;
  employeeCode: string;
  nationalId: string;
  phone: string;
}

export interface CommitteeMemberRecord {
  id: string;
  prefix: string;
  name: string;
  jobTitle: string;
  defaultCommitteeRole: string;
  departmentName: string;
}

export interface CommitteePreset {
  id: string;
  presetName: string;
  description: string;
  members: CommitteeMemberEntry[];
}

export interface DepartmentRecord {
  id: string;
  name: string;
  managerName: string;
  location: string;
  code: string;
}

export interface CatalogItemRecord {
  id: string;
  itemName: string;
  defaultUnit: string;
  category: string;
  defaultNotes: string;
}

export interface OrganizationSettings {
  holdingCompanyName: string;
  subsidiaryCompanyName: string;
  areaName: string;
  defaultReportTitle: string;
  defaultApproverHeader: string;
  defaultApproverTitle: string;
  defaultApproverName: string;
  showWatermark: boolean;
  showOfficialStamp: boolean;
  showQrCode: boolean;
  frameStyle: 'classic_double' | 'executive_single';
  showRecipientJobTitleInPrint: boolean;
  showEmployeeCodeInPrint: boolean;
  showSerialColumnInPrint: boolean;
  minimumTableRowsInPrint: number;
}

export interface DatabaseSchema {
  reports: CustodyReport[];
  recipients: RecipientRecord[];
  committeeMembers: CommitteeMemberRecord[];
  committeePresets: CommitteePreset[];
  departments: DepartmentRecord[];
  catalogItems: CatalogItemRecord[];
  settings: OrganizationSettings;
}

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw) as DatabaseSchema;
    } catch {
      // ignore
    }
  }
  const initialData: DatabaseSchema = {
    settings: {
      holdingCompanyName: 'الشركة القابضة لمياه الشرب والصرف الصحي',
      subsidiaryCompanyName: 'شركه مياه الشرب والصرف الصحي بكفر الشيخ',
      areaName: 'منطقة مياه دسوق',
      defaultReportTitle: 'محضر استلام',
      defaultApproverHeader: 'يعتمد',
      defaultApproverTitle: 'مدير عام المنطقة',
      defaultApproverName: '',
      showWatermark: true,
      showOfficialStamp: true,
      showQrCode: true,
      frameStyle: 'classic_double',
      showRecipientJobTitleInPrint: true,
      showEmployeeCodeInPrint: true,
      showSerialColumnInPrint: false,
      minimumTableRowsInPrint: 1,
    },
    departments: [
      { id: 'dept-1', name: 'إدارة شبكات مياه دسوق', managerName: 'م. طارق عبد العزيز الشهاوي', location: 'المقر الرئيسي - منطقة دسوق', code: 'DSQ-NET-01' },
      { id: 'dept-2', name: 'إدارة محطات المياه والروافع', managerName: 'م. سامح محمد النجار', location: 'محطة مياه دسوق الرئيسية', code: 'DSQ-STN-02' },
      { id: 'dept-3', name: 'إدارة المخازن والمشتريات والعهد', managerName: 'أ. أشرف كمال أبو زيد', location: 'المخزن المركزي بدسوق', code: 'DSQ-STR-03' },
      { id: 'dept-4', name: 'إدارة نظم المعلومات والتحول الرقمي', managerName: 'م. وليد حسن الصاوي', location: 'المبنى الإداري - الدور الثاني', code: 'DSQ-IT-04' },
      { id: 'dept-5', name: 'إدارة الشئون المالية والإدارية', managerName: 'أ. محمود السيد الجندي', location: 'المبنى الإداري بدسوق', code: 'DSQ-FIN-05' },
      { id: 'dept-6', name: 'إدارة المعامل والجودة', managerName: 'د. هاني عبد الرحمن قاسم', location: 'المعمل المركزي - محطة دسوق', code: 'DSQ-LAB-06' },
      { id: 'dept-7', name: 'إدارة خدمة العملاء والتحصيل', managerName: 'أ. تامر فؤاد المنسي', location: 'مركز خدمة العملاء بدسوق', code: 'DSQ-CRM-07' },
      { id: 'dept-8', name: 'إدارة السلامة والصحة المهنية', managerName: 'م. كمال إبراهيم زهران', location: 'المقر الرئيسي - منطقة دسوق', code: 'DSQ-HSE-08' },
    ],
    recipients: [
      { id: 'rec-1', name: 'أحمد محمد عبد السلام البنا', jobTitle: 'مهندس تشغيل وصيانة شبكات', departmentName: 'إدارة شبكات مياه دسوق', employeeCode: '10482', nationalId: '29104151501234', phone: '01004589211' },
      { id: 'rec-2', name: 'إبراهيم السيد خلف الله', jobTitle: 'فني أول تشغيل محطات', departmentName: 'إدارة محطات المياه والروافع', employeeCode: '10819', nationalId: '28809221504412', phone: '01092341187' },
      { id: 'rec-3', name: 'محمد عبد المنعم الشرقاوي', jobTitle: 'أخصائي نظم معلومات ودعم فني', departmentName: 'إدارة نظم المعلومات والتحول الرقمي', employeeCode: '11205', nationalId: '29402101508821', phone: '01227845109' },
      { id: 'rec-4', name: 'السيد فتحي عبد الجواد', jobTitle: 'كيميائي معمل ومراقبة جودة', departmentName: 'إدارة المعامل والجودة', employeeCode: '10650', nationalId: '29011051503319', phone: '01115629034' },
      { id: 'rec-5', name: 'ياسر كمال الدين درويش', jobTitle: 'مراجع حسابات وعهد فرعية', departmentName: 'إدارة الشئون المالية والإدارية', employeeCode: '10311', nationalId: '28506181501982', phone: '01061128940' },
    ],
    committeeMembers: [
      { id: 'cm-1', prefix: 'السيد الأستاذ /', name: 'أشرف كمال أبو زيد', jobTitle: 'مدير إدارة المخازن والعهد', defaultCommitteeRole: 'رئيسا', departmentName: 'إدارة المخازن والمشتريات والعهد' },
      { id: 'cm-2', prefix: 'السيد المهندس /', name: 'طارق عبد العزيز الشهاوي', jobTitle: 'مدير إدارة شبكات مياه دسوق', defaultCommitteeRole: 'عضوا', departmentName: 'إدارة شبكات مياه دسوق' },
      { id: 'cm-3', prefix: 'السيد الأستاذ /', name: 'عادل عبد الحميد النحاس', jobTitle: 'مراقب عهدة ومخازن رئيسي', defaultCommitteeRole: 'عضوا', departmentName: 'إدارة المخازن والمشتريات والعهد' },
      { id: 'cm-4', prefix: 'السيد المهندس /', name: 'وليد حسن الصاوي', jobTitle: 'مدير إدارة نظم المعلومات', defaultCommitteeRole: 'عضوا فنيا', departmentName: 'إدارة نظم المعلومات والتحول الرقمي' },
      { id: 'cm-5', prefix: 'السيد الأستاذ /', name: 'محمود السيد الجندي', jobTitle: 'رئيس قسم المراجعة المالية', defaultCommitteeRole: 'عضوا', departmentName: 'إدارة الشئون المالية والإدارية' },
      { id: 'cm-6', prefix: 'السيد المهندس /', name: 'سامح محمد النجار', jobTitle: 'مدير إدارة المحطات والروافع', defaultCommitteeRole: 'رئيسا', departmentName: 'إدارة محطات المياه والروافع' },
    ],
    committeePresets: [
      {
        id: 'preset-1',
        presetName: 'اللجنة الأساسية لفحص واستلام العهد الشخصية',
        description: 'اللجنة المعتمدة لتسليم العهد الشخصية والمهمات الإدارية والفنية بمنطقة مياه دسوق',
        members: [
          { id: 'pm-1', prefix: 'السيد الأستاذ /', name: 'أشرف كمال أبو زيد', committeeRole: 'رئيسا', jobTitle: 'مدير إدارة المخازن والعهد' },
          { id: 'pm-2', prefix: 'السيد المهندس /', name: 'طارق عبد العزيز الشهاوي', committeeRole: 'عضوا', jobTitle: 'مدير إدارة شبكات مياه دسوق' },
          { id: 'pm-3', prefix: 'السيد الأستاذ /', name: 'عادل عبد الحميد النحاس', committeeRole: 'عضوا', jobTitle: 'مراقب عهدة ومخازن رئيسي' },
        ],
      },
      {
        id: 'preset-2',
        presetName: 'لجنة استلام أجهزة الحاسب الآلي والشبكات',
        description: 'لجنة فنية مختصة بتسليم أجهزة الحاسب والطابعات وأجهزة القياس الرقمية',
        members: [
          { id: 'pm-4', prefix: 'السيد المهندس /', name: 'وليد حسن الصاوي', committeeRole: 'رئيسا', jobTitle: 'مدير إدارة نظم المعلومات' },
          { id: 'pm-5', prefix: 'السيد الأستاذ /', name: 'أشرف كمال أبو زيد', committeeRole: 'عضوا', jobTitle: 'مدير إدارة المخازن والعهد' },
          { id: 'pm-6', prefix: 'السيد الأستاذ /', name: 'محمود السيد الجندي', committeeRole: 'عضوا', jobTitle: 'رئيس قسم المراجعة المالية' },
        ],
      },
    ],
    catalogItems: [
      { id: 'cat-1', itemName: 'جهاز حاسب آلي محمول (لابتوب) Dell Latitude 5540 - معالج Core i7 - رام 16 جيجا - بالشاحن الأصلي والحقيبة', defaultUnit: 'عدد', category: 'أجهزة وحاسب آلي', defaultNotes: 'جديد بالكرتونة - عهدة شخصية' },
      { id: 'cat-2', itemName: 'طابعة ليزر متعددة الوظائف HP LaserJet Pro MFP M428fdw بكابل البيانات والتغذية', defaultUnit: 'عدد', category: 'أجهزة وحاسب آلي', defaultNotes: 'بحالة ممتازة - شاملة الحبر الأساسي' },
      { id: 'cat-3', itemName: 'جهاز قياس نسبة الكلور الحر والرقم الهيدروجيني الرقمي (Pocket Colorimeter II) بالحقيبة', defaultUnit: 'جهاز', category: 'أجهزة قياس ومعامل', defaultNotes: 'شامل المحاليل القياسية والمعايرة' },
      { id: 'cat-4', itemName: 'طقم عدة صيانة ميكانيكية متكامل 68 قطعة داخل صندوق معدني ثقيل', defaultUnit: 'طقم', category: 'مهمات تشغيل وصيانة', defaultNotes: 'كامل المشمول وجديد' },
      { id: 'cat-5', itemName: 'جهاز قياس ضغط مياه رقمي (مانومتر ديجيتال 0-16 بار) بالوصلات النحاسية', defaultUnit: 'عدد', category: 'أجهزة قياس ومعامل', defaultNotes: 'تمت المعايرة الفنية' },
      { id: 'cat-6', itemName: 'مهمات وقاية وسلامة مهنية (خوذة أمان + حذاء سيفتي + جاكيت فسفوري عاكس)', defaultUnit: 'طقم', category: 'مهمات سلامة مهنية', defaultNotes: 'عهدة شخصية للموقع' },
    ],
    reports: [
      {
        id: 'rep-2026-001',
        reportNumber: '2026/101',
        reportTitle: 'محضر استلام',
        dayName: 'الجمعة',
        meetingDate: '2026-10-02',
        issueDate: '2026-10-02',
        committeeMembers: [
          { id: 'cm-r1', prefix: 'السيد الأستاذ /', name: 'أشرف كمال أبو زيد', committeeRole: 'رئيسا', jobTitle: 'مدير إدارة المخازن والعهد' },
          { id: 'cm-r2', prefix: 'السيد المهندس /', name: 'طارق عبد العزيز الشهاوي', committeeRole: 'عضوا', jobTitle: 'مدير إدارة شبكات مياه دسوق' },
          { id: 'cm-r3', prefix: 'السيد الأستاذ /', name: 'عادل عبد الحميد النحاس', committeeRole: 'عضوا', jobTitle: 'مراقب عهدة ومخازن رئيسي' },
        ],
        items: [
          { id: 'item-1', itemName: 'جهاز قياس ضغط مياه رقمي (مانومتر ديجيتال 0-16 بار) بالوصلات النحاسية والحقيبة الواقية', unit: 'عدد', quantity: 1, tafqeet: 'واحد فقط لا غير', notes: 'جديد وصالح للعمل' },
          { id: 'item-2', itemName: 'طقم عدة صيانة ميكانيكية متكامل 68 قطعة داخل صندوق معدني ثقيل', unit: 'طقم', quantity: 2, tafqeet: 'اثنان فقط لا غير', notes: 'كامل المشمول' },
        ],
        recipientName: 'أحمد محمد عبد السلام البنا',
        recipientJobTitle: 'مهندس تشغيل وصيانة شبكات',
        recipientEmployeeCode: '10482',
        recipientNationalId: '29104151501234',
        departmentName: 'إدارة شبكات مياه دسوق',
        approverTitle: 'مدير عام المنطقة',
        approverName: '',
        status: 'معتمد',
        custodyType: 'عهدة شخصية مستديمة',
        signatureTableRoleDisplay: 'jobTitle',
        generalNotes: 'تم الفحص والمعاينة بمعرفة اللجنة وتسليم الأصناف للمستلم بحالة جيدة وصالحة للاستخدام.',
        createdAt: '2026-10-02T08:00:00.000Z',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
      {
        id: 'rep-2026-002',
        reportNumber: '2026/102',
        reportTitle: 'محضر استلام',
        dayName: 'الخميس',
        meetingDate: '2026-10-01',
        issueDate: '2026-10-01',
        committeeMembers: [
          { id: 'cm-r4', prefix: 'السيد المهندس /', name: 'وليد حسن الصاوي', committeeRole: 'رئيسا', jobTitle: 'مدير إدارة نظم المعلومات' },
          { id: 'cm-r5', prefix: 'السيد الأستاذ /', name: 'أشرف كمال أبو زيد', committeeRole: 'عضوا', jobTitle: 'مدير إدارة المخازن والعهد' },
          { id: 'cm-r6', prefix: 'السيد الأستاذ /', name: 'محمود السيد الجندي', committeeRole: 'عضوا', jobTitle: 'رئيس قسم المراجعة المالية' },
        ],
        items: [
          { id: 'item-3', itemName: 'جهاز حاسب آلي محمول (لابتوب) Dell Latitude 5540 - معالج Core i7 - رام 16 جيجا - بالشاحن الأصلي', unit: 'عدد', quantity: 1, tafqeet: 'واحد فقط لا غير', notes: 'جديد بالكرتونة S/N: DL5540-9821' },
          { id: 'item-4', itemName: 'طابعة ليزر متعددة الوظائف HP LaserJet Pro MFP M428fdw بكابل البيانات والتغذية', unit: 'عدد', quantity: 1, tafqeet: 'واحد فقط لا غير', notes: 'شاملة التونر الأصلي' },
        ],
        recipientName: 'محمد عبد المنعم الشرقاوي',
        recipientJobTitle: 'أخصائي نظم معلومات ودعم فني',
        recipientEmployeeCode: '11205',
        recipientNationalId: '29402101508821',
        departmentName: 'إدارة نظم المعلومات والتحول الرقمي',
        approverTitle: 'مدير عام المنطقة',
        approverName: '',
        status: 'مسلم',
        custodyType: 'أجهزة وحاسب آلي',
        signatureTableRoleDisplay: 'jobTitle',
        generalNotes: 'عهدة شخصية لأعمال التحول الرقمي وميكنة التقارير بالمنطقة.',
        createdAt: '2026-10-01T10:30:00.000Z',
        updatedAt: '2026-10-01T10:30:00.000Z',
      },
    ],
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

function saveDb(data: DatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  ensureDb();

  app.get('/api/db', (_req, res) => {
    res.json(ensureDb());
  });

  app.put('/api/db', (req, res) => {
    const incoming = req.body as Partial<DatabaseSchema>;
    const current = ensureDb();
    const updated: DatabaseSchema = {
      reports: incoming.reports ?? current.reports,
      recipients: incoming.recipients ?? current.recipients,
      committeeMembers: incoming.committeeMembers ?? current.committeeMembers,
      committeePresets: incoming.committeePresets ?? current.committeePresets,
      departments: incoming.departments ?? current.departments,
      catalogItems: incoming.catalogItems ?? current.catalogItems,
      settings: incoming.settings ? { ...current.settings, ...incoming.settings } : current.settings,
    };
    saveDb(updated);
    res.json(updated);
  });

  app.post('/api/reports', (req, res) => {
    const { report, autoSaveDirectory } = req.body as {
      report: CustodyReport;
      autoSaveDirectory?: boolean;
    };
    const db = ensureDb();
    const existingIdx = db.reports.findIndex((r) => r.id === report.id);
    if (existingIdx >= 0) {
      db.reports[existingIdx] = { ...report, updatedAt: new Date().toISOString() };
    } else {
      db.reports.unshift({
        ...report,
        createdAt: report.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (autoSaveDirectory) {
      const cleanDept = (report.departmentName || '').trim();
      if (cleanDept && !db.departments.some((d) => d.name.trim() === cleanDept)) {
        db.departments.push({
          id: `dept-${Date.now()}`,
          name: cleanDept,
          managerName: '',
          location: 'منطقة مياه دسوق',
          code: `DSQ-${db.departments.length + 1}`,
        });
      }

      const cleanRecipient = (report.recipientName || '').trim();
      if (cleanRecipient) {
        const existingRecIdx = db.recipients.findIndex((r) => r.name.trim() === cleanRecipient);
        if (existingRecIdx === -1) {
          db.recipients.push({
            id: `rec-${Date.now()}`,
            name: cleanRecipient,
            jobTitle: report.recipientJobTitle || '',
            departmentName: cleanDept,
            employeeCode: report.recipientEmployeeCode || '',
            nationalId: report.recipientNationalId || '',
            phone: '',
          });
        }
      }

      for (const cm of report.committeeMembers) {
        const cleanCmName = (cm.name || '').trim();
        if (cleanCmName && !db.committeeMembers.some((m) => m.name.trim() === cleanCmName)) {
          db.committeeMembers.push({
            id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            prefix: cm.prefix || 'السيد الأستاذ /',
            name: cleanCmName,
            jobTitle: cm.jobTitle || cm.committeeRole || '',
            defaultCommitteeRole: cm.committeeRole || 'عضوا',
            departmentName: cleanDept || 'منطقة مياه دسوق',
          });
        }
      }
    }

    saveDb(db);
    res.json(db);
  });

  app.delete('/api/reports/:id', (req, res) => {
    const db = ensureDb();
    db.reports = db.reports.filter((r) => r.id !== req.params.id);
    saveDb(db);
    res.json(db);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
