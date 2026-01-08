/**
 * 时间单位映射类型
 */
type TimeUnit = 'd' | 'h' | 'm' | 's' | 'ms' | 'us';

/**
 * 时间单位到微秒的映射
 */
interface TimeUnitMap {
    [key: string]: number;
    d: number;
    h: number;
    m: number;
    s: number;
    ms: number;
    us: number;
}

/**
 * 判断字符串是否为有效数字
 * @param str 要检查的字符串
 * @returns 是否为有效数字
 */
export function isValidNumber(str: string): boolean {
    return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(str);
}

/**
 * 将数字格式化为十六进制字符串
 * @param v 要格式化的值
 * @returns 十六进制字符串或原值
 */
export function formatHex(v: any): string {
    if (isNaN(v)) {
        return v;
    } else {
        if (v === null || v === undefined || v === '') return '';
        const t = Number(v);
        if (Number.isInteger(t)) {
            return '0x' + t.toString(16).toUpperCase();
        } else {
            return v;
        }
    }
}

/**
 * 校验字符串是否为单引号包裹的字符串字面量
 * 编写时用在校验程序变量的强制值是否合法性
 * @param str 要检查的字符串
 * @returns 是否为有效的字符串字面量
 */
export function fieldIsStr(str: any): boolean {
    return typeof str === 'string'
        && str.startsWith("'")
        && str.endsWith("'")
        && str.split("'").length - 1 === 2;
}

export function fieldIsTime(str: string) {
    // 判断输入是否是时间日期型常量，返回类型或空
    let time_rex = /^(t#|T#|TIME#)(\d+(D|d))?(\d+(H|h))?(\d+(M|m))?(\d+(S|s))?(\d+(MS|ms))?$/
    let time_rex2 = /^(t#|T#|TIME#)(\d+(D|d|H|h|M|m|S|s|MS|ms)).*$/
    if (time_rex.test(str) && time_rex2.test(str)) {
        return 'TIME'
    }

    let ltime_rex = /^(lt#|LT#|LTIME#)(\d+(D|d))?(\d+(H|h))?(\d+(M|m))?(\d+(S|s))?(\d+(MS|ms))?(\d+(US|us))?(\d+(NS|ns))?$/
    let ltime_rex2 = /^(lt#|LT#|LTIME#)(\d+(D|d|H|h|M|m|S|s|MS|ms|US|us|NS|ns)).*$/
    if (ltime_rex.test(str) && ltime_rex2.test(str)) {
        return 'LTIME'
    }

    let time_d_rex = /^(tod#|TOD#)(0?[0-9]|1[0-9]|2[0-4]):(0?[0-9]|[1-5][0-9]|60):(0?[0-9]|[1-5][0-9]|60)(\.\d{1,3})?$/
    if (time_d_rex.test(str)) {
        return 'TIME_OF_DAY'
    }

    let ltime_d_rex = /^(ltod#|LTOD#)(0?[0-9]|1[0-9]|2[0-4]):(0?[0-9]|[1-5][0-9]|60):(0?[0-9]|[1-5][0-9]|60)(\.\d{1,9})?$/
    if (ltime_d_rex.test(str)) {
        return 'LTIME_OF_DAY'
    }

    let data_rex = /^(d#|DATE#|D#)(19[7-9][0-9]|20\d\d|210[0-6])-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])$/
    if (data_rex.test(str)) {
        return 'DATE'
    }

    let ldata_rex = /^(ld#|LDATE#|LD#)(19[7-9][0-9]|2[0-4]\d\d|25[0-4]\d|255[0-4])-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])$/
    if (ldata_rex.test(str)) {
        return 'LDATE'
    }

    let dt_rex = /^(dt#|DT#)(19[7-9][0-9]|20\d\d|210[0-6])-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])-(0?[0-9]|1[0-9]|2[0-4]):(0?[0-9]|[1-5][0-9]|60):(0?[0-9]|[1-5][0-9]|60)$/
    if (dt_rex.test(str)) {
        return 'DATE_AND_TIME'
    }

    let ldt_rex = /^(ldt#|LDT#)(19[7-9][0-9]|2[0-4]\d\d|25[0-4]\d|255[0-4])-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])-(0?[0-9]|1[0-9]|2[0-4]):(0?[0-9]|[1-5][0-9]|60):(0?[0-9]|[1-5][0-9]|60)(\.\d{1,9})?$/
    if (ldt_rex.test(str)) {
        return 'LDATE_AND_TIME'
    }

    return ''
}

/**
 * 创建适用于 Theia 环境的调试日志函数
 * @param type 日志类型标签
 * @returns Theia 调试日志函数
 */
export function useDebug(type?: string | number): (...args: any[]) => void {
    return (...args: any[]) => {
        try {
            const s = args.map(arg => JSON.stringify(arg)).join(' ');
            if (type) {
                console.log(`[${type.toString()}]`, [...args]); // theia的log没有动态参数支持
            } else {
                console.log([...args]);
            }
        } catch (e) {
            console.log(`type`, JSON.stringify(e));
        }
    };
}

/**
 * 深度克隆对象（通过 JSON 序列化）
 * utils/ipc里的copyData
 * @param data 要克隆的数据
 * @returns 克隆后的数据
 */
export function deepClone<T>(data: T): T {
    if (
        data === null
        || data === undefined
        || typeof data !== 'object'
    ) {
        return data;
    }
    return JSON.parse(JSON.stringify(data));
}

/**
 * 将微秒数格式化为可读的时间字符串
 * @param us 微秒数
 * @returns 格式化的时间字符串（如：1d2h3m4s5ms6us）
 */
export function formatMicroseconds(us: number): string {
    let result = '';

    const d = Math.floor(us / 86400000000); // 1天 = 86400秒 = 86,400,000,000 微秒
    if (d > 0) result += d + 'd';
    us %= 86400000000;

    const h = Math.floor(us / 3600000000);
    if (h > 0) result += h + 'h';
    us %= 3600000000;

    const m = Math.floor(us / 60000000);
    if (m > 0) result += m + 'm';
    us %= 60000000;

    const s = Math.floor(us / 1000000);
    if (s > 0) result += s + 's';
    us %= 1000000;

    const ms = Math.floor(us / 1000);
    if (ms > 0) result += ms + 'ms';
    us %= 1000;

    if (us > 0 || result === '') result += us + 'us';

    return result;
}

/**
 * 解析时间字符串为微秒数
 * @param str 时间字符串（如：1d2h3m4s5ms6us）
 * @returns 微秒数
 */
export function parseTimeString(str: string): number {
    const UNIT_MAP: TimeUnitMap = {
        d: 86400000000,   // 天
        h: 3600000000,    // 小时
        m: 60000000,      // 分钟
        s: 1000000,       // 秒
        ms: 1000,         // 毫秒
        us: 1             // 微秒
    };

    let total = 0;
    const regex = /(\d+)(ms|us|d|h|m|s)/g;  // 注意顺序：ms/us 在前
    let match: RegExpExecArray | null;

    while ((match = regex.exec(str)) !== null) {
        const value = Number(match[1]);
        const unit = match[2] as TimeUnit;
        total += value * UNIT_MAP[unit];
    }

    return total;
}

/**
 * 检查值是否存在（不为 null 或 undefined）
 * @param val 要检查的值
 * @returns 是否有值
 */
export function hasValue(val: any): boolean {
    return val != null && val !== undefined;
}
