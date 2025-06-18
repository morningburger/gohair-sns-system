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
role: user.role === '전체관리자' || user.role === 'admin' ? '전체관리자' : '지점관리자', // 역할명 통일
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
 async signup(email, password, name, position, branch) {
    try {
        // 이메일 중복 체크
        const existingUser = await window.dataManager.getUser(email);
        if (existingUser) {
            return { success: false, message: '이미 등록된 이메일입니다.' };
        }

        // 새 사용자 추가
        const newUser = {
            password: password,
            role: '지점관리자',
            name: name,
            position: position,
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

// 비밀번호 찾기
async findPassword(email) {
    try {
        const user = await window.dataManager.getUser(email);
        if (user) {
            return { success: true, password: user.password, name: user.name };
        } else {
            return { success: false, message: '등록되지 않은 이메일입니다.' };
        }
    } catch (error) {
        console.error('비밀번호 찾기 오류:', error);
        return { success: false, message: '비밀번호 찾기 중 오류가 발생했습니다.' };
    }
}

// 비밀번호 변경
async changePassword(currentPassword, newPassword) {
    try {
        if (!this.currentUser) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        // 현재 비밀번호 확인
        const user = await window.dataManager.getUser(this.currentUser.email);
        if (!user || user.password !== currentPassword) {
            return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
        }

        // 새 비밀번호로 업데이트
        const updatedUser = { ...user, password: newPassword };
        await window.dataManager.updateUser(this.currentUser.email, updatedUser);
        
        return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        return { success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' };
    }
}

// 관리자용 비밀번호 변경
async adminChangePassword(userEmail, newPassword) {
    try {
        if (!this.currentUser || this.currentUser.role !== '전체관리자') {
            return { success: false, message: '권한이 없습니다.' };
        }

        const user = await window.dataManager.getUser(userEmail);
        if (!user) {
            return { success: false, message: '사용자를 찾을 수 없습니다.' };
        }

        const updatedUser = { ...user, password: newPassword };
        await window.dataManager.updateUser(userEmail, updatedUser);
        
        return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
    } catch (error) {
        console.error('관리자 비밀번호 변경 오류:', error);
        return { success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' };
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
        const passwordResetPage = document.getElementById('passwordResetPage');
        const mainSystem = document.getElementById('mainSystem');
        
        if (loginPage) loginPage.classList.remove('hidden');
        if (signupPage) signupPage.classList.add('hidden');
        if (passwordResetPage) passwordResetPage.classList.add('hidden');
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
        const passwordResetPage = document.getElementById('passwordResetPage');
        const mainSystem = document.getElementById('mainSystem');
        
        if (loginPage) loginPage.classList.add('hidden');
        if (signupPage) signupPage.classList.remove('hidden');
        if (passwordResetPage) passwordResetPage.classList.add('hidden');
        if (mainSystem) mainSystem.classList.add('hidden');
    }

    // 비밀번호 찾기 페이지 표시
    showPasswordResetPage() {
        const loginPage = document.getElementById('loginPage');
        const signupPage = document.getElementById('signupPage');
        const passwordResetPage = document.getElementById('passwordResetPage');
        const mainSystem = document.getElementById('mainSystem');
        
        if (loginPage) loginPage.classList.add('hidden');
        if (signupPage) signupPage.classList.add('hidden');
        if (passwordResetPage) passwordResetPage.classList.remove('hidden');
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
        const confirmPassword = document.getElementById('signupPasswordConfirm').value;
        const name = document.getElementById('signupName').value;
        const position = document.getElementById('signupPosition').value;
        const branch = document.getElementById('signupBranch').value;

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const result = await window.authManager.signup(email, password, name, position, branch);
        if (result.success) {
            alert(result.message + ' 로그인해주세요.');
            window.authManager.showLoginPage();
        } else {
            alert(result.message);
        }
    });
}

    // 비밀번호 찾기 폼 이벤트
    const passwordResetForm = document.getElementById('passwordResetForm');
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail').value;
            const result = await window.authManager.findPassword(email);
            
            if (result.success) {
                alert(`${result.name}님의 비밀번호는 "${result.password}" 입니다.\n보안을 위해 로그인 후 비밀번호를 변경해주세요.`);
                window.authManager.showLoginPage();
            } else {
                alert(result.message);
            }
        });
    }

    // 비밀번호 변경 폼 이벤트
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('newPasswordConfirm').value;
            
            if (newPassword !== confirmPassword) {
                alert('새 비밀번호가 일치하지 않습니다.');
                return;
            }
            
            const result = await window.authManager.changePassword(currentPassword, newPassword);
            
            if (result.success) {
                alert(result.message);
                hideChangePassword();
            } else {
                alert(result.message);
            }
        });
    }

    // 비밀번호 확인 실시간 검증
    const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');
    if (signupPasswordConfirm) {
        signupPasswordConfirm.addEventListener('input', function() {
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = this.value;
            const message = document.getElementById('passwordMatchMessage');
            
            if (confirmPassword === '') {
                message.textContent = '';
            } else if (password === confirmPassword) {
                message.textContent = '✅ 비밀번호가 일치합니다';
                message.style.color = '#10b981';
            } else {
                message.textContent = '❌ 비밀번호가 일치하지 않습니다';
                message.style.color = '#ef4444';
            }
        });
    }

    const newPasswordConfirm = document.getElementById('newPasswordConfirm');
    if (newPasswordConfirm) {
        newPasswordConfirm.addEventListener('input', function() {
            const password = document.getElementById('newPassword').value;
            const confirmPassword = this.value;
            const message = document.getElementById('newPasswordMatchMessage');
            
            if (confirmPassword === '') {
                message.textContent = '';
            } else if (password === confirmPassword) {
                message.textContent = '✅ 비밀번호가 일치합니다';
                message.style.color = '#10b981';
            } else {
                message.textContent = '❌ 비밀번호가 일치하지 않습니다';
                message.style.color = '#ef4444';
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

// 비밀번호 변경 모달 관리 함수
function hideChangePassword() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.add('hidden');
        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.reset();
        }
        const message = document.getElementById('newPasswordMatchMessage');
        if (message) {
            message.textContent = '';
        }
    }
}

// 비밀번호 찾기 페이지 표시 함수
function showPasswordReset() {
    window.authManager.showPasswordResetPage();
}

// 전역으로 노출
window.AuthManager = AuthManager;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.showPasswordReset = showPasswordReset;
window.logout = logout;
window.setupAuthEventHandlers = setupAuthEventHandlers;

console.log('인증 관리 모듈 로딩 완료');
