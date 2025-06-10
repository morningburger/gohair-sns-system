// Firebase 설정 및 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyCoQ5UtXw7lu1blqEx7CFQV61dXBDnPGpI",
    authDomain: "gohair-sns-system.firebaseapp.com",
    projectId: "gohair-sns-system",
    storageBucket: "gohair-sns-system.firebasestorage.app",
    messagingSenderId: "241670983626",
    appId: "1:241670983626:web:4d1160f09145f8fdc94933",
    measurementId: "G-RJRRZVZK6L"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 전역으로 Firebase 함수들 노출
window.db = db;
window.firestoreFunctions = {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    setDoc,
    getDoc
};

// 연결 상태 업데이트 함수
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (connected) {
            statusElement.textContent = '🟢 Firebase 연결됨';
            statusElement.className = 'connection-status connected';
        } else {
            statusElement.textContent = '🔴 연결 끊어짐';
            statusElement.className = 'connection-status disconnected';
        }
    }
}

// Firebase 연결 테스트
try {
    const testCollection = collection(db, 'test');
    updateConnectionStatus(true);
    console.log('Firebase 연결 성공');
} catch (error) {
    console.error('Firebase 연결 실패:', error);
    updateConnectionStatus(false);
}

// 전역으로 연결 상태 함수 노출
window.updateConnectionStatus = updateConnectionStatus;

console.log('Firebase 설정 모듈 로딩 완료');