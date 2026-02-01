import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: 請將下方的設定替換為您自己的 Firebase 專案設定
// 1. 前往 https://console.firebase.google.com/
// 2. 建立新專案
// 3. 在專案設定中新增 Web App
// 4. 複製 firebaseConfig 貼上於此
// 5. 在 Firebase Console 開啟 "Authentication" 並啟用 "Google" 登入
// 6. 在 Firebase Console 開啟 "Firestore Database" 並建立資料庫 (設定規則為 request.auth != null)

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
