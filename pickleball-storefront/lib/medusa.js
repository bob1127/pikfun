import Medusa from "@medusajs/medusa-js"

/** 正式 Medusa API（Railway） */
export const DEFAULT_MEDUSA_BACKEND_URL =
  "https://pikfun-backend-production.up.railway.app"

export function getMedusaBackendUrl() {
  if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL.replace(/\/$/, "")
  }
  return process.env.NODE_ENV === "development"
    ? "http://localhost:9000"
    : DEFAULT_MEDUSA_BACKEND_URL
}

export function getMedusaFetchHeaders() {
  const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  const headers = { "Content-Type": "application/json" }
  if (API_KEY) headers["x-publishable-api-key"] = API_KEY
  return headers
}

/** @deprecated Prefer getMedusaBackendUrl + getMedusaFetchHeaders */
export function getMedusaConfig() {
  return {
    BACKEND_URL: getMedusaBackendUrl(),
    headers: getMedusaFetchHeaders(),
    API_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  }
}

export const medusa = new Medusa({
  baseUrl: getMedusaBackendUrl(),
  maxRetries: 3,
  publishableApiKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

export const getMedusaCategories = async () => {
  try {
    const { product_categories } = await medusa.productCategories.list()
    return product_categories
  } catch (error) {
    console.error("Medusa 分類抓取失敗:", error)
    return []
  }
}

export const getMedusaBrands = async () => {
  try {
    const { collections } = await medusa.collections.list()
    return collections
  } catch (error) {
    console.error("Medusa 品牌抓取失敗:", error)
    return []
  }
}
