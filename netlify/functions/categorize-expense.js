import { GoogleGenerativeAI } from "@google/generative-ai";

// 從環境變數中取得 API 金鑰
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CATEGORIES = ['餐飲', '交通', '購物', '住宿', '娛樂', '其他'];

const getCategoryPrompt = (description) => `
請分析以下消費描述，並將其分類為以下其中一個類別：
${CATEGORIES.join('、')}

分類規則：
- 餐飲：與食物、飲料、餐廳、用餐相關的消費
- 交通：與交通工具、車票、計程車、租車等相關的消費
- 購物：與購買商品、紀念品、禮物、伴手禮相關的消費
- 住宿：與飯店、旅館、民宿等住宿相關的消費
- 娛樂：與門票、景點、電影、表演、遊樂園等娛樂活動相關的消費
- 其他：不屬於以上類別的消費

請只回傳一個類別名稱，不需要其他說明。

消費描述：${description}
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
    const { description } = JSON.parse(event.body);
    if (!description) {
      return { 
        statusCode: 400, 
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        },
        body: JSON.stringify({ error: 'Bad Request: description is required' })
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = getCategoryPrompt(description);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text().trim();

    // 清理AI回傳的文字，只取類別名稱
    let category = responseText;
    
    // 移除可能的標點符號和空白
    category = category.replace(/[。，、：；]/g, '').trim();
    
    // 如果回傳的不是有效類別，則回傳"其他"
    if (!CATEGORIES.includes(category)) {
      // 嘗試模糊匹配
      const matchedCategory = CATEGORIES.find(cat => 
        responseText.includes(cat) || category.includes(cat)
      );
      category = matchedCategory || '其他';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      },
      body: JSON.stringify({ category }),
    };

  } catch (error) {
    console.error("Error categorizing expense:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      },
      body: JSON.stringify({ error: error.message, category: '其他' }),
    };
  }
};

