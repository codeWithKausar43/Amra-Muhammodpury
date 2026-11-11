/**
 * High-Resolution Canvas Donation Receipt Generator
 * Generates an official, watermarked downloadable PNG receipt for campaign donations.
 */

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

export interface CampaignReceiptData {
  receiptNumber: string;
  donorName: string;
  donorPhone?: string;
  senderNumber?: string;
  campaignTitle: string;
  amount: number;
  paymentMethod: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  date?: string | Date;
}

export function downloadCampaignDonationReceipt(data: CampaignReceiptData): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fontSans = '"SolaimanLipi", "Noto Sans Bengali", "Segoe UI", system-ui, sans-serif';

  // Crisp White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Decorative Border (Brand Emerald)
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#059669';
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Inner Border (Soft Mint)
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#a7f3d0';
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  // Security Watermark (Diagonal repeating pattern)
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((-24 * Math.PI) / 180);
  ctx.font = `bold 26px ${fontSans}`;
  ctx.fillStyle = 'rgba(5, 150, 105, 0.06)';
  ctx.textAlign = 'center';
  for (let y = -460; y <= 460; y += 80) {
    ctx.fillText('আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা • OFFICIAL CAMPAIGN DONATION RECEIPT', 0, y);
  }
  ctx.restore();

  // Watermark Seal in the Center
  ctx.save();
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 + 30, 150, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(5, 150, 105, 0.05)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Top Organization Branding: Monogram Badge
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 75, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 26px ${fontSans}`;
  ctx.textAlign = 'center';
  ctx.fillText('ম', canvas.width / 2, 84);

  // Organization Title
  ctx.fillStyle = '#064e3b';
  ctx.font = `bold 30px ${fontSans}`;
  ctx.fillText('আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা', canvas.width / 2, 132);

  ctx.fillStyle = '#475569';
  ctx.font = `bold 15px ${fontSans}`;
  ctx.fillText('অফিসিয়াল ক্যাম্পেইন অনুদান রসিদ (OFFICIAL CAMPAIGN DONATION RECEIPT)', canvas.width / 2, 160);

  ctx.fillStyle = '#64748b';
  ctx.font = `13px ${fontSans}`;
  ctx.fillText('রেজিস্টার্ড সামাজিক ও নাগরিক কল্যাণ সোসাইটি • মোহাম্মদপুর, ঢাকা', canvas.width / 2, 183);

  // Dividing Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 202);
  ctx.lineTo(canvas.width - 50, 202);
  ctx.stroke();

  // Receipt Number & Date Banner
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(50, 216, canvas.width - 100, 46);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 216, canvas.width - 100, 46);

  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 14px ${fontSans}`;
  ctx.textAlign = 'left';
  ctx.fillText(`রসিদ নম্বর: ${data.receiptNumber}`, 70, 245);

  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  ctx.textAlign = 'right';
  ctx.fillText(`ইস্যু তারিখ: ${formattedDate}`, canvas.width - 70, 245);

  // Details Table Background
  const tableY = 280;
  const tableHeight = 280;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, tableY, canvas.width - 100, tableHeight);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, tableY, canvas.width - 100, tableHeight);

  // Helper row renderer
  const renderRow = (y: number, label1: string, val1: string, label2: string, val2: string) => {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(canvas.width - 50, y);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `bold 13px ${fontSans}`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(label1, 75, y - 16);

    ctx.font = `bold 15px ${fontSans}`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(val1, 230, y - 16);

    ctx.font = `bold 13px ${fontSans}`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(label2, 650, y - 16);

    ctx.font = `bold 15px ${fontSans}`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(val2, 800, y - 16);
  };

  const statusBengali =
    data.status === 'VERIFIED'
      ? 'অনুমোদিত (VERIFIED)'
      : data.status === 'PENDING'
        ? 'যাচাই অপেক্ষমাণ (PENDING)'
        : 'বাতিল (REJECTED)';

  renderRow(tableY + 56, 'দাতার নাম:', data.donorName, 'মোবাইল নম্বর:', data.donorPhone || data.senderNumber || '—');
  renderRow(tableY + 112, 'ক্যাম্পেইনের নাম:', data.campaignTitle.slice(0, 32), 'পেমেন্ট মাধ্যম:', data.paymentMethod);
  renderRow(tableY + 168, 'প্রেরক নম্বর:', data.senderNumber || '—', 'অনুদানের স্ট্যাটাস:', statusBengali);

  // Big Highlight Amount Box
  const amountBoxY = tableY + 185;
  ctx.fillStyle = '#ecfdf5'; // light emerald
  ctx.fillRect(52, amountBoxY, canvas.width - 104, 93);
  ctx.strokeStyle = '#a7f3d0';
  ctx.strokeRect(52, amountBoxY, canvas.width - 104, 93);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#065f46';
  ctx.font = `bold 16px ${fontSans}`;
  ctx.fillText('মোট অনুদানের পরিমাণ:', 75, amountBoxY + 52);

  ctx.textAlign = 'right';
  ctx.font = `bold 32px ${fontSans}`;
  ctx.fillStyle = '#059669';
  ctx.fillText(`৳ ${toBengaliNumber(data.amount)} টাকা`, canvas.width - 75, amountBoxY + 55);

  // Tracking Notice Box
  const noticeY = 580;
  ctx.fillStyle = '#eff6ff'; // light blue
  ctx.fillRect(50, noticeY, canvas.width - 100, 75);
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, noticeY, canvas.width - 100, 75);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e40af';
  ctx.font = `bold 13px ${fontSans}`;
  ctx.fillText(`🔍 অনুদান ট্র্যাকিং ও অগ্রগতি পর্যবেক্ষণ:`, 70, noticeY + 28);

  ctx.fillStyle = '#334155';
  ctx.font = `12px ${fontSans}`;
  ctx.fillText(
    `রসিদ নম্বর "${data.receiptNumber}" ব্যবহার করে আমাদের ওয়েবসাইটে সরাসরি আপনার অনুদানের অবস্থা এবং ক্যাম্পেইনের রিয়েল-টাইম অগ্রগতি দেখতে পারবেন।`,
    70,
    noticeY + 50
  );

  // Verification Seal & Signatures
  const bottomY = 720;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;

  // Left: General Secretary / Officer Signature
  ctx.beginPath();
  ctx.moveTo(100, bottomY);
  ctx.lineTo(300, bottomY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = `12px ${fontSans}`;
  ctx.fillStyle = '#475569';
  ctx.fillText('সাধারণ সম্পাদক / দপ্তর সম্পাদক', 200, bottomY + 20);
  ctx.fillText('আমরা মোহাম্মদপুরী', 200, bottomY + 36);

  // Center: Official Stamp Box
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(canvas.width / 2 - 90, bottomY - 35, 180, 55);
  ctx.fillStyle = '#065f46';
  ctx.font = `bold 12px ${fontSans}`;
  ctx.fillText('অফিসিয়াল ডিজিটাল ভেরিফাইড', canvas.width / 2, bottomY - 12);
  ctx.font = `11px ${fontSans}`;
  ctx.fillStyle = '#059669';
  ctx.fillText('আমরা মোহাম্মদপুরী কেন্দ্রীয় ফান্ড', canvas.width / 2, bottomY + 8);

  // Right: Finance Secretary Signature
  ctx.beginPath();
  ctx.moveTo(canvas.width - 300, bottomY);
  ctx.lineTo(canvas.width - 100, bottomY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = `12px ${fontSans}`;
  ctx.fillStyle = '#475569';
  ctx.fillText('অর্থ ও তহবিল বিষয়ক সম্পাদক', canvas.width - 200, bottomY + 20);
  ctx.fillText('আমরা মোহাম্মদপুরী', canvas.width - 200, bottomY + 36);

  // Footer Disclaimer
  ctx.fillStyle = '#94a3b8';
  ctx.font = `11px ${fontSans}`;
  ctx.textAlign = 'center';
  ctx.fillText(
    'এটি একটি কম্পিউটার-জেনারেটেড ডিজিটাল অফিসিয়াল রসিদ। ক্যাম্পেইনের স্বচ্ছতা ও জবাবদিহিতায় আমরা প্রতিশ্রুতিবদ্ধ।',
    canvas.width / 2,
    canvas.height - 35
  );

  // Trigger browser download
  const downloadLink = document.createElement('a');
  downloadLink.download = `Donation-Receipt-${data.receiptNumber}.png`;
  downloadLink.href = canvas.toDataURL('image/png');
  downloadLink.click();
}

