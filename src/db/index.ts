import Dexie from 'dexie'
import type { OCRResult, ChatSession, FavoriteItem } from '@/types'

export class AppDatabase extends Dexie {
  ocrResults!: Dexie.Table<OCRResult, string>
  chatSessions!: Dexie.Table<ChatSession, string>
  favorites!: Dexie.Table<FavoriteItem, string>

  constructor() {
    super('AIEnglishHelperDB')
    this.version(1).stores({
      ocrResults: 'id, createdAt',
      chatSessions: 'id, createdAt, updatedAt',
      favorites: 'id, type, createdAt, *tags'
    })
  }
}

export const db = new AppDatabase()

export async function saveOCRResult(result: OCRResult): Promise<void> {
  await db.ocrResults.put(result)
}

export async function getOCRResult(id: string): Promise<OCRResult | undefined> {
  return await db.ocrResults.get(id)
}

export async function getAllOCRResults(): Promise<OCRResult[]> {
  return await db.ocrResults.orderBy('createdAt').reverse().toArray()
}

export async function deleteOCRResult(id: string): Promise<void> {
  await db.ocrResults.delete(id)
}

export async function saveChatSession(session: ChatSession): Promise<void> {
  await db.chatSessions.put(session)
}

export async function getChatSession(id: string): Promise<ChatSession | undefined> {
  return await db.chatSessions.get(id)
}

export async function getAllChatSessions(): Promise<ChatSession[]> {
  return await db.chatSessions.orderBy('updatedAt').reverse().toArray()
}

export async function deleteChatSession(id: string): Promise<void> {
  await db.chatSessions.delete(id)
}

export async function saveFavorite(item: FavoriteItem): Promise<void> {
  await db.favorites.put(item)
}

export async function getAllFavorites(): Promise<FavoriteItem[]> {
  return await db.favorites.orderBy('createdAt').reverse().toArray()
}

export async function deleteFavorite(id: string): Promise<void> {
  await db.favorites.delete(id)
}

export async function searchFavorites(query: string): Promise<FavoriteItem[]> {
  const all = await getAllFavorites()
  const lowerQuery = query.toLowerCase()
  return all.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}