// 인증 관리 모듈 (세션 저장 기능 추가)

class AuthManager {
    constructor() {
        this.currentUser = null;
        // 페이지 로드 시 저장된 세션 확인
        this.loadSessionUser();
    }

    // 세션에서 사용자 정보 로드
    loadSessionUser() {
        try {
            const savedUser = sessionStorage.getItem('currentUser'); // 키 통일
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.updateUI();
                console.log('저장된 세션에서 로그인 복원:', this.currentUser.name);
            }
        } catch (error) {
            console.error('세션 로드 오류:', error);
            sessionStorage.removeItem('currentUser'); // 키 통일
        }
    }

    // 세션에 사용자 정보 저장
    saveSessionUser() {
        if (this.currentUser) {
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser)); // 키 통일
        }
    }

    // 로그인 처리
    async login(email, password) {
        try {
            const user = await window.dataManager.getUser(email);
            if (user && user.password === password) {
                // users.html에서 기대하는 구조로 변환
                this.currentUser = {
                    id: email.replace('@', '_').replace('.', '_'), // 고유 ID 생성
                    docId: email,
                    name: user.name,
                    email: email,
                    role: user.role === 'admin' ? '전체관리자' : '지점관리자', // 역할명 통일
                    branch: user.branch || null,
                    branchCode: user.branchCode || null,
                    phone: user.phone || null,
                    status: user.status || 'active',
                    createdAt: user.createdAt || new Date().toISOString().split('T')[0],
                    lastLogin: new Date().toISOString()
                };
                
                this.saveSessionUser(); // 세션에 저장
                this.updateUI();
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            return { success: false, message: '로그인 중 오류가 발생했습니다.' };
        }
    }

    // 회원가입 처리
    async signup(email, password, name, branch) {
        try {
            // 이메일 중복 체크
            const existingUser = await window.dataManager.getUser(email);
            if (existingUser) {
                return { success: false, message: '이미 등록된 이메일입니다.' };
            }

            // 새 사용자 추가
            const newUser = {
                password: password,
                role: '지점관리자', // 역할명 통일
                name: name,
                branch: branch,
                email: email,
                phone: null,
                status: 'active',
                createdAt: new Date().toISOString().split('T')[0]
            };

            await window.dataManager.addUser(email, newUser);
            return { success: true, message: '가입이 완료되었습니다.' };
        } catch (error) {
            console.error('가입 오류:', error);
            return { success: false, message: '가입 중 오류가 발생했습니다.' };
        }
    }

    // 로그아웃
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser'); // 키 통일
        this.showLoginPage();
    }

    // UI 업데이트
    updateUI() {
        if (this.currentUser) {
            // 로그인 성공 시 메인 시스템 표시
            const loginPage = document.getElementById('loginPage');
            const signupPage = document.getElementById('signupPage');
            const mainSystem = document.getElementById('mainSystem');
            
            if (loginPage) loginPage.classList.add('hidden');
            if (signupPage) signupPage.classList.add('hidden');
            if (mainSystem) mainSystem.classList.remove('hidden');
            
            // 사용자 이름 표시
            const userElement = document.getElementById('currentUser');
            if (userElement) {
                if (this.currentUser.role === '전체관리자') {
                    userElement.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
                } else {
                    userElement.textContent = `${this.currentUser.name} (${this.currentUser.role} - ${this.currentUser.branch || '지점미지정'})`;
                }
            }
            
            // 관리자 메뉴 표시/숨김
            const adminMenus = document.querySelectorAll('.admin-only');
            adminMenus.forEach(menu => {
                if (this.currentUser.role === '전체관리자') { // 역할명 통일
                    menu.classList.remove('hidden');
                } else {
                    menu.classList.add('hidden');
                }
            });
        }
    }

    // 로그인 페이지 표시
    showLoginPage() {
        const loginPage = document.getElementById('loginPage');
        const signupPage = document.getElementById('signupPage');
        const mainSystem = document.getElementById('mainSystem');
        
        if (loginPage) loginPage.classList.remove('hidden');
        if (signupPage) signupPage.classList.add('hidden');
        if (mainSystem) mainSystem.classList.add('hidden');
        
        // 폼 리셋
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
    }

    // 회원가입 페이지 표시
    showSignupPage() {
        const loginPage = document.getElementById('loginPage');
        const signupPage = document.getElementById('signupPage');
        const mainSystem = document.getElementById('mainSystem');
        
        if (loginPage) loginPage.classList.add('hidden');
        if (signupPage) signupPage.classList.remove('hidden');
        if (mainSystem) mainSystem.classList.add('hidden');
    }

    // 현재 사용자 정보 반환
    getCurrentUser() {
        return this.currentUser;
    }

    // 사용자 권한 확인
    isAdmin() {
        return this.currentUser && this.currentUser.role === '전체관리자'; // 역할명 통일
    }

    isBranchManager() { // 새 메서드 추가
        return this.currentUser && this.currentUser.role === '지점관리자';
    }

    isLeader() { // 기존 호환성 유지
        return this.isBranchManager();
    }

    // 로그인 상태 확인
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 사용자 지점 반환
    getUserBranch() {
        return this.currentUser ? this.currentUser.branch : null;
    }
}

// 인증 이벤트 핸들러 설정
function setupAuthEventHandlers() {
    // 로그인 폼 이벤트
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = await window.authManager.login(email, password);
            if (result.success) {
                // 로그인 성공 후 대시보드 로드
                if (window.showPage) {
                    window.showPage('dashboard');
                }
                if (window.loadInitialData) {
                    await window.loadInitialData();
                }
                if (window.loadDashboard) {
                    window.loadDashboard();
                }
            } else {
                alert(result.message);
            }
        });
    }

    // 회원가입 폼 이벤트
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const name = document.getElementById('signupName').value;
            const branch = document.getElementById('signupBranch').value;

            const result = await window.authManager.signup(email, password, name, branch);
            if (result.success) {
                alert(result.message + ' 로그인해주세요.');
                window.authManager.showLoginPage();
            } else {
                alert(result.message);
            }
        });
    }
}

// 전역 함수들
function showLogin() {
    window.authManager.showLoginPage();
}

function showSignup() {
    window.authManager.showSignupPage();
}

function logout() {
    window.authManager.logout();
}

// 전역으로 노출
window.AuthManager = AuthManager;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.logout = logout;
window.setupAuthEventHandlers = setupAuthEventHandlers;

console.log('인증 관리 모듈 로딩 완료');