import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化消息时间
 * - 今天：只显示时间 (HH:mm)
 * - 昨天：显示 "昨天 HH:mm"
 * - 今年：显示 "M月D日 HH:mm"
 * - 其他：显示 "YYYY/M/D HH:mm"
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const timeStr = `${hours}:${minutes}`

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return timeStr
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  if (isYesterday) {
    return `昨天 ${timeStr}`
  }

  const month = date.getMonth() + 1
  const day = date.getDate()
  const dateStr = `${month}月${day}日`

  if (date.getFullYear() === now.getFullYear()) {
    return `${dateStr} ${timeStr}`
  }

  return `${date.getFullYear()}/${month}/${day} ${timeStr}`
}
