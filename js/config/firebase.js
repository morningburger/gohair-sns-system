// Firebase 설정 및 초기화 (CDN 방식)

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
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 전역으로 Firebase 객체들 노출
window.db = db;
window.firebase = firebase;
window.firestoreFunctions = {
    collection: firebase.firestore.collection,
    doc: firebase.firestore.doc,
    addDoc: firebase.firestore.addDoc,
    getDocs: firebase.firestore.getDocs,
    getDoc: firebase.firestore.getDoc,
    updateDoc: firebase.firestore.updateDoc,
    deleteDoc: firebase.firestore.deleteDoc,
    onSnapshot: firebase.firestore.onSnapshot,
    setDoc: firebase.firestore.setDoc
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
    // Firestore 컬렉션 참조 테스트
    db.collection('test');
    updateConnectionStatus(true);
    console.log('Firebase 연결 성공');
} catch (error) {
    console.error('Firebase 연결 실패:', error);
    updateConnectionStatus(false);
}

// 전역으로 연결 상태 함수 노출
window.updateConnectionStatus = updateConnectionStatus;

console.log('Firebase 설정 모듈 로딩 완료');
