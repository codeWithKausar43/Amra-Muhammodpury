'use client';

import * as React from 'react';
import {
  Award,
  Plus,
  Edit2,
  Users,
  Loader2,
  X,
  Layers,
} from 'lucide-react';
import {
  useAdminDesignationsQuery,
  useOrgMutations,
} from '../hooks/useOrganizationQueries';
import { toast } from '@/components/feedback/Toast';
import type { AdminDesignationItem } from '../types';

function toBengaliNumber(num: number | string | undefined | null): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

export function DesignationManagementSection() {
  const { data: designations = [], isLoading } = useAdminDesignationsQuery();
  const mutations = useOrgMutations();

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [createCode, setCreateCode] = React.useState('');
  const [createName, setCreateName] = React.useState('');
  const [createRank, setCreateRank] = React.useState<number>(10);
  const [createDesc, setCreateDesc] = React.useState('');

  // Edit Modal
  const [editingItem, setEditingItem] = React.useState<AdminDesignationItem | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editRank, setEditRank] = React.useState<number>(10);
  const [editDesc, setEditDesc] = React.useState('');
  const [editIsActive, setEditIsActive] = React.useState(true);

  const handleOpenEdit = (item: AdminDesignationItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditRank(item.rank);
    setEditDesc(item.description || '');
    setEditIsActive(item.isActive);
  };

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.warning('পদবির নাম আবশ্যক');
      return;
    }
    const code = createCode.trim() || createName.trim().toUpperCase().replace(/\s+/g, '_');
    try {
      await mutations.createDesignation.mutateAsync({
        code,
        name: createName.trim(),
        rank: createRank,
        description: createDesc.trim() || undefined,
      });
      toast.success('নতুন পদবি সফলভাবে তৈরি হয়েছে।');
      setCreateModalOpen(false);
      setCreateCode('');
      setCreateName('');
      setCreateDesc('');
      setCreateRank(10);
    } catch (err: any) {
      toast.error(err.message || 'পদবি তৈরি ব্যর্থ হয়েছে');
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      await mutations.updateDesignation.mutateAsync({
        id: editingItem.id,
        data: {
          name: editName.trim(),
          rank: editRank,
          description: editDesc.trim() || undefined,
          isActive: editIsActive,
        },
      });
      toast.success('পদবি সফলভাবে আপডেট হয়েছে।');
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'পদবি আপডেট ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-emerald" />
            <span>সাংগঠনিক পদবি ব্যবস্থাপনা (Designation Directory)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            সংগঠনের কার্যকরী পদবি তৈরি, র্যাংক/মর্যাদাক্রম বিন্যাস এবং সদস্য বণ্টন
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন পদবি যোগ করুন</span>
        </button>
      </div>

      {/* Designation Cards List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
          <p className="text-xs text-slate-400">পদবি তালিকা লোড হচ্ছে...</p>
        </div>
      ) : designations.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-400 space-y-2">
          <Layers className="w-8 h-8 mx-auto text-slate-300" />
          <div>কোনো পদবি পাওয়া যায়নি। নতুন পদবি যোগ করতে উপরের বাটনে ক্লিক করুন।</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {designations.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl bg-white dark:bg-white/5 border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                item.isActive
                  ? 'border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                  : 'border-slate-200/50 dark:border-white/5 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-brand-emerald/20 text-brand-emerald dark:text-brand-mint text-xs font-bold flex items-center justify-center font-mono">
                      {toBengaliNumber(item.rank)}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </h4>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  কোড: {item.code}
                </div>

                {item.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                  <Users className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>{toBengaliNumber(item.memberCount)} জন সদস্য</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>সম্পাদনা</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141F1B] rounded-3xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-emerald" />
                <span>নতুন সাংগঠনিক পদবি তৈরি</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  পদবির নাম (যেমন: সভাপতি, সাধারণ সম্পাদক) *
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="পদবির নাম লিখুন..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ইউনিক কোড (ইংরেজি বড়হাতে, যেমন: PRESIDENT)
                </label>
                <input
                  type="text"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value)}
                  placeholder="ফাঁকা রাখলে স্বয়ংক্রিয় তৈরি হবে"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-white outline-none focus:border-brand-emerald uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  মর্যাদাক্রম / র্যাংক (কম সংখ্যা = উচ্চ মর্যাদা, যেমন ১, ২, ৩)
                </label>
                <input
                  type="number"
                  value={createRank}
                  onChange={(e) => setCreateRank(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  দায়িত্ব / বিবরণ (ঐচ্ছিক)
                </label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="এই পদবির মূল দায়িত্বসমূহ সংক্ষেপে লিখুন..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={mutations.createDesignation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                {mutations.createDesignation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>তৈরি করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141F1B] rounded-3xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-emerald" />
                <span>পদবি সম্পাদনা: {editingItem.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  পদবির নাম
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  মর্যাদাক্রম / র্যাংক
                </label>
                <input
                  type="number"
                  value={editRank}
                  onChange={(e) => setEditRank(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  দায়িত্ব / বিবরণ
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded text-brand-emerald"
                  />
                  <span>সক্রিয় পদবি (সদস্যদের জন্য বরাদ্দযোগ্য)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={mutations.updateDesignation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                {mutations.updateDesignation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
