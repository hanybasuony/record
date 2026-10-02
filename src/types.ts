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
