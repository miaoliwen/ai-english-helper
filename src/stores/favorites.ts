import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { FavoriteItem } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'
import { saveFavorite, getAllFavorites, deleteFavorite, searchFavorites } from '@/db'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FavoriteItem[]>([])

  async function loadAll() {
    favorites.value = await getAllFavorites()
  }

  async function add(item: Omit<FavoriteItem, 'id' | 'createdAt'>) {
    const favorite: FavoriteItem = { ...item, id: uuidv4(), createdAt: Date.now() }
    await saveFavorite(favorite)
    favorites.value = await getAllFavorites()
    return favorite
  }

  async function remove(id: string) {
    await deleteFavorite(id)
    favorites.value = await getAllFavorites()
  }

  async function search(query: string) {
    if (!query.trim()) {
      favorites.value = await getAllFavorites()
      return
    }
    favorites.value = await searchFavorites(query)
  }

  return { favorites, loadAll, add, remove, search }
})
