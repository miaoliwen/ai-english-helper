// src/types/config.ts

// API格式类型
export type ApiFormat = 'openai' | 'deepseek' | 'zhipu' | 'auto'

// 自定义模型配置
export interface CustomModelConfig {
  id: string
  name: string           // 预设名称
  apiKey: string         // API Key（加密存储）
  baseUrl: string        // Base URL
  modelId: string        // 模型ID（自动拉取或手动输入）
  apiFormat: ApiFormat   // API格式
}

// 服务端模型配置
export interface ServerModelConfig {
  id: string
  name: string           // 模型名称
  modelId: string        // 模型ID
  description?: string   // 描述信息
  available: boolean     // 是否可用
  type?: string
  providerName?: string
}

// 全局配置
export interface AppConfig {
  mode: 'custom' | 'server'           // 全局模式
  customModels: CustomModelConfig[]   // 自定义模型列表
  serverModels: ServerModelConfig[]   // 服务端模型列表
  activeChatId: string                // 当前激活的对话模型ID
  activeVisionId: string              // 当前激活的视觉模型ID
}

// 模型类型（对话/视觉）
export type ModelType = 'chat' | 'vision'

// 模型列表响应
export interface ModelListResponse {
  models: Array<{
    id: string
    name?: string
  }>
}