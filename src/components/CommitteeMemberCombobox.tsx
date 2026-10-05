import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Check,
  Search,
  User,
  UserCheck,
  Sparkles,
  X,
  Briefcase,
  Building,
  Award,
} from 'lucide-react';
import { CommitteeMemberRecord, CommitteeMemberEntry } from '../types';

export const OFFICIAL_DEFAULT_MEMBERS = [
  {
    slot: 1,
    name: 'علي عبداللطيف غزال',
    prefix: 'السيد الأستاذ /',
    jobTitle: 'مدير إدارة المخازن والعهد',
    defaultRole: 'رئيسا',
    departmentName: 'إدارة المخازن والمشتريات والعهد',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    avatarBg: 'bg-amber-600 text-white',
  },
  {
    slot: 2,
    name: 'محمد مسعود ابوسمرة',
    prefix: 'السيد الأستاذ /',
    jobTitle: 'مراقب عهدة ومخازن رئيسي',
    defaultRole: 'عضوا',
    departmentName: 'إدارة المخازن والمشتريات والعهد',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    avatarBg: 'bg-sky-600 text-white',
  },
  {
    slot: 3,
    name: 'محمود عبداللطيف زينهم',
    prefix: 'السيد الأستاذ /',
    jobTitle: 'رئيس قسم المراجعة المالية والمخزنية',
    defaultRole: 'عضوا',
    departmentName: 'إدارة الشئون المالية والإدارية',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    avatarBg: 'bg-indigo-600 text-white',
  },
];

interface CommitteeMemberComboboxProps {
  memberIndex: number;
  member: CommitteeMemberEntry;
  registeredMembers: CommitteeMemberRecord[];
  onSelectMember: (memberData: {
    name: string;
    prefix: string;
    jobTitle: string;
    committeeRole: string;
    department?: string;
  }) => void;
  onUpdateName: (name: string) => void;
  placeholder?: string;
}

export const CommitteeMemberCombobox: React.FC<CommitteeMemberComboboxProps> = React.memo(({
  memberIndex,
  member,
  registeredMembers,
  onSelectMember,
  onUpdateName,
  placeholder = 'ابحث أو اختر اسم عضو اللجنة...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find recommended default member for this slot (1-indexed)
  const slotDefault = OFFICIAL_DEFAULT_MEMBERS.find(
    (m) => m.slot === memberIndex + 1
  );

  // Combine registered members with official defaults to guarantee all official defaults are always available
  const allAvailableMembers = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      prefix: string;
      jobTitle: string;
      committeeRole: string;
      departmentName: string;
      isOfficialDefault?: boolean;
      officialSlot?: number;
    }> = [];

    // Add registered members
    registeredMembers.forEach((rm) => {
      const matchOfficial = OFFICIAL_DEFAULT_MEMBERS.find((om) => om.name === rm.name);
      list.push({
        id: rm.id,
        name: rm.name,
        prefix: rm.prefix || 'السيد الأستاذ /',
        jobTitle: rm.jobTitle,
        committeeRole: rm.defaultCommitteeRole || 'عضوا',
        departmentName: rm.departmentName,
        isOfficialDefault: !!matchOfficial,
        officialSlot: matchOfficial?.slot,
      });
    });

    // Ensure all 3 official members are in the list even if not yet in registeredMembers
    OFFICIAL_DEFAULT_MEMBERS.forEach((om) => {
      if (!list.some((item) => item.name === om.name)) {
        list.push({
          id: `official-${om.slot}`,
          name: om.name,
          prefix: om.prefix,
          jobTitle: om.jobTitle,
          committeeRole: om.defaultRole,
          departmentName: om.departmentName,
          isOfficialDefault: true,
          officialSlot: om.slot,
        });
      }
    });

    return list;
  }, [registeredMembers]);

  // Filter members based on search query or input
  const effectiveFilter = searchQuery.trim() || member.name.trim();

  const filteredMembers = useMemo(() => {
    if (!effectiveFilter) return allAvailableMembers;
    const q = effectiveFilter.toLowerCase();
    return allAvailableMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.jobTitle.toLowerCase().includes(q) ||
        m.departmentName.toLowerCase().includes(q) ||
        m.committeeRole.toLowerCase().includes(q)
    );
  }, [allAvailableMembers, effectiveFilter]);

  // Check if current name matches any registered/official member
  const matchedMember = allAvailableMembers.find(
    (m) => m.name.trim() === member.name.trim()
  );

  const handleSelect = (m: {
    name: string;
    prefix: string;
    jobTitle: string;
    committeeRole: string;
    departmentName?: string;
  }) => {
    onSelectMember({
      name: m.name,
      prefix: m.prefix,
      jobTitle: m.jobTitle,
      committeeRole:
        memberIndex === 0 && m.name === 'علي عبداللطيف غزال'
          ? 'رئيسا'
          : m.committeeRole || (memberIndex === 0 ? 'رئيسا' : 'عضوا'),
      department: m.departmentName,
    });
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleApplySlotDefault = () => {
    if (!slotDefault) return;
    onSelectMember({
      name: slotDefault.name,
      prefix: slotDefault.prefix,
      jobTitle: slotDefault.jobTitle,
      committeeRole: slotDefault.defaultRole,
      department: slotDefault.departmentName,
    });
    setSearchQuery('');
    setIsOpen(false);
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] || ''} ${parts[1][0] || ''}`;
    }
    return name.slice(0, 2);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input container with professional styling */}
      <div
        className={`flex items-center bg-white border rounded-lg transition-all shadow-2xs h-10 px-2 ${
          isOpen
            ? 'border-sky-600 ring-2 ring-sky-100'
            : matchedMember
            ? 'border-emerald-300 hover:border-emerald-400'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {/* Left Indicator/Avatar icon */}
        <div className="pr-1 pl-1.5 flex items-center justify-center text-slate-400">
          {matchedMember?.isOfficialDefault ? (
            <span
              title={`عضو معتمد رسمي (عضو ${matchedMember.officialSlot})`}
              className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs"
            >
              ★
            </span>
          ) : matchedMember ? (
            <UserCheck className="w-4 h-4 text-emerald-600" />
          ) : (
            <User className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={member.name}
          onChange={(e) => {
            const val = e.target.value;
            onUpdateName(val);
          }}
          placeholder={placeholder}
          className="flex-1 py-2 px-1 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
        />

        {/* Clear Button */}
        {member.name && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateName('');
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            title="مسح الاسم"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown Toggle Chevron */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setSearchQuery('');
              inputRef.current?.focus();
            }
          }}
          className="p-1.5 pl-1 text-slate-400 hover:text-sky-700 transition-colors"
          title="عرض قائمة أعضاء اللجنة"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-sky-700' : ''
            }`}
          />
        </button>
      </div>

      {/* Floating Combobox Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 right-0 w-full min-w-[300px] max-w-[440px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95 duration-100 text-right">
          {/* Header with Slot Default Recommendation */}
          {slotDefault && (
            <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-2.5 border-b border-sky-100">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-black text-sky-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  القيمة الافتراضية لعضو اللجنة ({slotDefault.slot}):
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-2xs">
                  معتمد رسمي
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplySlotDefault}
                className="w-full text-right p-2 rounded-lg bg-white border border-sky-200 hover:border-sky-400 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${slotDefault.avatarBg}`}
                  >
                    {getInitials(slotDefault.name)}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 group-hover:text-sky-700">
                      {slotDefault.name}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>{slotDefault.jobTitle}</span>
                      <span>·</span>
                      <span className="font-bold text-sky-800">
                        {slotDefault.defaultRole}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-700 group-hover:translate-x-[-2px] transition-transform">
                  تعيين الآن ↵
                </span>
              </button>
            </div>
          )}

          {/* Quick Search inside dropdown if open */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الصفة، أو الإدارة..."
              className="w-full text-xs bg-transparent border-0 focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Members List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((cm) => {
                const isSelected = cm.name.trim() === member.name.trim();
                return (
                  <button
                    key={cm.id}
                    type="button"
                    onClick={() => handleSelect(cm)}
                    className={`w-full text-right p-2.5 transition-colors flex items-center justify-between gap-2 hover:bg-sky-50 ${
                      isSelected ? 'bg-sky-50/80 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar initials circle */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          cm.officialSlot === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : cm.officialSlot === 2
                            ? 'bg-sky-100 text-sky-900 border border-sky-300'
                            : cm.officialSlot === 3
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {getInitials(cm.name)}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {cm.name}
                          </span>
                          {cm.officialSlot && (
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                                cm.officialSlot === 1
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : cm.officialSlot === 2
                                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                              }`}
                            >
                              عضو ({cm.officialSlot})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                          <span>{cm.jobTitle}</span>
                          {cm.departmentName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">
                                {cm.departmentName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-full border border-sky-200">
                        {cm.committeeRole}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                لا يوجد عضو مطابق لبحثك «{effectiveFilter}»
              </div>
            )}
          </div>

          {/* Quick manual selection fallback footer */}
          {effectiveFilter && !matchedMember && (
            <div className="p-2 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onUpdateName(effectiveFilter);
                  setIsOpen(false);
                }}
                className="w-full text-right px-2.5 py-1.5 text-xs font-bold text-sky-800 hover:bg-white rounded border border-transparent hover:border-slate-200 flex items-center justify-between"
              >
                <span>اعتماد «{effectiveFilter}» كاسم حر غير مسجل</span>
                <span className="text-[10px] text-slate-500">↵ اختيار</span>
              </button>
            </div>
          )}

          {/* Footer with all 3 default shortcut buttons */}
          <div className="p-2 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between gap-1 text-[10px]">
            <span className="font-bold text-slate-600">اختصارات سريعة:</span>
            <div className="flex items-center gap-1">
              {OFFICIAL_DEFAULT_MEMBERS.map((om) => (
                <button
                  key={om.slot}
                  type="button"
                  onClick={() =>
                    handleSelect({
                      name: om.name,
                      prefix: om.prefix,
                      jobTitle: om.jobTitle,
                      committeeRole: om.defaultRole,
                      departmentName: om.departmentName,
                    })
                  }
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition-colors ${
                    member.name === om.name
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50'
                  }`}
                  title={`تعيين ${om.name}`}
                >
                  عضو ({om.slot}): {om.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
