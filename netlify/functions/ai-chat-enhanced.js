import { GoogleGenerativeAI } from "@google/generative-ai";

// 從環境變數中取得 API 金鑰
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Google Search 工具配置
const googleSearchTool = {
  googleSearch: {}
};

// Gemini 模型配置
const modelConfig = {
  tools: [googleSearchTool]
};

// 系統提示詞
const SYSTEM_PROMPT = `
你是一個專業的AI旅行助手，專門協助用戶管理旅行計劃和相關數據。

你的主要功能包括：
1. 回答旅遊相關問題
2. 協助分析和管理行程數據
3. 提供旅遊建議和資訊
4. 協助編輯和更新旅行數據
5. 搜索最新的旅遊資訊和天氣資訊
6. 協助建立新的旅行行程

當用戶要求建立、儲存或創建新行程時，你應該：
- 根據用戶提供的資訊（目的地、天數、偏好等）規劃詳細的行程
- 明確表達你將為用戶建立這個行程
- 在回應中包含「建立」、「儲存」或「創建」等關鍵詞，以便系統識別並執行相應的儲存操作

當用戶詢問關於他們的旅行數據時，請基於提供的上下文資訊進行回答。
如果需要修改數據，請明確說明要修改的內容，並等待用戶確認。
當用戶詢問需要最新資訊的問題（如天氣、景點營業時間、交通狀況等）時，你可以使用 Google Search 工具來獲取最新資訊。

請用繁體中文回答，保持友善和專業的語調。
`;

// 處理 Gemini 回應中的 grounding metadata
function processGroundingMetadata(response) {
  try {
    const candidate = response.candidates?.[0];
    if (!candidate?.groundingMetadata) {
      return null;
    }

    const metadata = candidate.groundingMetadata;
    
    // 驗證和清理 metadata 結構
    const processedMetadata = {
      webSearchQueries: Array.isArray(metadata.webSearchQueries) ? metadata.webSearchQueries : [],
      groundingChunks: Array.isArray(metadata.groundingChunks) ? metadata.groundingChunks : [],
      groundingSupports: Array.isArray(metadata.groundingSupports) ? metadata.groundingSupports : [],
      searchEntryPoint: metadata.searchEntryPoint || null
    };

    // 驗證 groundingChunks 結構
    processedMetadata.groundingChunks = processedMetadata.groundingChunks.filter(chunk => {
      return chunk && chunk.web && chunk.web.uri;
    });

    // 驗證 groundingSupports 結構
    processedMetadata.groundingSupports = processedMetadata.groundingSupports.filter(support => {
      return support && 
             support.segment && 
             typeof support.segment.startIndex === 'number' && 
             typeof support.segment.endIndex === 'number' &&
             Array.isArray(support.groundingChunkIndices);
    });

    // 如果沒有有效的搜索結果，返回 null
    if (processedMetadata.groundingChunks.length === 0 && 
        processedMetadata.webSearchQueries.length === 0) {
      return null;
    }

    return processedMetadata;
  } catch (error) {
    console.error('Error processing grounding metadata:', error);
    return null;
  }
}

// 轉換 grounding metadata 為前端格式
function convertMetadataForFrontend(groundingMetadata) {
  if (!groundingMetadata) {
    return null;
  }

  return {
    hasGrounding: true,
    searchQueries: groundingMetadata.webSearchQueries,
    sources: groundingMetadata.groundingChunks.map((chunk, index) => ({
      id: index,
      title: chunk.web.title || '未知來源',
      url: chunk.web.uri,
      domain: extractDomainFromUrl(chunk.web.uri)
    })),
    citationCount: groundingMetadata.groundingSupports.length,
    searchEntryPoint: groundingMetadata.searchEntryPoint
  };
}

// 從 URL 提取域名
function extractDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return '未知域名';
  }
}

// 生成引文的函數
function addCitations(text, groundingMetadata) {
  if (!groundingMetadata || !groundingMetadata.groundingSupports || groundingMetadata.groundingSupports.length === 0) {
    return text;
  }

  const { groundingSupports, groundingChunks } = groundingMetadata;
  let citedText = text;

  // 按 endIndex 降序排序，避免插入時位置偏移
  const sortedSupports = [...groundingSupports].sort(
    (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0)
  );

  for (const support of sortedSupports) {
    const endIndex = support.segment?.endIndex;
    if (endIndex === undefined || !support.groundingChunkIndices?.length) {
      continue;
    }

    // 確保 endIndex 不超過文字長度
    const safeEndIndex = Math.min(endIndex, citedText.length);

    const citationLinks = support.groundingChunkIndices
      .map(i => {
        if (i >= 0 && i < groundingChunks.length) {
          const chunk = groundingChunks[i];
          const uri = chunk?.web?.uri;
          const title = chunk?.web?.title || `來源 ${i + 1}`;
          if (uri) {
            return `[${i + 1}](${uri} "${title}")`;
          }
        }
        return null;
      })
      .filter(Boolean);

    if (citationLinks.length > 0) {
      const citationString = ` ${citationLinks.join(', ')}`;
      citedText = citedText.slice(0, safeEndIndex) + citationString + citedText.slice(safeEndIndex);
    }
  }

  return citedText;
}

// 生成來源列表
function generateSourcesList(groundingMetadata) {
  if (!groundingMetadata || !groundingMetadata.groundingChunks || groundingMetadata.groundingChunks.length === 0) {
    return '';
  }

  const sources = groundingMetadata.groundingChunks.map((chunk, index) => {
    const title = chunk.web?.title || `來源 ${index + 1}`;
    const url = chunk.web?.uri;
    const domain = extractDomainFromUrl(url);
    return `${index + 1}. [${title}](${url}) - ${domain}`;
  });

  return `\n\n**參考來源：**\n${sources.join('\n')}`;
}

// 生成AI回應的提示詞
const getAIPrompt = (message, context, searchResults = null) => `
${SYSTEM_PROMPT}

用戶當前的旅行數據上下文：
${JSON.stringify(context, null, 2)}

${searchResults ? `
最新搜索資訊：
${JSON.stringify(searchResults, null, 2)}

請結合搜索到的最新資訊來回答用戶問題。
` : ''}

用戶問題：${message}

請根據上下文資訊回答用戶的問題。如果需要修改數據，請明確說明要修改什麼，但不要直接執行修改。
如果用戶詢問需要最新資訊的問題，請使用提供的搜索資訊來回答。
`;

// 統一的CORS標頭配置
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

export const handler = async (event) => {
  // 處理OPTIONS預檢請求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // 檢查 HTTP 方法是否為 POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 檢查環境變量
    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        },
        body: JSON.stringify({ 
          error: 'GEMINI_API_KEY environment variable is not configured',
          response: 'AI 服務配置錯誤，請聯繫管理員設置 API 密鑰'
        })
      };
    }

    const { message, context = {} } = JSON.parse(event.body);
    
    if (!message) {
      return { 
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Bad Request: message is required' })
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = getAIPrompt(message, context);

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [googleSearchTool]
    });
    
    const response = await result.response;
    const responseText = await response.text();

    // 處理 grounding metadata
    const groundingMetadata = processGroundingMetadata(response);
    const frontendMetadata = convertMetadataForFrontend(groundingMetadata);

    // 如果有 grounding metadata，添加引文和來源列表
    let finalResponseText = responseText;
    if (groundingMetadata) {
      finalResponseText = addCitations(responseText, groundingMetadata);
      finalResponseText += generateSourcesList(groundingMetadata);
    }

    // 分析回應中是否包含數據修改建議
    const suggestions = analyzeForDataChanges(finalResponseText, context);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      },
      body: JSON.stringify({
        response: finalResponseText,
        suggestions,
        groundingMetadata: frontendMetadata,
        metadata: {
          timestamp: new Date().toISOString(),
          model: "gemini-2.0-flash",
          hasGrounding: !!groundingMetadata,
          searchQueries: groundingMetadata?.webSearchQueries || []
        }
      }),
    };

  } catch (error) {
    console.error("Error processing AI chat request:", error);
    
    // 根據錯誤類型提供更詳細的錯誤信息
    let statusCode = 500;
    let errorMessage = '處理請求時發生錯誤';
    let userMessage = '抱歉，我現在無法處理您的請求。請稍後再試。';
    
    if (error.message?.includes('API key')) {
      statusCode = 403;
      errorMessage = 'Invalid API key';
      userMessage = 'API 密鑰無效，請檢查配置';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
      userMessage = '請求過於頻繁，請稍後再試';
    } else if (error.message?.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'Request timeout';
      userMessage = '請求超時，請重新嘗試';
    }
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      },
      body: JSON.stringify({ 
        error: errorMessage,
        response: userMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  }
};

// 分析AI回應中的數據修改建議
function analyzeForDataChanges(responseText, context) {
  const suggestions = [];
  
  // 檢查是否提到建立新行程
  if (responseText.includes('建立') || responseText.includes('儲存') || responseText.includes('創建') || 
      responseText.includes('新增行程') || responseText.includes('規劃行程')) {
    
    // 檢測建立新行程的意圖
    if ((responseText.includes('行程') || responseText.includes('旅行')) && 
        (responseText.includes('建立') || responseText.includes('儲存') || responseText.includes('創建'))) {
      
      // 從回應中提取行程資訊
      const tripData = extractTripDataFromResponse(responseText, context);
      
      suggestions.push({
        id: `change_${Date.now()}_trip_create`,
        type: 'create',
        category: 'trip',
        field: 'trip',
        newValue: tripData,
        description: 'AI建議建立新的行程',
        targetId: null
      });
    }
  }
  
  // 檢查是否提到修改行程
  if (responseText.includes('修改') || responseText.includes('更新') || responseText.includes('編輯') || 
      responseText.includes('新增') || responseText.includes('刪除') || responseText.includes('調整')) {
    
    // 示例：創建一個測試用的數據變更建議
    // 在實際應用中，這裡應該使用更智能的NLP分析
    if (responseText.includes('行程') && responseText.includes('修改')) {
      suggestions.push({
        id: `change_${Date.now()}_1`,
        type: 'edit',
        category: 'trip',
        field: 'destination',
        oldValue: context.currentTrip?.destination || '未知',
        newValue: '建議的新目的地',
        description: 'AI建議修改行程目的地',
        targetId: context.currentTrip?.id
      });
    }
    
    if (responseText.includes('費用') && (responseText.includes('新增') || responseText.includes('添加'))) {
      suggestions.push({
        id: `change_${Date.now()}_2`,
        type: 'add',
        category: 'expense',
        field: 'expense',
        newValue: {
          amount: 100,
          description: 'AI建議的新費用項目',
          category: '餐飲',
          date: new Date().toISOString().split('T')[0]
        },
        description: 'AI建議新增一筆費用記錄'
      });
    }
    
    if (responseText.includes('筆記') && responseText.includes('新增')) {
      suggestions.push({
        id: `change_${Date.now()}_3`,
        type: 'add',
        category: 'note',
        field: 'note',
        newValue: {
          title: 'AI建議的筆記',
          content: '這是AI根據對話內容建議添加的筆記',
          category: '一般'
        },
        description: 'AI建議新增一條筆記'
      });
    }
  }
  
  return suggestions;
}

// 從AI回應中提取行程資訊
function extractTripDataFromResponse(responseText, context) {
  // 預設的行程資料結構
  const defaultTripData = {
    id: `trip_${Date.now()}`,
    destination: '台北',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 預設2天後
    budget: 0,
    status: 'planning',
    description: '',
    itinerary: [],
    hotels: [],
    flights: [],
    createdAt: new Date().toISOString()
  };

  // 嘗試從回應中提取目的地
  const destinationMatch = responseText.match(/(?:台北|東京|大阪|首爾|曼谷|新加坡|香港|澳門|上海|北京|巴黎|倫敦|紐約|洛杉磯|雪梨|墨爾本)/);
  if (destinationMatch) {
    defaultTripData.destination = destinationMatch[0];
  }

  // 嘗試從回應中提取天數
  const daysMatch = responseText.match(/(\d+)\s*(?:天|日)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    defaultTripData.endDate = new Date(Date.now() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  // 嘗試從回應中提取行程內容
  if (responseText.includes('第一天') || responseText.includes('第二天') || responseText.includes('第三天')) {
    const itineraryItems = [];
    const dayMatches = responseText.match(/第[一二三四五六七八九十]+天[：:](.*?)(?=第[一二三四五六七八九十]+天|$)/gs);
    
    if (dayMatches) {
      dayMatches.forEach((dayMatch, index) => {
        const dayContent = dayMatch.replace(/第[一二三四五六七八九十]+天[：:]/, '').trim();
        itineraryItems.push({
          id: `day_${index + 1}`,
          day: index + 1,
          date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          activities: dayContent.split(/[，。、]/).filter(activity => activity.trim().length > 0).map(activity => ({
            id: `activity_${Date.now()}_${Math.random()}`,
            time: '',
            activity: activity.trim(),
            location: '',
            notes: ''
          }))
        });
      });
      defaultTripData.itinerary = itineraryItems;
    }
  }

  return defaultTripData;
}