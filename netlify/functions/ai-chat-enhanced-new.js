import { GoogleGenerativeAI } from "@google/generative-ai";

// 從環境變數中取得 API 金鑰
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Google Search 工具配置
const googleSearchTool = {
  googleSearch: {}
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

當用戶詢問關於他們的旅行數據時，請基於提供的上下文資訊進行回答。
如果需要修改數據，請明確說明要修改的內容，並等待用戶確認。
當用戶詢問需要最新資訊的問題（如天氣、景點營業時間、交通狀況等）時，你可以使用 Google Search 工具來獲取最新資訊。

請用繁體中文回答，保持友善和專業的語調。
`;

// 生成AI回應的提示詞
const getAIPrompt = (message, context) => `
${SYSTEM_PROMPT}

用戶當前的旅行數據上下文：
${JSON.stringify(context, null, 2)}

用戶問題：${message}

請根據上下文資訊回答用戶的問題。如果需要修改數據，請明確說明要修改什麼，但不要直接執行修改。
如果用戶詢問需要最新資訊的問題，請使用 Google Search 工具來獲取最新資訊。
`;

// 處理 Gemini 回應中的 grounding metadata
function processGroundingMetadata(response) {
  const candidate = response.candidates?.[0];
  if (!candidate?.groundingMetadata) {
    return null;
  }

  const metadata = candidate.groundingMetadata;
  return {
    webSearchQueries: metadata.webSearchQueries || [],
    groundingChunks: metadata.groundingChunks || [],
    groundingSupports: metadata.groundingSupports || [],
    searchEntryPoint: metadata.searchEntryPoint || null
  };
}

// 生成引文的函數
function addCitations(text, groundingMetadata) {
  if (!groundingMetadata || !groundingMetadata.groundingSupports) {
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

    const citationLinks = support.groundingChunkIndices
      .map(i => {
        const chunk = groundingChunks[i];
        const uri = chunk?.web?.uri;
        const title = chunk?.web?.title || '來源';
        if (uri) {
          return `[${i + 1}](${uri} "${title}")`;
        }
        return null;
      })
      .filter(Boolean);

    if (citationLinks.length > 0) {
      const citationString = citationLinks.join(', ');
      citedText = citedText.slice(0, endIndex) + citationString + citedText.slice(endIndex);
    }
  }

  return citedText;
}

export const handler = async (event) => {
  // 檢查 HTTP 方法是否為 POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
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
    
    // 如果有 grounding metadata，添加引文
    const textWithCitations = groundingMetadata 
      ? addCitations(responseText, groundingMetadata)
      : responseText;

    // 分析回應中是否包含數據修改建議
    const suggestions = analyzeForDataChanges(textWithCitations, context);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        response: textWithCitations,
        suggestions,
        groundingMetadata,
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
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: error.message || '處理請求時發生錯誤',
        response: '抱歉，我現在無法處理您的請求。請稍後再試。'
      }),
    };
  }
};

// 分析AI回應中的數據修改建議
function analyzeForDataChanges(responseText, context) {
  const suggestions = [];
  
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