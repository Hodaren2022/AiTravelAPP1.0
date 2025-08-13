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
  ]
}
`;

const getJsonPrompt = (text) => `
請分析以下旅遊行程文字，並嚴格按照這個 JSON 格式回傳結果。請確保所有欄位都是 string 格式。
如果資訊不存在，請回傳空字串 ""。
請不要包含任何 markdown 語法或前後的註解，只需要純粹的 JSON 物件。

JSON 格式:
${JSON_SCHEMA}

行程文字:
"""
${text}
"""
`;

export const handler = async (event) => {
  // 檢查 HTTP 方法是否為 POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text } = JSON.parse(event.body);
    if (!text) {
      return { statusCode: 400, body: 'Bad Request: text is required' };
    }

    const model = genAI.getGenerativeModel({ name: "gemini-pro" });
    const prompt = getJsonPrompt(text);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    // 嘗試解析 AI 回傳的 JSON 字串
    let parsedJson;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON from AI response:", responseText);
      throw new Error("AI 回傳的格式不正確，無法解析。");
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // 開發時使用，生產環境建議指定來源
      },
      body: JSON.stringify(parsedJson),
    };

  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};