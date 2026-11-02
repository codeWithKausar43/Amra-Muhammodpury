import { PrismaClient } from './generated/client/index.js';
import { auth } from '../src/config/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Starting comprehensive database seeding for আমরা মোহাম্মদপুরী...');

  const authCtx = await auth.$context;
  const passwordHash = await authCtx.password.hash('Password123!');

  // --------------------------------------------------------------------------
  // 1. Seed Official Organizational Designations
  // --------------------------------------------------------------------------
  const defaultDesignations = [
    { code: 'PRESIDENT', name: 'সভাপতি', rank: 1 },
    { code: 'VICE_PRESIDENT', name: 'সহ-সভাপতি', rank: 2 },
    { code: 'GENERAL_SECRETARY', name: 'সাধারণ সম্পাদক', rank: 3 },
    { code: 'JOINT_SECRETARY', name: 'যুগ্ম সাধারণ সম্পাদক', rank: 4 },
    { code: 'ORGANIZING_SECRETARY', name: 'সাংগঠনিক সম্পাদক', rank: 5 },
    { code: 'TREASURER', name: 'কোষাধ্যক্ষ', rank: 6 },
    { code: 'PUBLICITY_SECRETARY', name: 'প্রচার ও প্রকাশনা সম্পাদক', rank: 7 },
    { code: 'EXECUTIVE_MEMBER', name: 'কার্যনির্বাহী সদস্য', rank: 8 },
  ];

  const designationsMap = new Map<string, any>();
  for (const des of defaultDesignations) {
    const record = await prisma.orgDesignation.upsert({
      where: { code: des.code },
      update: { name: des.name, rank: des.rank },
      create: { code: des.code, name: des.name, rank: des.rank },
    });
    designationsMap.set(des.code, record);
  }
  console.info('✅ Seeded 8 official designations.');

  // --------------------------------------------------------------------------
  // 2. Seed Multi-Fund Treasury Accounts
  // --------------------------------------------------------------------------
  const defaultFunds = [
    {
      code: 'GENERAL',
      name: 'সাধারণ পরিচালন তহবিল',
      description: 'সংগঠনের সার্বিক পরিচালন, অফিস ভাড়া ও প্রশাসনিক কার্যক্রমের প্রধান তহবিল।',
      balance: 150000,
    },
    {
      code: 'EDUCATION',
      name: 'শিক্ষা ও মেধা কল্যাণ তহবিল',
      description: 'মুহাম্মদপুরের অসচ্ছল ও মেধাবী শিক্ষার্থীদের শিক্ষা বৃত্তি ও সহায়তা।',
      balance: 65000,
    },
    {
      code: 'MEDICAL',
      name: 'চিকিৎসা ও স্বাস্থ্যসেবা তহবিল',
      description: 'জরুরি চিকিৎসাসেবা, রক্তদান সহায়তা ও দুস্থদের চিকিৎসা অনুদান।',
      balance: 80000,
    },
    {
      code: 'EMERGENCY',
      name: 'জরুরি ত্রাণ ও দুর্যোগ কল্যাণ তহবিল',
      description: 'বন্যা, শীতবস্ত্র বিতরণ ও আকস্মিক দুর্যোগ ব্যবস্থাপনা রিজার্ভ ফান্ড।',
      balance: 45000,
    },
  ];

  const fundsMap = new Map<string, any>();
  for (const fund of defaultFunds) {
    const record = await prisma.orgFund.upsert({
      where: { code: fund.code },
      update: {
        name: fund.name,
        description: fund.description,
        balance: fund.balance,
      },
      create: {
        code: fund.code,
        name: fund.name,
        description: fund.description,
        balance: fund.balance,
      },
    });
    fundsMap.set(fund.code, record);
  }
  console.info('✅ Seeded 4 transparent multi-fund treasury accounts.');

  // --------------------------------------------------------------------------
  // 3. Seed Realistic Test Users (All passwords: Password123!)
  // --------------------------------------------------------------------------
  const seedUsers = [
    {
      email: 'kausardev90@gmail.com',
      name: 'Md Kausar',
      role: 'ADMIN',
      phone: '01711000000',
      bio: 'সফটওয়্যার স্থপতি ও প্রতিষ্ঠাতা সভাপতি, আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন পরিষদ।',
      image: 'https://res.cloudinary.com/rim6yblt/image/upload/v1793589750/amra-muhammadpuri/profiles/si06kruhb8tpfsyky1ed.png',
      coverImage: 'https://res.cloudinary.com/rim6yblt/image/upload/v1793589754/amra-muhammadpuri/profiles/of4semfr7yvwqn8buku2.png',
      orgRole: 'PRESIDENT',
      memberNumber: 'AMP-2026-0001',
      profession: 'সফটওয়্যার ইঞ্জিনিয়ার ও সমাজকর্মী',
      monthlyContribution: 500,
      status: 'ACTIVE',
    },
    {
      email: 'admin@amra-muhammadpuri.org',
      name: 'মোঃ কাউসার আহমেদ',
      role: 'ADMIN',
      phone: '01711000001',
      bio: 'সফটওয়্যার ইঞ্জিনিয়ার ও সমাজকর্মী। মুহাম্মদপুরের টেকসই উন্নয়নে নিবেদিত।',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
      coverImage: null,
      orgRole: 'PRESIDENT',
      memberNumber: 'AMP-2026-0000',
      profession: 'সফটওয়্যার স্থপতি',
      monthlyContribution: 500,
      status: 'ACTIVE',
    },
    {
      email: 'treasurer@amra-muhammadpuri.org',
      name: 'ইঞ্জি. সামিউল ইসলাম',
      role: 'USER',
      phone: '01711000002',
      bio: 'তাজমহল রোড নিবাসী, কোষাধ্যক্ষ ও চার্টার্ড ফাইন্যান্স প্রফেশনাল।',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      coverImage: null,
      orgRole: 'TREASURER',
      memberNumber: 'AMP-2026-0002',
      profession: 'চার্টার্ড অ্যাকাউন্ট্যান্ট',
      monthlyContribution: 300,
      status: 'ACTIVE',
    },
    {
      email: 'gs@amra-muhammadpuri.org',
      name: 'তানভীর হোসেন',
      role: 'USER',
      phone: '01711000003',
      bio: 'বাবর রোড নাগরিক ফোরামের সক্রিয় কর্মী ও সাধারণ সম্পাদক।',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      coverImage: null,
      orgRole: 'GENERAL_SECRETARY',
      memberNumber: 'AMP-2026-0003',
      profession: 'সমাজসেবক ও শিক্ষক',
      monthlyContribution: 250,
      status: 'ACTIVE',
    },
    {
      email: 'member@amra-muhammadpuri.org',
      name: 'সালমান ফারসি',
      role: 'USER',
      phone: '01711000004',
      bio: 'সলিমুল্লাহ রোড নিবাসী, নিয়মিত সক্রিয় দাতা ও সংগঠক।',
      image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop',
      coverImage: null,
      orgRole: 'MEMBER',
      memberNumber: 'AMP-2026-0004',
      profession: 'ব্যবসায়ী',
      monthlyContribution: 100,
      status: 'ACTIVE',
    },
    {
      email: 'applicant@amra-muhammadpuri.org',
      name: 'ফারহানা রহমান',
      role: 'USER',
      phone: '01711000005',
      bio: 'নুরজাহান রোড নিবাসী, শিক্ষক। সংগঠনে যোগদানে আগ্রহী।',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
      coverImage: null,
      orgRole: 'MEMBER',
      memberNumber: null,
      profession: 'সহকারী প্রধান শিক্ষক',
      monthlyContribution: 150,
      status: 'PENDING',
    },
    {
      email: 'user@amra-muhammadpuri.org',
      name: 'আরিফুর রহমান',
      role: 'USER',
      phone: '01711000006',
      bio: 'কাটাসুর নিবাসী, সামাজিক মাধ্যমের নিয়মিত সাধারণ ব্যবহারকারী।',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
      coverImage: null,
      orgRole: null,
      memberNumber: null,
      profession: 'গ্রাফিক ডিজাইনার',
      monthlyContribution: null,
      status: null,
    },
  ];

  const createdUsers = new Map<string, any>();

  for (const u of seedUsers) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          phone: u.phone,
          bio: u.bio,
          image: u.image,
          coverImage: u.coverImage,
          emailVerified: true,
        },
      });
      console.info(`👤 Created user: ${u.name} (${u.email})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: u.role,
          bio: u.bio,
          image: u.image || user.image,
          coverImage: u.coverImage || user.coverImage,
        },
      });
      console.info(`🔄 Updated user & admin role: ${u.name} (${u.email}) -> Role: ${u.role}`);
    }

    // Ensure Better Auth credential account is in sync with valid scrypt Password123! hash
    const existingAccount = await prisma.account.findFirst({
      where: { userId: user.id, providerId: 'credential' },
    });
    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          accountId: user.id,
          password: passwordHash,
        },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: 'credential',
          password: passwordHash,
        },
      });
    }
    createdUsers.set(u.email, user);

    // Avoid memberNumber collision by temporary release if needed
    if (u.status === 'ACTIVE' && u.memberNumber) {
      await prisma.orgMembership.updateMany({
        where: { memberNumber: u.memberNumber, NOT: { userId: user.id } },
        data: { memberNumber: null },
      });

      await prisma.orgMembership.upsert({
        where: { userId: user.id },
        update: {
          memberNumber: u.memberNumber,
          orgRole: u.orgRole || 'MEMBER',
          status: 'ACTIVE',
          profession: u.profession,
          monthlyContribution: u.monthlyContribution || 100,
          joinedAt: new Date('2026-01-01'),
        },
        create: {
          userId: user.id,
          memberNumber: u.memberNumber,
          orgRole: u.orgRole || 'MEMBER',
          status: 'ACTIVE',
          profession: u.profession,
          monthlyContribution: u.monthlyContribution || 100,
          joinedAt: new Date('2026-01-01'),
        },
      });

      // Contribution Agreement
      await prisma.contributionAgreement.upsert({
        where: { id: `agreement-${u.memberNumber}` },
        update: { monthlyAmount: u.monthlyContribution || 100, isCurrent: true },
        create: {
          id: `agreement-${u.memberNumber}`,
          userId: user.id,
          monthlyAmount: u.monthlyContribution || 100,
          effectiveFrom: new Date('2026-01-01'),
          isCurrent: true,
        },
      });
    } else if (u.status === 'PENDING') {
      const existingApp = await prisma.orgApplication.findFirst({ where: { userId: user.id } });
      if (!existingApp) {
        await prisma.orgApplication.create({
          data: {
            userId: user.id,
            fullName: u.name,
            phone: u.phone,
            profession: u.profession || 'শিক্ষক',
            monthlyContribution: u.monthlyContribution || 100,
            agreedToMonthlyFee: true,
            status: 'PENDING',
          },
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. Seed Contribution Payment History (Monthly Ledger)
  // --------------------------------------------------------------------------
  const activeMembers = [
    'kausardev90@gmail.com',
    'admin@amra-muhammadpuri.org',
    'treasurer@amra-muhammadpuri.org',
    'member@amra-muhammadpuri.org',
  ];
  let receiptCounter = 1001;

  for (const email of activeMembers) {
    const user = createdUsers.get(email);
    if (!user) continue;

    // Seed Jan, Feb, Mar 2026 payments
    for (let month = 1; month <= 3; month++) {
      const existingPayment = await prisma.contributionPayment.findFirst({
        where: { userId: user.id, periodMonth: month, periodYear: 2026 },
      });

      if (!existingPayment) {
        const amt = (email === 'admin@amra-muhammadpuri.org' || email === 'kausardev90@gmail.com') ? 500 : email === 'treasurer@amra-muhammadpuri.org' ? 300 : 100;
        await prisma.contributionPayment.create({
          data: {
            userId: user.id,
            amount: amt,
            periodMonth: month,
            periodYear: 2026,
            paymentMethod: month === 1 ? 'BKASH' : month === 2 ? 'NAGAD' : 'BANK',
            trxId: `TRX20260${month}${user.id.slice(0, 4)}`,
            receiptNumber: `REC-2026-${user.id.slice(0, 4).toUpperCase()}-00${month}`,
            status: 'VERIFIED',
            paidAt: new Date(2026, month - 1, 5),
          },
        });
      }
    }
  }
  console.info('✅ Seeded 12-month contribution payments and ledger history.');

  // --------------------------------------------------------------------------
  // 5. Seed Ledger Transactions
  // --------------------------------------------------------------------------
  const adminUser = createdUsers.get('kausardev90@gmail.com') || createdUsers.get('admin@amra-muhammadpuri.org');
  const generalFund = fundsMap.get('GENERAL');
  if (adminUser && generalFund) {
    const existingTrx = await prisma.fundTransaction.findFirst({ where: { fundId: generalFund.id } });
    if (!existingTrx) {
      await prisma.fundTransaction.createMany({
        data: [
          {
            fundId: generalFund.id,
            type: 'INCOME',
            amount: 50000,
            title: 'সংগঠনের প্রাতিষ্ঠানিক প্রারম্ভিক নাগরিক অনুদান',
            category: 'DONATION',
            performedBy: adminUser.id,
            createdAt: new Date('2026-01-10'),
          },
          {
            fundId: generalFund.id,
            type: 'EXPENSE',
            amount: 12000,
            title: 'তাজমহল রোড প্রধান কার্যালয় জানুয়ারি মাসের দপ্তর ভাড়া',
            category: 'OFFICE_RENT',
            performedBy: adminUser.id,
            createdAt: new Date('2026-01-15'),
          },
          {
            fundId: fundsMap.get('EDUCATION')?.id || generalFund.id,
            type: 'EXPENSE',
            amount: 15000,
            title: 'মুহাম্মদপুর সরকারি উচ্চ বিদ্যালয়ের ৩ জন অসচ্ছল শিক্ষার্থীকে শিক্ষা অনুদান',
            category: 'EDUCATION_GRANT',
            performedBy: adminUser.id,
            createdAt: new Date('2026-02-10'),
          },
        ],
      });
      console.info('✅ Seeded transparent ledger transactions.');
    }
  }

  // --------------------------------------------------------------------------
  // 6. Seed Social Media Posts with Reactions & Comments
  // --------------------------------------------------------------------------
  const existingPosts = await prisma.post.findMany({ take: 1 });
  if (existingPosts.length === 0 && adminUser) {
    const post1 = await prisma.post.create({
      data: {
        authorId: adminUser.id,
        content: 'তাজমহল রোড পার্ক ও সংলগ্ন সড়ক ড্রেনেজ সংস্কার কাজ আজ সকাল থেকে শুরু হয়েছে। কাজের সময় সাময়িক অসুবিধা হতে পারে, এলাকাবাসীর আন্তরিক সহযোগিতা কাম্য।',
        category: 'MY_BLOCK',
        blockBadge: 'তাজমহল রোড',
        location: 'তাজমহল রোড পার্ক সংলগ্ন, মুহাম্মদপুর',
        privacy: 'PUBLIC',
      },
    });

    const treasurerUser = createdUsers.get('treasurer@amra-muhammadpuri.org');
    if (treasurerUser) {
      const post2 = await prisma.post.create({
        data: {
          authorId: treasurerUser.id,
          content: 'বাবর রোড ও সলিমুল্লাহ রোডের সড়ক বাতিগুলোর সংস্কার সম্পন্ন হয়েছে। এখন পুরো লেন উজ্জ্বল ও নিরাপদ। কোনো সড়কবাতি নষ্ট থাকলে নিচে কমেন্টে জানান।',
          category: 'GENERAL',
          blockBadge: 'বাবর রোড',
          location: 'বাবর রোড, মুহাম্মদপুর',
          privacy: 'PUBLIC',
        },
      });

      const memberUser = createdUsers.get('member@amra-muhammadpuri.org');
      if (memberUser) {
        await prisma.post.create({
          data: {
            authorId: memberUser.id,
            content: 'জরুরি ট্রাফিক আপডেট: বসিলা ব্রিজে তীব্র যানজট। রামচন্দ্রপুর ও তিন রাস্তার মোড়ের যাত্রীদের বিকল্প হিসেবে কাটাসুর সড়ক ব্যবহারের অনুরোধ করা হচ্ছে।',
            category: 'EMERGENCY',
            isEmergency: true,
            blockBadge: 'বসিলা',
            location: 'বসিলা ব্রিজ গোলচত্বর',
            privacy: 'PUBLIC',
          },
        });

        // Add Likes & Comments
        await prisma.postLike.create({
          data: { postId: post1.id, userId: memberUser.id, type: 'LIKE' },
        });
        await prisma.postLike.create({
          data: { postId: post2.id, userId: adminUser.id, type: 'LIKE' },
        });

        await prisma.comment.create({
          data: {
            postId: post1.id,
            authorId: memberUser.id,
            content: 'চমৎকার উদ্যোগ! ড্রেন পরিষ্কার থাকায় এবার বর্ষায় পানি জমবে না আশা করি।',
          },
        });
      }
    }
    console.info('✅ Seeded realistic community feed posts, likes and comments.');
  }

  // --------------------------------------------------------------------------
  // 7. Seed Friendships & Requests
  // --------------------------------------------------------------------------
  const userAdmin = createdUsers.get('kausardev90@gmail.com') || createdUsers.get('admin@amra-muhammadpuri.org');
  const userTreasurer = createdUsers.get('treasurer@amra-muhammadpuri.org');
  const userMember = createdUsers.get('member@amra-muhammadpuri.org');
  const userGeneral = createdUsers.get('user@amra-muhammadpuri.org');

  if (userAdmin && userTreasurer) {
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId: userAdmin.id, friendId: userTreasurer.id } },
      update: {},
      create: { userId: userAdmin.id, friendId: userTreasurer.id },
    });
  }

  if (userMember && userGeneral) {
    // Pending friend request for test account
    await prisma.friendRequest.upsert({
      where: { senderId_receiverId: { senderId: userMember.id, receiverId: userGeneral.id } },
      update: { status: 'PENDING' },
      create: { senderId: userMember.id, receiverId: userGeneral.id, status: 'PENDING' },
    });
    console.info('✅ Seeded friendships and incoming friend requests.');
  }

  // --------------------------------------------------------------------------
  // 8. Seed Community Groups
  // --------------------------------------------------------------------------
  if (userAdmin) {
    const existingGroup = await prisma.group.findFirst();
    if (!existingGroup) {
      const group1 = await prisma.group.create({
        data: {
          name: 'তাজমহল রোড নাগরিক ফোরাম',
          description: 'তাজমহল রোডের বাসিন্দা, দোকান মালিক ও শুভানুধ্যায়ীদের পারস্পরিক উন্নয়ন ও সহায়তার উন্মুক্ত ফোরাম।',
          creatorId: userAdmin.id,
          privacy: 'PUBLIC',
          rules: '১. এলাকার উন্নয়নমূলক গঠনমূলক আলোচনা করুন।\n২. কোনো অসৌজন্যমূলক পোস্ট নিষিদ্ধ।',
        },
      });

      await prisma.groupMember.create({
        data: { groupId: group1.id, userId: userAdmin.id, role: 'OWNER' },
      });
      if (userTreasurer) {
        await prisma.groupMember.create({
          data: { groupId: group1.id, userId: userTreasurer.id, role: 'MEMBER' },
        });
      }
      console.info('✅ Seeded neighborhood community group.');
    }
  }

  // --------------------------------------------------------------------------
  // 9. Seed Organization Committees
  // --------------------------------------------------------------------------
  const existingCommittee = await prisma.orgCommittee.findFirst();
  if (!existingCommittee) {
    const committee = await prisma.orgCommittee.create({
      data: {
        name: '২০২৬-২০২৮ কেন্দ্রীয় কার্যনির্বাহী পরিষদ',
        description: 'আমরা মোহাম্মদপুরী সংগঠনের নির্বাচিত ও অনুমোদিত কেন্দ্রীয় কার্যনির্বাহী কমিটি।',
        startDate: new Date('2026-01-01'),
        isActive: true,
      },
    });

    if (userAdmin && userTreasurer) {
      await prisma.orgCommitteeMember.createMany({
        data: [
          {
            committeeId: committee.id,
            userId: userAdmin.id,
            designationId: designationsMap.get('PRESIDENT').id,
            customTitle: 'কেন্দ্রীয় সভাপতি',
          },
          {
            committeeId: committee.id,
            userId: userTreasurer.id,
            designationId: designationsMap.get('TREASURER').id,
            customTitle: 'কোষাধ্যক্ষ',
          },
        ],
      });
      console.info('✅ Seeded executive committee and member designations.');
    }
  }

  // --------------------------------------------------------------------------
  // 10. Seed Official Notices & Area Projects
  // --------------------------------------------------------------------------
  if (userAdmin) {
    const existingNotice = await prisma.orgNotice.findFirst();
    if (!existingNotice) {
      await prisma.orgNotice.createMany({
        data: [
          {
            title: '২০২৬ কার্যনির্বাহী পরিষদের ১ম ত্রৈমাসিক সাধারণ সভা',
            content: 'আগামী শুক্রবার বিকাল ৫টায় তাজমহল রোড প্রধান কার্যালয়ে সকল সম্মানিত সদস্যকে উপস্থিত থাকার অনুরোধ করা যাচ্ছে। আলোচ্যসূচি: বাজেট পর্যালোচনা ও নির্বাচন প্রস্তুতি।',
            priority: 'URGENT',
            isPinned: true,
            isPublic: false,
            publishedBy: userAdmin.id,
          },
          {
            title: 'মুহাম্মদপুর সড়ক পরিচ্ছন্নতা ও বৃক্ষরোপণ কর্মসূচি',
            content: 'আগামী শনিবার সকাল ৮টা থেকে সলিমুল্লাহ রোড ও বাবর রোডে ২০০টি ফলজ ও ওষধি গাছ রোপণ করা হবে। সর্বস্তরের নাগরিকদের স্বতঃস্ফূর্ত অংশগ্রহণ কামনা করছি।',
            priority: 'NORMAL',
            isPinned: false,
            isPublic: true,
            publishedBy: userAdmin.id,
          },
        ],
      });
    }

    const existingProject = await prisma.orgProject.findFirst();
    if (!existingProject) {
      await prisma.orgProject.createMany({
        data: [
          {
            title: 'মুহাম্মদপুর ডিজিটাল সিসিটিভি ও নিরাপত্তা নেটওয়ার্ক',
            description: 'মুহাম্মদপুরের প্রধান সড়ক ও গলির প্রবেশমুখে উচ্চ ক্ষমতাসম্পন্ন নাইট-ভিশন সিসিটিভি স্থাপন ও কেন্দ্রীয় মনিটরিং ব্যবস্থা।',
            budget: 500000,
            spent: 375000,
            progress: 75,
            status: 'ACTIVE',
            isPublic: true,
          },
          {
            title: 'তাজমহল ও বাবর রোড সবুজায়ন প্রকল্প',
            description: 'ফুটপাথ পরিচ্ছন্নকরণ, ড্রেন স্লাব স্থাপন ও সড়ক ডিভাইডারে ফুলের বাগান তৈরি।',
            budget: 120000,
            spent: 48000,
            progress: 40,
            status: 'ACTIVE',
            isPublic: true,
          },
        ],
      });
      console.info('✅ Seeded official notices and community projects.');
    }
  }

  // --------------------------------------------------------------------------
  // 11. Seed Live Digital Election with Candidates (Ready for Instant Secret Voting!)
  // --------------------------------------------------------------------------
  const existingElection = await prisma.election.findFirst();
  if (!existingElection && userAdmin && userTreasurer) {
    const election = await prisma.election.create({
      data: {
        title: 'আমরা মোহাম্মদপুরী কার্যনির্বাহী পরিষদ নির্বাচন ২০২৬',
        description: 'সক্রিয় প্রাতিষ্ঠানিক সদস্যদের প্রত্যক্ষ গোপন ব্যালট ভোটে ২০২৬-২০২৮ মেয়াদের নেতৃত্ব নির্বাচন।',
        nominationStartDate: new Date(Date.now() - 86400000 * 5),
        nominationEndDate: new Date(Date.now() - 86400000 * 2),
        votingStartDate: new Date(Date.now() - 86400000),
        votingEndDate: new Date(Date.now() + 86400000 * 5),
        status: 'VOTING_ACTIVE',
        rules: '১. প্রতিটি পদের বিপরীতে কেবল ১ জন প্রার্থীকে ভোট দেওয়া যাবে।\n২. ভোট সম্পূর্ণ গোপন এবং আপনার ব্যালট ক্রিপ্টোগ্রাফিকভাবে পৃথক।\n৩. ভোট সমাপ্তির সাথে সাথে ডিজিটাল যাচাই রশিদ প্রদান করা হবে।',
      },
    });

    const presidentDesig = designationsMap.get('PRESIDENT');
    const gsDesig = designationsMap.get('GENERAL_SECRETARY');
    const treasurerDesig = designationsMap.get('TREASURER');

    if (presidentDesig && gsDesig && treasurerDesig) {
      // 1. Position: President
      const posPres = await prisma.electionPosition.create({
        data: {
          electionId: election.id,
          designationId: presidentDesig.id,
          maxWinners: 1,
        },
      });

      // 2. Position: General Secretary
      const posGs = await prisma.electionPosition.create({
        data: {
          electionId: election.id,
          designationId: gsDesig.id,
          maxWinners: 1,
        },
      });

      // 3. Position: Treasurer
      const posTreas = await prisma.electionPosition.create({
        data: {
          electionId: election.id,
          designationId: treasurerDesig.id,
          maxWinners: 1,
        },
      });

      // Candidate Nominations
      await prisma.electionNomination.createMany({
        data: [
          {
            electionId: election.id,
            positionId: posPres.id,
            userId: userAdmin.id,
            candidateName: userAdmin.name || 'Md Kausar',
            candidatePhoto: userAdmin.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
            experience: 'প্রতিষ্ঠাতা আহ্বায়ক ও সমাজকর্মী, তাজমহল রোড',
            manifesto: 'মুহাম্মদপুরকে একটি নিরাপদ, পরিচ্ছন্ন, আলোকোজ্জ্বল ও প্রযুক্তিনির্ভর আধুনিক আদর্শ আবাসিক এলাকায় রূপান্তর করাই আমার অঙ্গীকার।',
            status: 'APPROVED',
          },
          {
            electionId: election.id,
            positionId: posPres.id,
            userId: userTreasurer.id,
            candidateName: 'ডাঃ রফিকুল ইসলাম',
            candidatePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
            experience: 'সিনিয়র কনসালটেন্ট ও সাবেক সমাজসেবা সম্পাদক',
            manifesto: 'মুহাম্মদপুরের প্রতিটি ওয়ার্ডে বিনামূল্যে স্বাস্থ্যসেবা ও অ্যাম্বুলেন্স সেবা নেটওয়ার্ক গড়ে তোলা হবে।',
            status: 'APPROVED',
          },
          {
            electionId: election.id,
            positionId: posGs.id,
            userId: createdUsers.get('gs@amra-muhammadpuri.org')?.id || userAdmin.id,
            candidateName: 'তানভীর হোসেন',
            candidatePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
            experience: 'বাবর রোড যুব ও নাগরিক ফোরাম সংগঠক',
            manifesto: 'তরুণ সমাজকে মাদক ও অপরাধমুক্ত রাখতে সাংস্কৃতিক ও ক্রীড়া কর্মকাণ্ডের প্রসার এবং নিয়মিত নাগরিক গণশুনানি করা হবে।',
            status: 'APPROVED',
          },
          {
            electionId: election.id,
            positionId: posTreas.id,
            userId: createdUsers.get('member@amra-muhammadpuri.org')?.id || userAdmin.id,
            candidateName: 'ইঞ্জি. সামিউল ইসলাম',
            candidatePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop',
            experience: 'চার্টার্ড অ্যাকাউন্ট্যান্ট ও ফাইন্যান্সিয়াল অডিটর',
            manifesto: 'শতভাগ ডিজিটাল রসিদ ও প্রতিটি পয়সার হিসাব স্বয়ংক্রিয় অডিটের মাধ্যমে উন্মুক্ত ড্যাশবোর্ডে প্রদর্শন করা হবে।',
            status: 'APPROVED',
          },
        ],
      });
      console.info('✅ Seeded active Digital Election with positions and approved candidate nominations.');
    }
  }

  console.info('🎉 Database seeding completed successfully! All test accounts and test fixtures are ready.');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
