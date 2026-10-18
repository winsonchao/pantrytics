import { createServerFn } from '@tanstack/react-start'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Recipe, IngredientCategory, StorageLocation } from '../lib/storage/types'

export interface AnalyzeFoodImageRequest {
  imageBase64: string
  mimeType: string
  mode?: 'ingredients' | 'dish'
  customApiKey?: string
  customModel?: string
}

export interface DetectedFoodItem {
  name: string
  category: IngredientCategory
  quantity: number
  unit: string
  storageLocation: StorageLocation
  suggestedExpiryDays?: number
  notes?: string
}

export interface AnalyzeFoodImageResponse {
  success: boolean
  mode: 'ingredients' | 'dish'
  dishName?: string
  description?: string
  detectedItems: DetectedFoodItem[]
  overallSummary: string
  error?: string
}

export interface GenerateRecipesRequest {
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>
  seasonings?: string[]
  cuisineStyle?: string
  timeLimit?: string
  servings?: number
  kitchenTools?: string[]
  customNotes?: string
  customApiKey?: string
  customModel?: string
}

export interface GenerateRecipesResponse {
  success: boolean
  recipes: Recipe[]
  error?: string
}

function getGeminiApiKey(customKey?: string): string {
  const envKey = process.env.GEMINI_API_KEY
  const apiKey = (customKey || envKey || '').trim()
  if (!apiKey) {
    throw new Error('未提供 Gemini API Key。請在設定頁面填寫免費 Gemini API Key，或於伺服器配置 GEMINI_API_KEY。')
  }
  return apiKey
}

function getTargetModelName(customModel?: string): string {
  return (customModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim()
}

async function generateContentWithFallback(
  genAI: GoogleGenerativeAI,
  preferredModel: string,
  config: any,
  contents: any[]
) {
  const candidates = Array.from(new Set([
    preferredModel,
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
  ]))

  let lastError: any = null
  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: config,
      })
      const result = await model.generateContent(contents)
      return { result, usedModel: modelName }
    } catch (err: any) {
      lastError = err
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('not found') || msg.includes('models/') || msg.includes('404') || msg.includes('unsupported')) {
        console.warn(`Model ${modelName} not available, trying next fallback...`)
        continue
      }
      throw err
    }
  }
  throw lastError
}

/**
 * Server Function: Analyze food image using Gemini Vision API
 */
export const analyzeFoodImageServerFn = createServerFn({ method: 'POST' })
  .validator((d: AnalyzeFoodImageRequest) => d)
  .handler(async ({ data }): Promise<AnalyzeFoodImageResponse> => {
    try {
      const apiKey = getGeminiApiKey(data.customApiKey)
      const genAI = new GoogleGenerativeAI(apiKey)
      const targetModel = getTargetModelName(data.customModel)

      const isDishMode = data.mode === 'dish'

      const prompt = isDishMode
        ? `你是一位專業五星級主廚與食材分析師。請分析這張照片中的成品料理菜餚。
請務必輸出純 JSON 格式，符合以下結構：
{
  "mode": "dish",
  "dishName": "料理名稱（繁體中文，例如：三杯雞）",
  "description": "這道菜的口味特色與簡介（繁體中文）",
  "detectedItems": [
    {
      "name": "食材名稱（繁體中文）",
      "category": "vegetable" | "meat" | "seafood" | "dairy_egg" | "fruit" | "grain" | "seasoning" | "other",
      "quantity": 數字 (預估份量),
      "unit": "單位（例如：克、顆、根、匙）",
      "storageLocation": "fridge" | "freezer" | "room",
      "suggestedExpiryDays": 數字 (建議保存天數),
      "notes": "備註或烹調用途"
    }
  ],
  "overallSummary": "這道料理的整體分析與烹飪技巧概述（繁體中文）"
}`
        : `你是一位專業主廚與智慧冰箱食材管理專家。請仔細辨識這張照片中的所有生鮮食材、蔬果、肉類或食品。
請盡可能辨識出照片中所有看得見的食材，並推估適當的份量、單位與保存方式。
請務必輸出純 JSON 格式，符合以下結構：
{
  "mode": "ingredients",
  "detectedItems": [
    {
      "name": "食材名稱（繁體中文，例如：高麗菜、大蒜、雞蛋、牛肉片）",
      "category": "vegetable" | "meat" | "seafood" | "dairy_egg" | "fruit" | "grain" | "seasoning" | "other",
      "quantity": 數字 (推估數量，例如：1、2、300),
      "unit": "單位（繁體中文，例如：顆、把、盒、克、包、朵）",
      "storageLocation": "fridge" | "freezer" | "room",
      "suggestedExpiryDays": 數字 (冷藏或保存建議天數，例如：3、7、30),
      "notes": "外觀新鮮度或處理建議（繁體中文，例如：表面新鮮翠綠，建議冷藏前擦乾水氣）"
    }
  ],
  "overallSummary": "辨識總結與食材搭配建議（繁體中文，約 50 字）"
}`

      const imagePart = {
        inlineData: {
          data: data.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: data.mimeType || 'image/jpeg',
        },
      }

      const { result } = await generateContentWithFallback(
        genAI,
        targetModel,
        {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
        [prompt, imagePart]
      )

      const text = result.response.text()
      const parsed = JSON.parse(text)

      return {
        success: true,
        mode: isDishMode ? 'dish' : 'ingredients',
        dishName: parsed.dishName,
        description: parsed.description,
        detectedItems: Array.isArray(parsed.detectedItems) ? parsed.detectedItems : [],
        overallSummary: parsed.overallSummary || '食材分析完成',
      }
    } catch (err: any) {
      console.error('Error in analyzeFoodImageServerFn:', err)
      return {
        success: false,
        mode: data.mode || 'ingredients',
        detectedItems: [],
        overallSummary: '',
        error: err.message || '分析圖片失敗，請檢查 API Key 是否正確或稍後重試。',
      }
    }
  })

/**
 * Server Function: Generate customized recipes from available ingredients
 */
export const generateRecipesServerFn = createServerFn({ method: 'POST' })
  .validator((d: GenerateRecipesRequest) => d)
  .handler(async ({ data }): Promise<GenerateRecipesResponse> => {
    try {
      const apiKey = getGeminiApiKey(data.customApiKey)
      const genAI = new GoogleGenerativeAI(apiKey)
      const targetModel = getTargetModelName(data.customModel)

      const ingredientsListText = data.ingredients
        .map((i) => `${i.name} (約 ${i.quantity || 1} ${i.unit || '份'})`)
        .join('、')

      const seasoningsText = data.seasonings && data.seasonings.length > 0
        ? data.seasonings.join('、')
        : '基本鹽、油、醬油、白胡椒'

      const toolsText = data.kitchenTools && data.kitchenTools.length > 0
        ? data.kitchenTools.join('、')
        : '炒鍋、湯鍋'

      const prompt = `你是一位精通家常菜與各國料理的星級大廚與食譜研發專家。
使用者希望「依現有食材」生成 3 道最適合、美味且步驟明確的料理教學食譜。

【使用者的食材與條件】
- 現有食材：${ingredientsListText || '常見蔬菜、雞蛋、肉片'}
- 常備調味料：${seasoningsText}
- 偏好料理風格：${data.cuisineStyle || '台式家常料理'}
- 烹調時間限制：${data.timeLimit || '30分鐘以內'}
- 用餐人數：${data.servings || 2} 人份
- 現有廚房設備：${toolsText}
- 額外偏好與要求：${data.customNotes || '無特殊限制'}

【生成要求】
1. 嚴格以現有食材為主體進行發揮，盡可能消耗冰箱庫存。
2. 每道菜須提供詳盡的食材比例、備料指示與逐步烹調步驟。
3. 在關鍵需要控制時間的步驟（如：大火快炒、小火悶煮、醃漬），請提供明確的計時秒數 (timerSeconds，例如 180 秒代表 3 分鐘)，以便使用者在烹飪時開啟倒數計時器。
4. 提供 2~3 個主廚秘訣 (chefTips)，傳授好吃的火候與調味關鍵。

請務必輸出純 JSON 格式，其結構如下：
{
  "recipes": [
    {
      "id": "recipe-uuid-或亂數",
      "title": "菜餚名稱（繁體中文，例如：香蔥蒜炒嫩雞丁）",
      "description": "簡介特色與風味（繁體中文，約 30~50 字）",
      "cookingTimeMinutes": 數字 (總耗時分鐘數),
      "difficulty": "easy" | "medium" | "hard",
      "servings": ${data.servings || 2},
      "calories": 數字 (預估每人份卡路里),
      "matchedIngredients": ["庫存中用到的食材名稱"],
      "missingIngredients": ["建議自備或額外添加的配料，盡量少且非必要"],
      "ingredientsList": [
        { "name": "食材名稱", "amount": "精確份量（例如：200克、半顆）", "isPantryItem": true/false }
      ],
      "prepSteps": [
        "步驟1: 雞肉洗淨切成一口大小，以少許醬油抓醃...",
        "步驟2: 蒜頭切碎、青蔥切段備用..."
      ],
      "cookingSteps": [
        {
          "stepNumber": 1,
          "instruction": "熱鍋倒入適量食用油，油溫約五成熱時下蒜碎與蔥白爆香至微金黃。",
          "tip": "火候不要太大，避免蒜碎焦黑發苦。",
          "timerSeconds": 45
        },
        {
          "stepNumber": 2,
          "instruction": "轉大火倒入雞丁快速翻炒至表面變白變緊實。",
          "tip": "大火能鎖住肉汁，保持鮮嫩！",
          "timerSeconds": 90
        }
      ],
      "chefTips": [
        "肉類下鍋前擦乾多餘水分，下鍋翻炒更不易出水發柴。",
        "起鍋前淋入幾滴香油或鍋邊醋，能瞬間提升香氣層次！"
      ]
    }
  ]
}`

      const { result } = await generateContentWithFallback(
        genAI,
        targetModel,
        {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
        [prompt]
      )
      const text = result.response.text()
      const parsed = JSON.parse(text)

      const recipes: Recipe[] = (parsed.recipes || []).map((r: any, idx: number) => ({
        id: r.id || `recipe-${Date.now()}-${idx + 1}`,
        title: r.title || '特製家常料理',
        description: r.description || '',
        cookingTimeMinutes: Number(r.cookingTimeMinutes) || 20,
        difficulty: r.difficulty === 'hard' ? 'hard' : r.difficulty === 'medium' ? 'medium' : 'easy',
        servings: Number(r.servings) || data.servings || 2,
        calories: Number(r.calories) || 350,
        matchedIngredients: Array.isArray(r.matchedIngredients) ? r.matchedIngredients : [],
        missingIngredients: Array.isArray(r.missingIngredients) ? r.missingIngredients : [],
        ingredientsList: Array.isArray(r.ingredientsList) ? r.ingredientsList : [],
        prepSteps: Array.isArray(r.prepSteps) ? r.prepSteps : [],
        cookingSteps: Array.isArray(r.cookingSteps) ? r.cookingSteps : [],
        chefTips: Array.isArray(r.chefTips) ? r.chefTips : [],
        createdAt: new Date().toISOString(),
        isSaved: false,
      }))

      return {
        success: true,
        recipes,
      }
    } catch (err: any) {
      console.error('Error in generateRecipesServerFn:', err)
      return {
        success: false,
        recipes: [],
        error: err.message || '生成食譜失敗，請確認 API Key 是否有效。',
      }
    }
  })
