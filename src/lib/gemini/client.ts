import {
  analyzeFoodImageServerFn,
  generateRecipesServerFn,
  type AnalyzeFoodImageRequest,
  type AnalyzeFoodImageResponse,
  type GenerateRecipesRequest,
  type GenerateRecipesResponse,
} from '../../server/gemini'
import { localStorageAdapter } from '../storage/localStorageAdapter'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function getClientSettings(): Promise<{ apiKey: string; model: string }> {
  const settings = await localStorageAdapter.getSettings()
  return {
    apiKey: (settings.geminiApiKey || '').trim(),
    model: (settings.geminiModel || 'gemini-3.5-flash-lite').trim(),
  }
}

/**
 * Analyze food image with dual-track fallback:
 * Try Server Function first, fallback to client-side direct call if needed
 */
export async function analyzeFoodImage(
  imageBase64: string,
  mimeType: string,
  mode: 'ingredients' | 'dish' = 'ingredients'
): Promise<AnalyzeFoodImageResponse> {
  const { apiKey: customApiKey, model: customModel } = await getClientSettings()

  try {
    // 1. Try TanStack Start Server Function
    const res = await analyzeFoodImageServerFn({
      data: {
        imageBase64,
        mimeType,
        mode,
        customApiKey,
        customModel,
      },
    })

    if (res.success) {
      return res
    }

    // If server function returns error, check if client fallback is possible
    if (customApiKey) {
      return directClientAnalyzeFood(imageBase64, mimeType, mode, customApiKey)
    }

    return res
  } catch (err: any) {
    console.warn('Server function call failed, attempting client fallback:', err)
    if (customApiKey) {
      return directClientAnalyzeFood(imageBase64, mimeType, mode, customApiKey)
    }
    return {
      success: false,
      mode,
      detectedItems: [],
      overallSummary: '',
      error: err.message || '呼叫伺服器失敗，請檢查網路連線或於設定頁面填寫 Gemini API Key。',
    }
  }
}

/**
 * Generate recipes with dual-track fallback
 */
export async function generateRecipes(
  request: Omit<GenerateRecipesRequest, 'customApiKey' | 'customModel'>
): Promise<GenerateRecipesResponse> {
  const { apiKey: customApiKey, model: customModel } = await getClientSettings()

  try {
    // 1. Try TanStack Start Server Function
    const res = await generateRecipesServerFn({
      data: {
        ...request,
        customApiKey,
        customModel,
      },
    })

    if (res.success) {
      return res
    }

    if (customApiKey) {
      return directClientGenerateRecipes(request, customApiKey, customModel)
    }

    return res
  } catch (err: any) {
    console.warn('Server function call failed, attempting client fallback:', err)
    if (customApiKey) {
      return directClientGenerateRecipes(request, customApiKey, customModel)
    }
    return {
      success: false,
      recipes: [],
      error: err.message || '生成食譜失敗，請檢查網路或於設定頁填寫 API Key。',
    }
  }
}

/**
 * Direct Client Call Fallback using @google/generative-ai
 */
async function directClientAnalyzeFood(
  imageBase64: string,
  mimeType: string,
  mode: 'ingredients' | 'dish',
  apiKey: string,
  preferredModel: string = 'gemini-3.5-flash-lite'
): Promise<AnalyzeFoodImageResponse> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: preferredModel || 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    const isDishMode = mode === 'dish'
    const prompt = isDishMode
      ? `請分析這張料理照片，回傳繁體中文 JSON：{"mode":"dish","dishName":"名稱","description":"特色","detectedItems":[{"name":"食材","category":"vegetable"|"meat"|"seafood"|"dairy_egg"|"fruit"|"grain"|"seasoning"|"other","quantity":數字,"unit":"單位","storageLocation":"fridge"|"freezer"|"room","suggestedExpiryDays":天數,"notes":"備註"}],"overallSummary":"總結"}`
      : `請辨識這張生鮮食材照片中的所有食材，回傳繁體中文 JSON：{"mode":"ingredients","detectedItems":[{"name":"食材","category":"vegetable"|"meat"|"seafood"|"dairy_egg"|"fruit"|"grain"|"seasoning"|"other","quantity":數字,"unit":"單位","storageLocation":"fridge"|"freezer"|"room","suggestedExpiryDays":天數,"notes":"備註"}],"overallSummary":"總結"}`

    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: mimeType || 'image/jpeg',
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const parsed = JSON.parse(result.response.text())

    return {
      success: true,
      mode,
      dishName: parsed.dishName,
      description: parsed.description,
      detectedItems: Array.isArray(parsed.detectedItems) ? parsed.detectedItems : [],
      overallSummary: parsed.overallSummary || '食材分析完成',
    }
  } catch (err: any) {
    return {
      success: false,
      mode,
      detectedItems: [],
      overallSummary: '',
      error: err.message || '客戶端分析失敗，請檢查 API Key 是否有效。',
    }
  }
}

async function directClientGenerateRecipes(
  request: Omit<GenerateRecipesRequest, 'customApiKey' | 'customModel'>,
  apiKey: string,
  preferredModel: string = 'gemini-3.5-flash-lite'
): Promise<GenerateRecipesResponse> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: preferredModel || 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    })

    const ingredientsListText = request.ingredients
      .map((i) => `${i.name} (約 ${i.quantity || 1} ${i.unit || '份'})`)
      .join('、')

    const prompt = `依現有食材【${ingredientsListText}】生成 3 道詳細繁體中文食譜，回傳格式：
{"recipes":[{"id":"uuid","title":"菜名","description":"特色","cookingTimeMinutes":分鐘,"difficulty":"easy"|"medium"|"hard","servings":${request.servings || 2},"calories":熱量,"matchedIngredients":["已在庫存"],"missingIngredients":["需自備"],"ingredientsList":[{"name":"食材","amount":"份量","isPantryItem":true}],"prepSteps":["備料步驟"],"cookingSteps":[{"stepNumber":1,"instruction":"步驟","tip":"技巧","timerSeconds":60}],"chefTips":["秘訣"]}]}`

    const result = await model.generateContent([prompt])
    const parsed = JSON.parse(result.response.text())

    return {
      success: true,
      recipes: parsed.recipes || [],
    }
  } catch (err: any) {
    return {
      success: false,
      recipes: [],
      error: err.message || '客戶端生成食譜失敗，請確認 API Key。',
    }
  }
}
