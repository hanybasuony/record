const ONES = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
  'عشرة',
  'أحد عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
];

const TENS = [
  '',
  'عشرة',
  'عشرون',
  'ثلاثون',
  'أربعون',
  'خمسون',
  'ستون',
  'سبعون',
  'ثمانون',
  'تسعون',
];

const HUNDREDS = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];

function convertBelowOneThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const one = n % 10;
    const ten = Math.floor(n / 10);
    return one ? `${ONES[one]} و${TENS[ten]}` : TENS[ten];
  }
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  return remainder
    ? `${HUNDREDS[hundred]} و${convertBelowOneThousand(remainder)}`
    : HUNDREDS[hundred];
}

export function numberToArabicTafqeet(num: number): string {
  if (isNaN(num) || num <= 0) return 'صفر';
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = '';

  if (integerPart === 0) {
    words = 'صفر';
  } else if (integerPart < 1000) {
    words = convertBelowOneThousand(integerPart);
  } else if (integerPart < 1000000) {
    const thousands = Math.floor(integerPart / 1000);
    const rem = integerPart % 1000;
    let thousandWord = '';
    if (thousands === 1) thousandWord = 'ألف';
    else if (thousands === 2) thousandWord = 'ألفان';
    else if (thousands >= 3 && thousands <= 10)
      thousandWord = `${convertBelowOneThousand(thousands)} آلاف`;
    else thousandWord = `${convertBelowOneThousand(thousands)} ألف`;

    words = rem ? `${thousandWord} و${convertBelowOneThousand(rem)}` : thousandWord;
  } else {
    words = `${integerPart}`;
  }

  if (decimalPart > 0) {
    if (decimalPart === 50) {
      words += ' ونصف';
    } else if (decimalPart === 25) {
      words += ' وربع';
    } else {
      words += ` و${convertBelowOneThousand(decimalPart)} من مائة`;
    }
  }

  return `${words} فقط لا غير`;
}

export function getArabicDayName(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(date.getTime())) return '';
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

export function splitDateParts(dateStr: string): { day: string; month: string; year: string } {
  if (!dateStr) {
    return { day: '....', month: '......', year: '2026' };
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return { day: '....', month: '......', year: '2026' };
  }
  return {
    year: parts[0] || '2026',
    month: parts[1] || '....',
    day: parts[2] || '....',
  };
}
