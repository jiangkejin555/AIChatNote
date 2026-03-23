import type { ProviderType, PredefinedModel } from '@/types'

export interface ProviderPreset {
  type: ProviderType
  name: string
  nameEn: string
  defaultApiBase: string
  supportsDynamicModels: boolean
  predefinedModels: PredefinedModel[]
  icon: string // Lucide icon name or emoji
}

export const PROVIDER_PRESETS: Record<ProviderType, ProviderPreset> = {
  openai: {
    type: 'openai',
    name: 'OpenAI',
    nameEn: 'OpenAI',
    defaultApiBase: 'https://api.openai.com/v1',
    supportsDynamicModels: true,
    predefinedModels: [],
    icon: '🤖',
  },
  volcengine: {
    type: 'volcengine',
    name: '火山引擎',
    nameEn: 'Volcengine',
    defaultApiBase: 'https://ark.cn-beijing.volces.com/api/v3',
    supportsDynamicModels: true,
    predefinedModels: [],
    icon: '🌋',
  },
  deepseek: {
    type: 'deepseek',
    name: '深度求索',
    nameEn: 'DeepSeek',
    defaultApiBase: 'https://api.deepseek.com',
    supportsDynamicModels: true,
    predefinedModels: [],
    icon: '🔮',
  },
  anthropic: {
    type: 'anthropic',
    name: 'Anthropic',
    nameEn: 'Anthropic',
    defaultApiBase: 'https://api.anthropic.com/v1',
    supportsDynamicModels: false,
    predefinedModels: [
      { model_id: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet 4' },
      { model_id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet' },
      { model_id: 'claude-3-5-haiku-20241022', display_name: 'Claude 3.5 Haiku' },
      { model_id: 'claude-3-opus-20240229', display_name: 'Claude 3 Opus' },
      { model_id: 'claude-3-sonnet-20240229', display_name: 'Claude 3 Sonnet' },
      { model_id: 'claude-3-haiku-20240307', display_name: 'Claude 3 Haiku' },
    ],
    icon: '🧠',
  },
  google: {
    type: 'google',
    name: 'Google Gemini',
    nameEn: 'Google Gemini',
    defaultApiBase: 'https://generativelanguage.googleapis.com/v1beta',
    supportsDynamicModels: true,
    predefinedModels: [],
    icon: '💎',
  },
  moonshot: {
    type: 'moonshot',
    name: '月之暗面',
    nameEn: 'Moonshot',
    defaultApiBase: 'https://api.moonshot.cn/v1',
    supportsDynamicModels: true,
    predefinedModels: [],
    icon: '🌙',
  },
  zhipu: {
    type: 'zhipu',
    name: '智谱AI',
    nameEn: 'Zhipu AI',
    defaultApiBase: 'https://open.bigmodel.cn/api/paas/v4',
    supportsDynamicModels: true,
    predefinedModels: [
      { model_id: 'glm-4-plus', display_name: 'GLM-4 Plus' },
      { model_id: 'glm-4-0520', display_name: 'GLM-4 0520' },
      { model_id: 'glm-4', display_name: 'GLM-4' },
      { model_id: 'glm-4-air', display_name: 'GLM-4 Air' },
      { model_id: 'glm-4-airx', display_name: 'GLM-4 AirX' },
      { model_id: 'glm-4-flash', display_name: 'GLM-4 Flash' },
      { model_id: 'glm-3-turbo', display_name: 'GLM-3 Turbo' },
    ],
    icon: '⚡',
  },
  custom: {
    type: 'custom',
    name: '自定义',
    nameEn: 'Custom',
    defaultApiBase: '',
    supportsDynamicModels: true,
    predefinedModels: [],
    icon: '⚙️',
  },
}

export const PROVIDER_TYPE_OPTIONS: { value: ProviderType; label: string; labelEn: string }[] = [
  { value: 'openai', label: 'OpenAI', labelEn: 'OpenAI' },
  { value: 'volcengine', label: '火山引擎', labelEn: 'Volcengine' },
  { value: 'deepseek', label: '深度求索', labelEn: 'DeepSeek' },
  { value: 'anthropic', label: 'Anthropic', labelEn: 'Anthropic' },
  { value: 'google', label: 'Google Gemini', labelEn: 'Google Gemini' },
  { value: 'moonshot', label: '月之暗面', labelEn: 'Moonshot' },
  { value: 'zhipu', label: '智谱AI', labelEn: 'Zhipu AI' },
  { value: 'custom', label: '自定义', labelEn: 'Custom' },
]

export function getProviderPreset(type: ProviderType): ProviderPreset {
  return PROVIDER_PRESETS[type]
}

export function getProviderIcon(type: ProviderType): string {
  return PROVIDER_PRESETS[type]?.icon || '⚙️'
}
