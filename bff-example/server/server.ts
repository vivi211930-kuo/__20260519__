import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: new URL("../.env", import.meta.url).pathname })

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

//Middleware 設置
app.use(cors());
app.use(express.json());

//建立一個簡單的GET API,用來測試伺服器是否正常運作

app.get("/api/status", (req, res) => {
    res.json({ message: "BFF伺服器運作正常!", status: "ok" });
});

app.post("/api/chat", async (req, res) => {
    try {
        //檢查有沒有設定環境變數
        if (!process.env.GEMINI_API_KEY) {
            return res
                .status(500)
                .json({ error: "找不到GEMINI_API_KEY 環境變數設定。" });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "請提供message欄位。" });
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userMessage,
        });

        res.json({
            text: response.text,
        });
    } catch (error) {
        console.error("呼叫Gemini發生錯誤", error);
        res.status(500).json({ error: "伺服器內部發生錯誤,請稍後再試。" });
    }
});

// ------------- 部署靜態檔案支援 -------------
// 當這行被啟動，所有的靜態請求都會嘗試到 'dist' 資料夾裡找檔案
app.use(express.static(path.join(__dirname, '../dist')));

// 由於 React 是單頁應用 (SPA)，如果使用者亂打網址或是重新整理
// Express 必須統一回傳 index.html，把路由的決定權交環給 React 處理。
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});
// ------------------------------------------

//啟動伺服器
app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Express伺服器已經啟動:http://localhost:${PORT}`);
});
