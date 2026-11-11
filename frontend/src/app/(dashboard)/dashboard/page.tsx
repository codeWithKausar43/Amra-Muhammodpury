'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession, signOut, changePassword } from '@/lib/auth/auth-client';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  Check,
  Calendar,
  KeyRound,
  FileText,
  Coins,
  Edit3,
} from 'lucide-react';
import { socialService, UserProfileData } from '@/features/social/services/social.service';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { toast } from '@/components/feedback/Toast';
import { useOrgMembershipStatusQuery } from '@/features/organization/hooks/useOrganizationQueries';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { UpdateContributionModal } from '@/features/organization/components/UpdateContributionModal';

type SettingsTab = 'profile' | 'account' | 'security' | 'overview';

interface DashboardUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  role?: string | null;
  createdAt?: string | Date | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: membershipData } = useOrgMembershipStatusQuery();

  // Active Tab
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('profile');

  // Profile data from backend
  const [profile, setProfile] = React.useState<UserProfileData['user'] | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Editable Form States
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [bio, setBio] = React.useState('');

  // Image upload states
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  // Status & Feedback
  const [saving, setSaving] = React.useState(false);
  const [saveStatusText, setSaveStatusText] = React.useState('সংরক্ষণ হচ্ছে...');
  const [updateContribModalOpen, setUpdateContribModalOpen] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Password Change States
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [changingPass, setChangingPass] = React.useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = React.useState<string | null>(null);
  const [passErrorMsg, setPassErrorMsg] = React.useState<string | null>(null);

  // Logout state
  const [loggingOut, setLoggingOut] = React.useState(false);

  // Fetch complete profile on mount
  React.useEffect(() => {
    const isMounted = true;

    async function loadUserProfile() {
      try {
        const data = await socialService.getProfile('me');
        if (data?.user && isMounted) {
          setProfile(data.user);
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setPhone(data.user.phone || '');
          setBio(data.user.bio || '');
          setAvatarPreview(data.user.image || null);
          setCoverPreview(data.user.coverImage || null);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    }

    if (session?.user) {
      loadUserProfile();
    }
  }, [session]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  // Helper to upload images to Cloudinary via backend signature
  const uploadImage = async (file: File): Promise<string> => {
    const sigRes = await apiClient<
      ApiResponse<{
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
        cloudName: string;
        resourceType: string;
      }>
    >('/uploads/signature', {
      method: 'POST',
      body: JSON.stringify({
        folder: 'profiles',
        resourceType: 'image',
        isRegistration: false,
      }),
    });

    const signData = sigRes.data;
    if (!signData) throw new Error('আপলোড সিগনেচার গ্রহণ করা সম্ভব হয়নি');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signData.apiKey);
    formData.append('timestamp', signData.timestamp.toString());
    formData.append('signature', signData.signature);
    formData.append('folder', signData.folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/${signData.resourceType}/upload`,
      { method: 'POST', body: formData },
    );

    const asset = await res.json();
    if (!res.ok || asset.error || !asset.secure_url) {
      throw new Error(asset.error?.message || 'ছবি আপলোড সম্পন্ন হয়নি');
    }

    // Confirm in DB
    await apiClient<ApiResponse<{ id: string }>>('/uploads/confirm', {
      method: 'POST',
      body: JSON.stringify({
        publicId: asset.public_id,
        secureUrl: asset.secure_url,
        resourceType: 'image',
        format: asset.format || 'jpg',
        bytes: asset.bytes || file.size || 100,
        width: asset.width || 800,
        height: asset.height || 600,
      }),
    });

    return asset.secure_url;
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  // Save Profile & Account Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let finalAvatarUrl = profile?.image || undefined;
      let finalCoverUrl = profile?.coverImage || undefined;

      // 1. Upload Avatar if new file chosen
      if (avatarFile) {
        setSaveStatusText('প্রোফাইল ছবি আপলোড হচ্ছে...');
        finalAvatarUrl = await uploadImage(avatarFile);
      }

      // 2. Upload Cover if new file chosen
      if (coverFile) {
        setSaveStatusText('কভার ছবি আপলোড হচ্ছে...');
        finalCoverUrl = await uploadImage(coverFile);
      }

      // 3. Update Profile via API
      setSaveStatusText('তথ্য আপডেট হচ্ছে...');
      const res = await socialService.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        image: finalAvatarUrl,
        coverImage: finalCoverUrl,
      });

      if (res.data) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name: res.data?.name || prev.name,
                image: res.data?.image !== undefined ? res.data.image : prev.image,
                bio: res.data?.bio !== undefined ? res.data.bio : prev.bio,
                phone: res.data?.phone ?? prev.phone,
                email: email.trim(),
                coverImage: finalCoverUrl || prev.coverImage,
              }
            : null,
        );
        setAvatarFile(null);
        setCoverFile(null);
        setSuccessMsg('আপনার সকল তথ্য সফলভাবে আপডেট করা হয়েছে!');
        setTimeout(() => setSuccessMsg(null), 5000);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'তথ্য আপডেট করা সম্ভব হয়নি';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
      setSaveStatusText('সংরক্ষণ হচ্ছে...');
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg(null);
    setPassSuccessMsg(null);

    if (!currentPassword) {
      setPassErrorMsg('বর্তমান পাসওয়ার্ড প্রদান করুন');
      return;
    }

    if (newPassword.length < 8) {
      setPassErrorMsg('নতুন পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না');
      return;
    }

    setChangingPass(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (res?.error) {
        throw new Error(res.error.message || 'বর্তমান পাসওয়ার্ডটি সঠিক নয়');
      }

      setPassSuccessMsg('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccessMsg(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে';
      setPassErrorMsg(msg);
    } finally {
      setChangingPass(false);
    }
  };

  if (sessionPending || loadingProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-emerald" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          আপনার অ্যাকাউন্ট ও সেটিংস লোড হচ্ছে...
        </p>
      </div>
    );
  }

  const currentUser: DashboardUser | null = profile
    ? {
        id: profile.id,
        name: profile.name,
        email: profile.email || session?.user?.email || null,
        phone: profile.phone || (session?.user as { phone?: string })?.phone || null,
        image: profile.image || session?.user?.image || null,
        coverImage: profile.coverImage || null,
        bio: profile.bio || null,
        role: profile.role || (session?.user as { role?: string })?.role || 'USER',
        createdAt: profile.createdAt || session?.user?.createdAt || null,
      }
    : session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          phone: (session.user as { phone?: string })?.phone || null,
          image: session.user.image,
          coverImage: null,
          bio: null,
          role: (session.user as { role?: string })?.role || 'USER',
          createdAt: session.user.createdAt,
        }
      : null;

  const isOrgMember =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.email === 'itskausarprodhan@gmail.com' ||
    membershipData?.membership?.status === 'ACTIVE' ||
    membershipData?.membership?.status === 'APPROVED_PAYMENT_PENDING';

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="pb-3.5 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm shrink-0 hover:scale-105 transition-transform border border-emerald-500/20 bg-emerald-50 dark:bg-white/5 p-0.5"
            title="হোমে ফিরে যান"
          >
            <Image
              src="/logos/logo.png"
              alt="আমরা মোহাম্মদপুরী লোগো"
              width={40}
              height={40}
              className="w-full h-full object-contain rounded-xl"
              priority
            />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              অ্যাকাউন্ট সেটিংস ও ড্যাশবোর্ড
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              আমরা মোহাম্মদপুরী • আপনার তথ্যাদি নিয়ন্ত্রণ ও আপডেট করুন
            </p>
          </div>
        </div>
      </div>

      {/* Hero Cover & Avatar Preview Box */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-soft bg-white dark:bg-brand-charcoal-dark">
        {/* Cover Photo */}
        <div className="relative w-full h-36 sm:h-48 bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 overflow-hidden group">
          {coverPreview ? (
            <Image
              src={coverPreview}
              alt="Cover preview"
              fill
              className="object-cover transition-transform group-hover:scale-102"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs font-semibold">
              কোনো কভার ছবি নির্বাচন করা হয়নি
            </div>
          )}

          {/* Cover Edit Button */}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
            title="কভার ছবি পরিবর্তন করুন"
          >
            <Camera className="w-3.5 h-3.5 text-brand-mint" />
            <span>কভার ছবি পরিবর্তন</span>
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverSelect}
          />
        </div>

        {/* Avatar & Summary Info Bar */}
        <div className="px-5 pb-5 pt-0 sm:px-8 sm:pb-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 text-center sm:text-left">
            {/* Avatar with Camera badge */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 dark:bg-brand-charcoal ring-4 ring-white dark:ring-brand-charcoal-dark shadow-lg relative">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={currentUser?.name || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-brand-emerald text-3xl bg-emerald-50 dark:bg-emerald-950/40">
                    {currentUser?.name?.charAt(0) || 'ম'}
                  </div>
                )}
              </div>

              {/* Avatar Edit Button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md transition-transform hover:scale-110 cursor-pointer"
                title="প্রোফাইল ছবি পরিবর্তন করুন"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            {/* Name & Role */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentUser?.name || 'মোহাম্মদপুরী সদস্য'}
                </h2>
                {isOrgMember && <VerifiedBadge size="md" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {currentUser?.email || 'ইমেইল নেই'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-brand-emerald dark:text-brand-mint border border-emerald-500/20">
                  {currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'itskausarprodhan@gmail.com'
                    ? 'সিস্টেম অ্যাডমিন'
                    : currentUser?.role === 'ADMIN'
                    ? 'অ্যাডমিন'
                    : isOrgMember
                    ? 'সংগঠনের সক্রিয় সদস্য'
                    : 'সাধারণ ইউজার'}
                </span>
                <span className="text-[11px] text-slate-400">
                  • আমরা মোহাম্মদপুরী পরিবার
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 transition-colors cursor-pointer"
          >
            {loggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl overflow-x-auto no-scrollbar border border-slate-200/60 dark:border-white/5">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>প্রোফাইল তথ্য</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'account'
              ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>যোগাযোগ ও অ্যাকাউন্ট</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>পাসওয়ার্ড পরিবর্তন</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>সারসংক্ষেপ</span>
        </button>
      </div>

      {/* Global Toast Alert Feedback */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 text-xs sm:text-sm font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-brand-emerald shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-500/20 text-xs sm:text-sm font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: PROFILE INFO */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white dark:bg-brand-charcoal-dark p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              ব্যক্তিগত ও প্রোফাইল তথ্য
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার নাম, বায়ো এবং প্রোফাইল ভিজ্যুয়াল আপডেট করুন
            </p>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                পুরো নাম <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="আপনার পুরো নাম লিখুন"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
                />
              </div>
            </div>

            {/* Bio / About */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                সংক্ষিপ্ত বায়ো / পরিচয়
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="আপনার সম্পর্কে বা মোহাম্মদপুরে আপনার এলাকা সম্পর্কে কিছু লিখুন..."
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald resize-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                অন্যান্য সদস্যরা আপনার প্রোফাইলে এই বিবরণ দেখতে পাবেন।
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emerald-hover text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-glow disabled:opacity-60 transition-all cursor-pointer active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{saveStatusText}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>পরিবর্তন সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: ACCOUNT & CONTACT INFO */}
      {activeTab === 'account' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white dark:bg-brand-charcoal-dark p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              যোগাযোগ ও লগইন তথ্য
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার ইমেইল ঠিকানা এবং মোবাইল নম্বর আপডেট করুন
            </p>
          </div>

          <div className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-emerald" />
                <span>ইমেইল ঠিকানা</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@mail.com"
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
              />
              <p className="text-[11px] text-slate-400">
                এই ইমেইলটি আপনার অ্যাকাউন্টে লগইন এবং পাসওয়ার্ড পুনরুদ্ধারে ব্যবহৃত হয়।
              </p>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-emerald" />
                <span>মোবাইল নম্বর</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801835234869 বা 01835234869"
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
              />
              <p className="text-[11px] text-slate-400">
                মোহাম্মদপুরী কমিউনিটিতে সঠিক যাচাইকরণের জন্য আপনার নিজস্ব নম্বর দিন।
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emerald-hover text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-glow disabled:opacity-60 transition-all cursor-pointer active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{saveStatusText}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SECURITY & PASSWORD CHANGE */}
      {activeTab === 'security' && (
        <form
          onSubmit={handleChangePassword}
          className="bg-white dark:bg-brand-charcoal-dark p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              পাসওয়ার্ড পরিবর্তন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার অ্যাকাউন্টের সুরক্ষার জন্য নিয়মিত পাসওয়ার্ড পরিবর্তন করুন
            </p>
          </div>

          {passSuccessMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 text-xs sm:text-sm font-semibold">
              <Check className="w-4 h-4 text-brand-emerald shrink-0" />
              <span>{passSuccessMsg}</span>
            </div>
          )}

          {passErrorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-500/20 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{passErrorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                বর্তমান পাসওয়ার্ড <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="বর্তমান পাসওয়ার্ড দিন"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                নতুন পাসওয়ার্ড <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="কমপক্ষে ৮ অক্ষরের শক্তিশালী পাসওয়ার্ড"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                নতুন পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="পুনরায় নতুন পাসওয়ার্ড দিন"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={changingPass}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emerald-hover text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-glow disabled:opacity-60 transition-all cursor-pointer active:scale-95"
            >
              {changingPass ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>পাসওয়ার্ড আপডেট হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>পাসওয়ার্ড আপডেট করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: ACCOUNT OVERVIEW & SECURITY */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-brand-charcoal-dark p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              অ্যাকাউন্ট ওভারভিউ ও নিরাপত্তা স্ট্যাটাস
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার অ্যাকাউন্টের মেম্বারশিপ ও নিরাপত্তা পরিসংখ্যান
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-brand-emerald" />
                <span>অ্যাকাউন্ট রোল</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser?.role === 'SUPER_ADMIN' || currentUser?.email === 'itskausarprodhan@gmail.com'
                  ? 'সিস্টেম অ্যাডমিন'
                  : currentUser?.role === 'ADMIN'
                  ? 'অ্যাডমিনিস্ট্রেটর'
                  : isOrgMember
                  ? 'সংগঠনের সক্রিয় সদস্য'
                  : 'সাধারণ ইউজার'}
              </p>
              <p className="text-[11px] text-slate-400">আমরা মোহাম্মদপুরী ভেরিফাইড ইউজার</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Calendar className="w-4 h-4 text-brand-emerald" />
                <span>যোগদানের তারিখ</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser?.createdAt
                  ? new Date(currentUser.createdAt).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
              <p className="text-[11px] text-slate-400">কমিউনিটিতে সক্রিয় অংশগ্রহনকারী</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span>সেশন প্রোটোকল</span>
              </div>
              <p className="text-sm font-bold text-emerald-600 dark:text-brand-mint">
                সুরক্ষিত (Better Auth 2.0)
              </p>
              <p className="text-[11px] text-slate-400">এনক্রিপ্টেড সেশন সক্রিয় রয়েছে</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <FileText className="w-4 h-4 text-brand-emerald" />
                <span>মোট কার্যক্রম</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {profile?.postsCount || 0} টি পোস্ট • {profile?.friendsCount || 0} জন বন্ধু
              </p>
              <p className="text-[11px] text-slate-400">কমিউনিটি ইন্টারেকশন</p>
            </div>

            {membershipData?.membership && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-brand-emerald dark:text-emerald-400 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>সংগঠনিক মাসিক চাঁদা (Monthly Contribution)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUpdateContribModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>চাঁদা পরিবর্তন করুন</span>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      ৳{Number(membershipData.membership.monthlyContribution || 100).toLocaleString('bn-BD')} / মাস
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      সদস্য নং: {membershipData.membership.memberNumber || 'প্রক্রিয়াধীন'}
                    </p>
                  </div>
                  <Link
                    href="/organization/member"
                    className="text-xs font-semibold text-brand-emerald hover:underline"
                  >
                    সদস্য ড্যাশবোর্ড দেখুন →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href={`/profile/${currentUser?.id || 'me'}`}
              className="text-xs font-semibold text-brand-emerald hover:underline flex items-center gap-1"
            >
              <span>পাবলিক প্রোফাইল প্রিভিউ দেখুন</span> →
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/40 transition-colors cursor-pointer"
            >
              {loggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>লগআউট করুন</span>
            </button>
          </div>
        </div>
      )}
      {membershipData?.membership && (
        <UpdateContributionModal
          isOpen={updateContribModalOpen}
          onClose={() => setUpdateContribModalOpen(false)}
          currentAmount={membershipData.membership.monthlyContribution || 100}
        />
      )}
    </div>
  );
}
