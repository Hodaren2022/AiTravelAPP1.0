import { GoogleGenerativeAI } from "@google/generative-ai";

// 從環境變數中取得 API 金鑰
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 定義我們期望 AI 回傳的 JSON 結構
const JSON_SCHEMA = `
{
  "tripName": "string",
  "destination": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "description": "string",
  "flights": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "airline": "string",
      "flightNumber": "string",
      "departureCity": "string (IATA code)",
      "arrivalCity": "string (IATA code)",
      "departureTime": "HH:MM",
      "arrivalTime": "HH:MM",
      "duration": "string"
    }
  ],
  "hotels": [
    {
      "id": "string",
      "name": "string",
      "checkInDate": "YYYY-MM-DD",
      "checkOutDate": "YYYY-MM-DD",
      "address": "string",
      "contact": "string",
      "notes": "string"
    }
  ],
  "dailyItinerary": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "location": "string",
      "activity": "string",
      "time": "HH:MM",
      "notes": "string"
    }
  ]
}
`;

const getJsonPrompt = (text) => `
請分析以下旅遊行程文字，並嚴格按照這個 JSON 格式回傳結果。請確保所有欄位都是 string 格式。
如果資訊不存在，請回傳空字串 ""。
請不要包含任何 markdown 語法或前後的註解，只需要純粹的 JSON 物件。

請特別注意提取航班、住宿和每日行程的詳細資訊。
對於住宿，請提供飯店名稱、入住/退房日期、地址、聯絡方式和備註。
對於每日行程，請提供日期、地點、活動和時間。

JSON 格式:
${JSON_SCHEMA}

行程文字:
"""
${text}
"""
`;

// 統一的CORS標頭配置
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
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
    const { text } = JSON.parse(event.body);
    if (!text) {
      return { 
        statusCode: 400, 
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        },
        body: JSON.stringify({ error: 'Bad Request: text is required' })
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = getJsonPrompt(text);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    // 嘗試從 Markdown 程式碼區塊中提取 JSON 字串
    let jsonString = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    }

    // 嘗試解析 AI 回傳的 JSON 字串
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON from AI response:", responseText);
      throw new Error("AI 回傳的格式不正確，無法解析。");
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      },
      body: JSON.stringify(parsedJson),
    };

  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};