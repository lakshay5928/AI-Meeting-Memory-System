import { Notification } from '../../database/models'

export async function createNotification(data: {
  userId: string
  type: string
  title: string
  message: string
  link?: string
}) {
  try {
    await Notification.create(data)
  } catch (e) {
    console.error('[Notification] Failed to create:', e)
  }
}
