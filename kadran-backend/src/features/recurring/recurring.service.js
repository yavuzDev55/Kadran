// src/features/recurring/recurring.service.js
// Tek doğruluk kaynağı: backend ve calendarUtils.js (frontend) aynı mantığı kullanır.
// Gün adları: MONDAY..SUNDAY (DB ve validator ile tutarlı)
// Tüm hesaplamalar UTC bazlı

const DAY_NAME_TO_UTC = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

// 'YYYY-MM-DD' string'ini UTC Date objesine çevirir (saat kayması olmadan)
export const parseUTCDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

// UTC Date objesini 'YYYY-MM-DD' string'ine çevirir
export const toDateStr = (date) => date.toISOString().slice(0, 10);

// n gün ekler, yeni Date döner
const addDays = (date, n) => new Date(date.getTime() + n * 86400000);

// Verilen UTC Date'in MONDAY..SUNDAY adını döner
const getDayName = (date) => {
  const names = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  return names[date.getUTCDay()];
};

// Aylık tekrar için: istenen ayda hedef günü hesaplar
// recurrenceDay = 1..31 → o günü kullan (aşarsa ay sonu)
// recurrenceDay = -1    → ayın son günü
const getMonthlyDate = (year, month, recurrenceDay) => {
  if (recurrenceDay === -1) {
    return new Date(Date.UTC(year, month + 1, 0)); // sonraki ayın 0. günü = bu ayın son günü
  }
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(recurrenceDay, lastDayOfMonth);
  return new Date(Date.UTC(year, month, day));
};

/**
 * Tekrarlayan bir task için belirli tarih aralığındaki tüm instance tarihlerini üretir.
 *
 * @param {object} task - DB'den gelen task (isRecurring=true)
 * @param {string} rangeStart - 'YYYY-MM-DD'
 * @param {string} rangeEnd   - 'YYYY-MM-DD'
 * @returns {string[]} - 'YYYY-MM-DD' dizisi (en fazla MAX_INSTANCES)
 */
const MAX_INSTANCES = 500; // Sonsuz döngü güvencesi

export const generateOccurrenceDates = (task, rangeStart, rangeEnd) => {
  if (!task.isRecurring || !task.recurrencePattern) return [];

  const viewStart = parseUTCDate(rangeStart);
  const viewEnd   = parseUTCDate(rangeEnd);

  const seriesStart = task.recurrenceStart
    ? parseUTCDate(typeof task.recurrenceStart === 'string'
        ? task.recurrenceStart.slice(0, 10)
        : task.recurrenceStart.toISOString().slice(0, 10))
    : viewStart;

  const seriesEnd = task.recurrenceEnd
    ? parseUTCDate(typeof task.recurrenceEnd === 'string'
        ? task.recurrenceEnd.slice(0, 10)
        : task.recurrenceEnd.toISOString().slice(0, 10))
    : null; // null = sınırsız

  // Döngü aralığı: görünüm ve seri kesişimi
  const loopStart = seriesStart > viewStart ? seriesStart : viewStart;
  const loopEnd   = seriesEnd && seriesEnd < viewEnd ? seriesEnd : viewEnd;

  if (loopStart > loopEnd) return [];

  const dates = [];
  const { recurrencePattern, recurrenceDays, recurrenceDay } = task;

  if (recurrencePattern === 'DAILY') {
    let cur = new Date(loopStart);
    while (cur <= loopEnd && dates.length < MAX_INSTANCES) {
      dates.push(toDateStr(cur));
      cur = addDays(cur, 1);
    }
  }

  else if (recurrencePattern === 'WEEKLY') {
    // recurrenceDays: DB'de "MONDAY,WEDNESDAY,FRIDAY" şeklinde string
    const targetDays = (typeof recurrenceDays === 'string'
      ? recurrenceDays.split(',')
      : recurrenceDays || []
    ).map(d => d.trim().toUpperCase());

    if (targetDays.length === 0) return [];

    let cur = new Date(loopStart);
    while (cur <= loopEnd && dates.length < MAX_INSTANCES) {
      if (targetDays.includes(getDayName(cur))) {
        dates.push(toDateStr(cur));
      }
      cur = addDays(cur, 1);
    }
  }

  else if (recurrencePattern === 'MONTHLY') {
    const day = recurrenceDay ?? 1;
    // loopStart'ın ayından başla, loopEnd'in ayına kadar ilerle
    let year  = loopStart.getUTCFullYear();
    let month = loopStart.getUTCMonth();
    const endYear  = loopEnd.getUTCFullYear();
    const endMonth = loopEnd.getUTCMonth();

    while (
      (year < endYear || (year === endYear && month <= endMonth)) &&
      dates.length < MAX_INSTANCES
    ) {
      const candidate = getMonthlyDate(year, month, day);
      if (candidate >= loopStart && candidate <= loopEnd) {
        dates.push(toDateStr(candidate));
      }
      month++;
      if (month > 11) { month = 0; year++; }
    }
  }

  return dates;
};

// Geriye dönük uyumluluk için (calendarUtils.js'te kullanılan eski imza)
// Frontend bu fonksiyonu import edip kullanabilir
export const generateInstances = (task, rangeStartDate, rangeEndDate) => {
  const rangeStart = typeof rangeStartDate === 'string'
    ? rangeStartDate
    : rangeStartDate.toISOString().slice(0, 10);
  const rangeEnd = typeof rangeEndDate === 'string'
    ? rangeEndDate
    : rangeEndDate.toISOString().slice(0, 10);

  const dates = generateOccurrenceDates(task, rangeStart, rangeEnd);

  return dates.map(dateStr => ({
    ...task,
    date: dateStr,
    _isInstance: true,
    _originalId: task.id,
  }));
};