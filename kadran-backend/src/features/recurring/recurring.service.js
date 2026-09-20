// src/features/recurring/recurring.service.js
// Bu servis frontend'e yardımcı olmak için backend'de de çalıştırılabilir.
// Genellikle Frontend'de çalışır (recurringManager.js)

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const getDayName = (date) => DAY_NAMES[date.getDay()];

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const getNextOccurrence = (current, pattern, recurrenceDays, recurrenceDay) => {
  const next = new Date(current);

  if (pattern === 'DAILY') {
    return addDays(next, 1);
  }

  if (pattern === 'WEEKLY') {
    const targetDays = recurrenceDays.split(',').map(d => d.trim());
    let candidate = addDays(next, 1);
    // Sonraki geçerli günü bul
    while (!targetDays.includes(getDayName(candidate))) {
      candidate = addDays(candidate, 1);
    }
    return candidate;
  }

  if (pattern === 'MONTHLY') {
    const nextMonth = new Date(next);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (recurrenceDay === -1) {
      // Ayın son günü
      nextMonth.setDate(0);
    } else {
      nextMonth.setDate(recurrenceDay || 1);
    }
    return nextMonth;
  }

  return addDays(next, 1); // fallback
};

/**
 * Tekrarlayan bir task için belirli tarih aralığındaki tüm instance'ları üretir.
 * 
 * @param {Object} task - Prisma'dan gelen task objesi
 * @param {Date} rangeStart - Görüntülenecek aralık başlangıcı
 * @param {Date} rangeEnd - Görüntülenecek aralık sonu
 * @returns {Array} - Instance listesi
 */
export const generateInstances = (task, rangeStart, rangeEnd) => {
  if (!task.isRecurring || !task.recurrencePattern) {
    return [task]; // Tekrar etmiyorsa direkt döndür
  }

  const instances = [];
  const limit = task.recurrenceEnd ? new Date(task.recurrenceEnd) : rangeEnd;
  let current = new Date(task.recurrenceStart || task.date);

  while (current <= rangeEnd && current <= limit) {
    if (current >= rangeStart) {
      instances.push({
        ...task,
        date: current.toISOString().split('T')[0],
        _isInstance: true,
        _originalId: task.id,
      });
    }

    current = getNextOccurrence(
      current,
      task.recurrencePattern,
      task.recurrenceDays,
      task.recurrenceDay
    );
  }

  return instances;
};