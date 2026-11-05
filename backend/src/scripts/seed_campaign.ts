import { prisma } from '../config/database.js';

async function main() {
  const count = await prisma.campaign.count();
  console.log('Existing campaigns count:', count);
  if (count === 0) {
    let cat = await prisma.campaignCategory.findFirst({
      where: { name: 'শীতবস্ত্র বিতরণ' },
    });
    if (!cat) {
      cat = await prisma.campaignCategory.create({
        data: {
          name: 'শীতবস্ত্র বিতরণ',
          icon: 'Snowflake',
          description: 'শীতার্তদের কম্বল ও গরম কাপড় বিতরণ',
          isActive: true,
        },
      });
    }

    const camp = await prisma.campaign.create({
      data: {
        title: 'শীতবস্ত্র বিতরণ ও কম্বল উপহার কর্মসূচি ২০২৬',
        slug: 'winter-warmth-2026',
        categoryId: cat.id,
        categoryName: cat.name,
        coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
        shortDescription: 'মোহাম্মদপুরের শীতার্ত ও ছিন্নমূল পথশিশুদের মাঝে শীতবস্ত্র ও মানসম্মত কম্বল পৌঁছে দিতে আপনার ভালোবাসার হাত বাড়িয়ে দিন।',
        description: 'আসন্ন প্রচণ্ড শীতে মোহাম্মদপুরের অসহায়, দিনমজুর ও বস্তিবাসী মানুষের কষ্ট লাঘবে "আমরা মুহাম্মদপুরী" সংগঠন গ্রহণ করেছে এক মানবিক উদ্যোগ। আমাদের লক্ষ্য কমপক্ষে ৫০০ পরিবারের কাছে গরম কাপড় ও মানসম্মত কম্বল পৌঁছে দেওয়া।\n\nপ্রতিটি কম্বলের জন্য আনুমানিক ৫০০ টাকা নির্ধারণ করা হয়েছে। আপনি ১টি, ২টি বা যেকোনো পরিমাণ অর্থ অনুদান দিয়ে এই মহতী উদ্যোগে শরিক হতে পারেন। আপনার সামান্য সাহায্য একজন শীতার্ত মানুষের রাতকে উষ্ণ করে তুলতে পারে।',
        goalAmount: 100000,
        collectedAmount: 35000,
        startDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 25 * 24 * 3600 * 1000),
        location: 'মোহাম্মদপুর, ঢাকা',
        status: 'ACTIVE',
        isFeatured: true,
        priority: 10,
      },
    });

    console.log('Seeded sample campaign:', camp.id, camp.title);

    // Seed 2 verified donations and 1 pending donation
    await prisma.campaignDonation.createMany({
      data: [
        {
          campaignId: camp.id,
          donorName: 'মোঃ তানভীর হাসান',
          donorPhone: '01712345678',
          amount: 20000,
          paymentMethod: 'BKASH',
          trxId: 'BKH98765432',
          receiptNumber: 'AMP-DON-202611-1001',
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
        {
          campaignId: camp.id,
          donorName: 'সাদিয়া ইসলাম',
          donorPhone: '01812345678',
          amount: 15000,
          paymentMethod: 'NAGAD',
          trxId: 'NGD56781234',
          receiptNumber: 'AMP-DON-202611-1002',
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
        {
          campaignId: camp.id,
          donorName: 'কামরুল আহমেদ',
          donorPhone: '01912345678',
          amount: 5000,
          paymentMethod: 'BKASH',
          trxId: 'BKH11223344',
          receiptNumber: 'AMP-DON-202611-1003',
          status: 'PENDING',
        },
      ],
    });
    console.log('Seeded sample donations.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
