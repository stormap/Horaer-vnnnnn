/** Horae - Hàm tiện ích thời gian */

/** Ánh xạ thứ trong tuần (Tiếng Việt) */
const WEEKDAY_NAMES = ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];

/** Tên mùa */
const SEASONS = ['Mùa đông', 'Mùa đông', 'Mùa xuân', 'Mùa xuân', 'Mùa xuân', 'Mùa hè', 'Mùa hè', 'Mùa hè', 'Mùa thu', 'Mùa thu', 'Mùa thu', 'Mùa đông'];

/** Ánh xạ số tiếng Trung (Giữ nguyên để phục vụ logic phân tích cú pháp gốc) */
const CHINESE_NUMS = {
    '零': 0, '〇': 0,
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '廿': 20, '廿一': 21, '廿二': 22, '廿三': 23, '廿四': 24, '廿五': 25,
    '廿六': 26, '廿七': 27, '廿八': 28, '廿九': 29, '三十': 30,
    '三十一': 31, '卅': 30, '卅一': 31
};

/** Trích xuất số ngày từ chuỗi ngày tháng */
function extractDayNumber(dateStr) {
    if (!dateStr) return null;
    
    const arabicMatch = dateStr.match(/(?:第|Day\s*|day\s*)(\d+)(?:日)?/i) ||
                        dateStr.match(/(\d+)(?:日|号)/);
    if (arabicMatch) return parseInt(arabicMatch[1]);
    
    // Khớp số tiếng Trung
    const sortedEntries = Object.entries(CHINESE_NUMS).sort((a, b) => b[0].length - a[0].length);
    
    for (const [cn, num] of sortedEntries) {
        const patterns = [
            new RegExp(`第${cn}日`),
            new RegExp(`第${cn}(?![\u4e00-\u9fa5])`),  // 第X phía sau không phải chữ Hán
            new RegExp(`[月]${cn}日`),
            new RegExp(`${cn}日`)
        ];
        
        for (const pattern of patterns) {
            if (pattern.test(dateStr)) {
                return num;
            }
        }
    }
    
    const anyNumMatch = dateStr.match(/(\d+)/);
    if (anyNumMatch) return parseInt(anyNumMatch[1]);
    
    return null;
}

/** Trích xuất định danh tháng từ chuỗi ngày tháng */
function extractMonthIdentifier(dateStr) {
    if (!dateStr) return null;
    
    // Khớp định dạng "Tháng X" (X月)
    const monthMatch = dateStr.match(/([^\s\d]+月)/);
    if (monthMatch) return monthMatch[1];
    
    const numMatch = dateStr.match(/(?:\d{4}[\/\-])?(\d{1,2})[\/\-]\d{1,2}/);
    if (numMatch) return numMatch[1] + '月'; // Giữ nguyên hậu tố logic nội bộ
    
    return null;
}

/** Phân tích chuỗi ngày cốt truyện */
export function parseStoryDate(dateStr) {
    if (!dateStr) return null;
    
    // Làm sạch chú thích thứ trong tuần do AI viết
    let cleanStr = dateStr.trim();
    
    const aiWeekdayMatch = cleanStr.match(/\(([日一二三四五六])\)/);
    cleanStr = cleanStr.replace(/\s*\([日一二三四五六]\)\s*/g, ' ').trim();
    
    // Ngày tháng không hợp lệ xử lý theo lịch giả tưởng (fantasy)
    if (/[xX]{2}|[?？]{2}/.test(cleanStr)) {
        return { 
            type: 'fantasy',
            raw: dateStr.trim(),
            aiWeekday: aiWeekdayMatch ? aiWeekdayMatch[1] : undefined
        };
    }
    
    // Định dạng số tiêu chuẩn
    const fullMatch = cleanStr.match(/^(\d{4,})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (fullMatch) {
        const year = parseInt(fullMatch[1]);
        const month = parseInt(fullMatch[2]);
        const day = parseInt(fullMatch[3]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { year, month, day, type: 'standard' };
        }
    }
    
    const shortMatch = cleanStr.match(/^(\d{1,2})[\/\-](\d{1,2})(?:\s|$)/);
    if (shortMatch) {
        const month = parseInt(shortMatch[1]);
        const day = parseInt(shortMatch[2]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { month, day, type: 'standard' };
        }
    }
    
    // Định dạng X năm M tháng D ngày (X年M月D日)
    // Cái này phải nằm trước X tháng X ngày thuần túy, nếu không sẽ mất năm
    const yearCnMatch = cleanStr.match(/(\d+)年\s*(\d{1,2})月(\d{1,2})日?/);
    if (yearCnMatch) {
        const year = parseInt(yearCnMatch[1]);
        const month = parseInt(yearCnMatch[2]);
        const day = parseInt(yearCnMatch[3]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            // Trích xuất tiền tố lịch
            const fullMatchStr = yearCnMatch[0];
            const prefixEnd = cleanStr.indexOf(fullMatchStr);
            const calendarPrefix = cleanStr.substring(0, prefixEnd).trim() || undefined;
            return { year, month, day, type: 'standard', calendarPrefix };
        }
    }
    
    // Định dạng X tháng X ngày (X月X日)
    const cnMatch = cleanStr.match(/(\d{1,2})月(\d{1,2})日?/);
    if (cnMatch) {
        const month = parseInt(cnMatch[1]);
        const day = parseInt(cnMatch[2]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { month, day, type: 'standard' };
        }
    }
    
    // Định dạng lịch giả tưởng
    const monthId = extractMonthIdentifier(cleanStr);
    const dayNum = extractDayNumber(cleanStr);
    
    if (monthId || dayNum !== null) {
        return { 
            monthId: monthId,
            day: dayNum,
            type: 'fantasy',
            raw: dateStr.trim(),
            aiWeekday: aiWeekdayMatch ? aiWeekdayMatch[1] : undefined
        };
    }
    
    return null;
}

/** Tính chênh lệch ngày giữa hai ngày */
export function calculateRelativeTime(fromDate, toDate) {
    if (!fromDate || !toDate) return null;
    
    const fromDateOnly = fromDate.split(/\s+/)[0].trim();
    const toDateOnly = toDate.split(/\s+/)[0].trim();
    
    if (fromDateOnly === toDateOnly) {
        return 0;
    }
    
    const from = parseStoryDate(fromDate);
    const to = parseStoryDate(toDate);
    
    if (!from || !to) return null;
    
    // Tính toán chính xác định dạng chuẩn
    if (from.type === 'standard' && to.type === 'standard') {
        const defaultYear = 2024;
        const fromYear = from.year || to.year || defaultYear;
        const toYear = to.year || from.year || defaultYear;
        
        const fromObj = new Date(0);
        fromObj.setFullYear(fromYear, from.month - 1, from.day);
        const toObj = new Date(0);
        toObj.setFullYear(toYear, to.month - 1, to.day);
        
        const diffTime = toObj.getTime() - fromObj.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }
    
    if (from.type === 'fantasy' || to.type === 'fantasy') {
        const fromDay = from.day;
        const toDay = to.day;
        const fromMonth = from.monthId || from.month;
        const toMonth = to.monthId || to.month;
        
        // Cùng tháng tính chính xác
        if (fromMonth && toMonth && fromMonth === toMonth && 
            fromDay !== null && toDay !== null) {
            return toDay - fromDay;
        }
        
        // Khác tháng ước tính
        if (fromDay !== null && toDay !== null) {
            if (fromMonth && toMonth && fromMonth !== toMonth) {
                return toDay > fromDay ? -998 : -997; // -998=Sau đó, -997=Trước đó
            }
            return toDay - fromDay;
        }
        
        return -999;
    }
    
    return null;
}

/** Định dạng mô tả thời gian tương đối */
export function formatRelativeTime(days, options = {}) {
    if (days === null || days === undefined) return 'Không rõ';
    
    if (days === -999) return 'Trước đó khá lâu';
    if (days === -998) return 'Sau đó';
    if (days === -997) return 'Trước đó';
    
    // Vài ngày gần đây
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    if (days === 2) return 'Hôm kia';
    if (days === 3) return '3 ngày trước';
    if (days === -1) return 'Ngày mai';
    if (days === -2) return 'Ngày kia';
    if (days === -3) return '3 ngày nữa';
    
    const { fromDate, toDate } = options;
    
    if (days > 0) {
        if (days < 7) return `${days} ngày trước`;
        
        // Thứ mấy tuần trước
        if (days >= 4 && days <= 13 && fromDate) {
            const weekday = fromDate.getDay();
            return `Thứ ${WEEKDAY_NAMES[weekday]} tuần trước`;
        }
        
        // Tháng trước
        if (days >= 20 && days < 60 && fromDate && toDate) {
            const fromMonth = fromDate.getMonth();
            const toMonth = toDate.getMonth();
            if (fromMonth !== toMonth) {
                return `Ngày ${fromDate.getDate()} tháng trước`;
            }
        }
        
        if (days >= 300 && fromDate && toDate) {
            const fromYear = fromDate.getFullYear();
            const toYear = toDate.getFullYear();
            if (fromYear < toYear) {
                const fromMonth = fromDate.getMonth() + 1;
                const fromDay = fromDate.getDate();
                if (days < 730) {
                    return `Ngày ${fromDay} tháng ${fromMonth} năm ngoái`;
                }
            }
        }
        
        if (days < 14) return `${Math.ceil(days / 7)} tuần trước`;
        if (days < 60) return `${Math.round(days / 30)} tháng trước`;
        if (days < 365) return `${Math.round(days / 30)} tháng trước`;
        const years = Math.floor(days / 365);
        const remainMonths = Math.round((days % 365) / 30);
        if (remainMonths > 0 && years < 5) return `${years} năm ${remainMonths} tháng trước`;
        return `${years} năm trước`;
    } else {
        const absDays = Math.abs(days);
        if (absDays < 7) return `${absDays} ngày sau`;
        
        if (absDays >= 4 && absDays <= 13 && fromDate) {
            const weekday = fromDate.getDay();
            return `Thứ ${WEEKDAY_NAMES[weekday]} tuần sau`;
        }
        
        if (absDays >= 20 && absDays < 60 && fromDate && toDate) {
            const fromMonth = fromDate.getMonth();
            const toMonth = toDate.getMonth();
            if (fromMonth !== toMonth) {
                return `Ngày ${fromDate.getDate()} tháng sau`;
            }
        }
        
        if (absDays < 14) return `${Math.ceil(absDays / 7)} tuần sau`;
        if (absDays < 60) return `${Math.round(absDays / 30)} tháng sau`;
        if (absDays < 365) return `${Math.round(absDays / 30)} tháng sau`;
        const years = Math.floor(absDays / 365);
        const remainMonths = Math.round((absDays % 365) / 30);
        if (remainMonths > 0 && years < 5) return `${years} năm ${remainMonths} tháng sau`;
        return `${years} năm sau`;
    }
}

/** Định dạng ngày cốt truyện thành định dạng chuẩn */
export function formatStoryDate(dateObj, includeWeekday = false) {
    if (!dateObj) return '';
    // Lịch giả tưởng giữ nguyên chuỗi gốc
    if (dateObj.raw && !dateObj.month) {
        let result = dateObj.raw;
        if (includeWeekday && dateObj.aiWeekday && !result.includes(`(${dateObj.aiWeekday})`)) {
            result += ` (${dateObj.aiWeekday})`;
        }
        return result;
    }
    
    let dateStr = '';
    const prefix = dateObj.calendarPrefix || '';
    
    if (dateObj.year) {
        if (prefix) {
            // Giữ lại tiền tố lịch, chuyển định dạng thành Ngày Tháng Năm
            dateStr = `${prefix}Ngày ${dateObj.day} tháng ${dateObj.month} năm ${dateObj.year}`;
        } else {
            // Định dạng ngắn gọn
            dateStr = `${dateObj.day}/${dateObj.month}/${dateObj.year}`;
        }
    } else if (dateObj.month && dateObj.day) {
        dateStr = `${dateObj.day}/${dateObj.month}`;
    }
    
    if (includeWeekday && dateObj.month && dateObj.day) {
        const refYear = dateObj.year || new Date().getFullYear();
        // setFullYear tránh năm tự động lệch
        const date = new Date(0);
        date.setFullYear(refYear, dateObj.month - 1, dateObj.day);
        const weekday = WEEKDAY_NAMES[date.getDay()];
        dateStr += ` (${weekday})`;
    }
    
    return dateStr;
}

/** Định dạng ngày giờ cốt truyện đầy đủ */
export function formatFullDateTime(dateStr, timeStr) {
    const parsed = parseStoryDate(dateStr);
    if (!parsed) return dateStr + (timeStr ? ' ' + timeStr : '');
    
    const dateWithWeekday = formatStoryDate(parsed, true);
    return dateWithWeekday + (timeStr ? ' ' + timeStr : '');
}

/** Lấy thời gian hệ thống hiện tại */
export function getCurrentSystemTime() {
    const now = new Date();
    return {
        date: `${now.getMonth() + 1}/${now.getDate()}`,
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    };
}

/** Tạo thông tin tham chiếu thời gian */
export function generateTimeReference(currentDate) {
    const current = parseStoryDate(currentDate);
    if (!current) return null;
    
    if (current.type === 'fantasy') {
        return {
            current: currentDate,
            type: 'fantasy',
            note: 'Chế độ lịch giả tưởng, ngày tương đối do plugin tự động tính toán'
        };
    }
    
    const refYear = current.year || new Date().getFullYear();
    const baseDate = new Date(0);
    baseDate.setFullYear(refYear, current.month - 1, current.day);
    
    const getDateString = (daysOffset) => {
        const d = new Date(baseDate.getTime());
        d.setDate(d.getDate() + daysOffset);
        const weekday = WEEKDAY_NAMES[d.getDay()];
        return `${d.getDate()}/${d.getMonth() + 1} (${weekday})`;
    };
    
    return {
        current: currentDate,
        type: 'standard',
        yesterday: getDateString(-1),
        dayBefore: getDateString(-2),
        threeDaysAgo: getDateString(-3),
        tomorrow: getDateString(1)
    };
}

/** Tính toán sự khác biệt chi tiết giữa hai ngày */
export function calculateDetailedRelativeTime(fromDateStr, toDateStr) {
    const days = calculateRelativeTime(fromDateStr, toDateStr);
    if (days === null) return { days: null, relative: 'Không rõ' };
    
    const from = parseStoryDate(fromDateStr);
    const to = parseStoryDate(toDateStr);
    
    let fromDate = null;
    let toDate = null;
    
    if (from?.type === 'standard' && to?.type === 'standard') {
        const defaultYear = new Date().getFullYear();
        const fromYear = from.year || to.year || defaultYear;
        const toYear = to.year || from.year || defaultYear;
        fromDate = new Date(0);
        fromDate.setFullYear(fromYear, from.month - 1, from.day);
        toDate = new Date(0);
        toDate.setFullYear(toYear, to.month - 1, to.day);
    }
    
    const relative = formatRelativeTime(days, { fromDate, toDate });
    
    return { days, fromDate, toDate, relative };
}

/** Trừ đi số ngày chỉ định từ ngày hiện tại */
export function subtractDays(dateStr, days) {
    const parsed = parseStoryDate(dateStr);
    if (!parsed || parsed.type === 'fantasy') return dateStr;
    
    const refYear = parsed.year || 2024;
    const date = new Date(0);
    date.setFullYear(refYear, parsed.month - 1, parsed.day);
    date.setDate(date.getDate() - days);
    
    if (parsed.year) {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

/** Lấy mô tả khoảng thời gian trong ngày */
export function getTimeOfDay(timeStr) {
    if (!timeStr) return '';
    
    let hour = null;
    
    const match24 = timeStr.match(/(\d{1,2})[:：]/);
    if (match24) {
        hour = parseInt(match24[1]);
    }
    
    const matchCN = timeStr.match(/(凌晨|早上|上午|中午|下午|傍晚|晚上|深夜)/);
    if (matchCN) {
        // Có thể thêm logic ánh xạ từ tiếng Trung sang tiếng Việt nếu dữ liệu thô vẫn là tiếng Trung
        const map = {
            '凌晨': 'Rạng sáng', '早上': 'Sáng sớm', '上午': 'Buổi sáng', '中午': 'Buổi trưa',
            '下午': 'Buổi chiều', '傍晚': 'Chập tối', '晚上': 'Buổi tối', '深夜': 'Đêm khuya'
        };
        return map[matchCN[1]] || matchCN[1];
    }
    
    if (hour !== null) {
        if (hour >= 0 && hour < 5) return 'Rạng sáng';
        if (hour >= 5 && hour < 8) return 'Sáng sớm';
        if (hour >= 8 && hour < 11) return 'Buổi sáng';
        if (hour >= 11 && hour < 13) return 'Buổi trưa';
        if (hour >= 13 && hour < 17) return 'Buổi chiều';
        if (hour >= 17 && hour < 19) return 'Chập tối';
        if (hour >= 19 && hour < 23) return 'Buổi tối';
        return 'Đêm khuya';
    }
    
    return '';
}