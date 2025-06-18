// 🔍 디버깅: 현재 경로 확인
console.log('현재 URL:', window.location.href);
console.log('현재 경로:', window.location.pathname);
console.log('베이스 URL:', window.location.origin);


// 동적 네비게이션 컴포넌트
class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPageId();
        this.currentUser = this.getCurrentUser();
    }

    // 현재 페이지 ID 가져오기
    getCurrentPageId() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        
        // 메인 페이지 처리
        if (filename === 'index' || filename === '' || path.endsWith('/')) {
            return 'dashboard';
        }
        
        return filename;
    }

    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('사용자 정보 파싱 오류:', error);
            return null;
        }
    }

    // 메뉴 구성 정의
    getMenuItems() {
        const menus = [
            {
                id: 'dashboard',
                label: '🏠 대시보드',
                action: 'goToMainSystem()',
                roles: ['전체관리자', '지점관리자'] // 모든 관리자
            },
            {
                id: 'designers',
                label: '👥 디자이너 관리',
                action: "goToPage('designers')",
                roles: ['전체관리자', '지점관리자']
            },
            {
                id: 'branches',
                label: '🏢 지점 관리',
                action: "goToPage('branches')",
                roles: ['전체관리자']
            },
            {
                id: 'users',
                label: '👤 계정 관리',
                action: "goToPage('users')",
                roles: ['전체관리자'] // 전체관리자만
            },
            {
                id: 'history',
                label: '📈 디자이너 히스토리',
                action: "goToPage('history')",
                roles: ['전체관리자', '지점관리자']
            },
            {
                id: 'checklist',
                label: '📋 체크리스트 입력',
                action: "goToPage('checklist')",
                roles: ['전체관리자', '지점관리자']
            },
            {
                id: 'statistics',
                label: '📊 통계 분석',
                action: "goToPage('statistics')",
                roles: ['전체관리자', '지점관리자']
            },
            {
                id: 'comparison',
                label: '⚖️ 지점 비교',
                action: "goToPage('comparison')",
                roles: ['전체관리자'] // 전체관리자만
            }
        ];

        // 사용자 권한에 따른 필터링
        if (!this.currentUser) {
            return []; // 로그인하지 않은 경우
        }

        return menus.filter(menu => 
            menu.roles.includes(this.currentUser.role)
        );
    }

    // 네비게이션 HTML 생성
    generateNavigationHTML() {
        const menuItems = this.getMenuItems();
        
        return menuItems.map(menu => {
            const isActive = menu.id === this.currentPage ? ' active' : '';
            return `<button class="nav-btn${isActive}" onclick="${menu.action}">${menu.label}</button>`;
        }).join('\n                ');
    }

    // 헤더 HTML 생성
    generateHeaderHTML() {
        const currentUserDisplay = this.getCurrentUserDisplay();
        const navigationHTML = this.generateNavigationHTML();

        return `
            <div class="header-content">
                <div class="header-top">
                    <h1>GOHAIR SNS 마케팅 관리 시스템</h1>
                    <div class="header-actions">
                        <span id="currentUser">${currentUserDisplay}</span>
                        ${this.getPageSpecificButtons()}
                        <button class="btn" onclick="goToMainSystem()">🏠 메인으로</button>
                    </div>
                </div>
                
                <nav class="nav">
                    ${navigationHTML}
                </nav>
            </div>
        `;
    }

    // 현재 사용자 표시 텍스트
    getCurrentUserDisplay() {
        if (!this.currentUser) {
            return 'Firebase 연결됨';
        }

        if (this.currentUser.role === '전체관리자') {
            return `${this.currentUser.name} (${this.currentUser.role})`;
        } else {
            return `${this.currentUser.name} (${this.currentUser.role} - ${this.currentUser.branch || '지점미지정'})`;
        }
    }

    // 페이지별 특수 버튼들
    getPageSpecificButtons() {
        const buttons = {
            'branches': '<button class="btn btn-green" onclick="exportBranches()">📥 지점 내보내기</button>',
            'users': '<button class="btn btn-green" onclick="exportUsers()">📥 계정 내보내기</button>',
            'designers': '<button class="btn btn-green" onclick="exportDesigners()">📥 디자이너 내보내기</button>',
            'statistics': '<button class="btn btn-green" onclick="exportStatistics()">📥 통계 내보내기</button>'
        };

        return buttons[this.currentPage] || '';
    }

    // 네비게이션 렌더링
    render() {
        const headerElement = document.querySelector('.header');
        if (headerElement) {
            headerElement.innerHTML = this.generateHeaderHTML();
            console.log(`✅ 네비게이션 렌더링 완료 (현재 페이지: ${this.currentPage})`);
        } else {
            console.warn('⚠️ .header 요소를 찾을 수 없습니다.');
        }
    }

    // 사용자 정보 업데이트 (로그인/로그아웃 시 호출)
    updateUserInfo() {
        this.currentUser = this.getCurrentUser();
        this.render(); // 네비게이션 다시 렌더링
    }
}

// 페이지 네비게이션 함수들
function goToMainSystem() {
    // 현재 위치에 따라 경로 결정
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pages/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = '/index.html';
    }
}

function goToPage(pageId) {
    const pages = {
        'designers': 'designers.html',
        'branches': 'branches.html',
        'users': 'users.html',
        'history': 'history.html',
        'checklist': 'checklist.html', 
        'statistics': 'statistics.html',
        'comparison': 'comparison.html'
    };
    
    if (pages[pageId]) {
        // 현재 위치에 따라 경로 결정
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            // 이미 pages 폴더 안에 있으면 상대 경로
            window.location.href = pages[pageId];
        } else {
            // 루트에 있으면 pages 폴더로 이동
            window.location.href = `pages/${pages[pageId]}`;
        }
    } else {
        console.warn(`페이지를 찾을 수 없습니다: ${pageId}`);
    }
}

// 전역에서 사용할 수 있도록 노출
window.NavigationManager = NavigationManager;
window.goToMainSystem = goToMainSystem;
window.goToPage = goToPage;

// 페이지 로드 시 자동 초기화 (중복 방지)
function initializeNavigation() {
    if (window.navigationManager) {
        console.log('⚠️ 네비게이션이 이미 초기화됨');
        return;
    }
    
    try {
        window.navigationManager = new NavigationManager();
        window.navigationManager.render();
        console.log('✅ 동적 네비게이션 시스템 로딩 완료');
    } catch (error) {
        console.error('❌ 네비게이션 초기화 오류:', error);
    }
}

// DOM 상태에 따른 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
    initializeNavigation();
}

// 사용자 로그인/로그아웃 시 네비게이션 업데이트 함수
function updateNavigation() {
    if (window.navigationManager) {
        window.navigationManager.updateUserInfo();
    }
}

// 전역 함수로 노출
window.updateNavigation = updateNavigation;

// 🆕 권한별 필터 관리 함수들
class FilterManager {
    constructor() {
        this.currentUser = this.getCurrentUser();
    }

    getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('사용자 정보 파싱 오류:', error);
            return null;
        }
    }

    // 지점 필터 옵션 설정
    setupBranchFilter(branches, selectElementId) {
        const selectElement = document.getElementById(selectElementId);
        if (!selectElement || !this.currentUser) return;

        let filteredBranches = branches;
        let options = '';

        if (this.currentUser.role === '전체관리자') {
            // 전체관리자: 모든 지점 + "전체" 옵션
            options = '<option value="">전체</option>';
            options += branches.map(branch => 
                `<option value="${branch.name}">${branch.name} (${branch.code || ''})</option>`
            ).join('');
        } else if (this.currentUser.role === '지점관리자') {
            // 지점관리자: 본인 지점만
            const userBranch = this.currentUser.branch;
            if (userBranch) {
                const branch = branches.find(b => b.name === userBranch);
                if (branch) {
                    options = `<option value="${branch.name}" selected>${branch.name} (${branch.code || ''})</option>`;
                    // 선택 불가능하게 설정
                    selectElement.disabled = true;
                    selectElement.style.backgroundColor = '#f3f4f6';
                    selectElement.style.cursor = 'not-allowed';
                }
            }
        }

        selectElement.innerHTML = options;
        console.log(`🔒 ${this.currentUser.role} 권한으로 지점 필터 설정 완료`);
    }

    // 디자이너 필터 옵션 설정 (지점에 따라)
    setupDesignerFilter(designers, selectElementId, selectedBranch = null) {
        const selectElement = document.getElementById(selectElementId);
        if (!selectElement || !this.currentUser) return;

        let filteredDesigners = designers;
        let options = '';

        if (this.currentUser.role === '전체관리자') {
            // 전체관리자: 선택된 지점의 디자이너들 또는 전체
            if (selectedBranch) {
                filteredDesigners = designers.filter(d => d.branch === selectedBranch);
            }
            options = '<option value="">전체</option>';
        } else if (this.currentUser.role === '지점관리자') {
            // 지점관리자: 본인 지점 디자이너만
            const userBranch = this.currentUser.branch;
            filteredDesigners = designers.filter(d => d.branch === userBranch);
            options = '<option value="">전체</option>';
        }

        options += filteredDesigners.map(designer => 
            `<option value="${designer.name}">${designer.name}</option>`
        ).join('');

        selectElement.innerHTML = options;
    }

    // 데이터 권한 필터링 (공통 함수)
    filterDataByUserRole(data, branchField = 'branch') {
        if (!this.currentUser || this.currentUser.role === '전체관리자') {
            return data; // 전체관리자는 모든 데이터 접근
        }
        
        if (this.currentUser.role === '지점관리자') {
            const userBranch = this.currentUser.branch;
            const filteredData = data.filter(item => {
                const itemBranch = item[branchField] || item.branchName || item.selectedBranch || item.name;
                return itemBranch === userBranch;
            });
            
            console.log(`🔒 지점관리자 필터링: ${userBranch} - ${data.length}개 → ${filteredData.length}개`);
            return filteredData;
        }
        
        return data;
    }

    // 권한 체크 함수들
    isAdmin() {
        return this.currentUser && this.currentUser.role === '전체관리자';
    }

    isBranchManager() {
        return this.currentUser && this.currentUser.role === '지점관리자';
    }

    canAccessAllBranches() {
        return this.isAdmin();
    }

    getUserBranch() {
        return this.currentUser ? this.currentUser.branch : null;
    }
}

// 전역에서 사용할 수 있도록 노출
window.FilterManager = FilterManager;

// 페이지별 필터 초기화 함수
function initializePageFilters() {
    window.filterManager = new FilterManager();
    console.log('🔧 페이지별 필터 매니저 초기화 완료');
}

// 전역 함수로 노출
window.initializePageFilters = initializePageFilters;
// 🔒 전역 권한 기반 메뉴 제어 함수
function applyGlobalMenuPermissions() {
    try {
        const userData = sessionStorage.getItem('currentUser');
        const currentUser = userData ? JSON.parse(userData) : null;
        
        if (!currentUser) {
            console.log('🔒 사용자 정보 없음 - 권한 체크 건너뜀');
            return;
        }
        
        console.log('🔒 전역 권한 체크 시작:', currentUser.role);
        
        if (currentUser.role === '지점관리자') {
            // 지점관리자가 접근할 수 없는 메뉴들 숨기기
            const restrictedMenus = [
                '.nav-btn[onclick*="branches"]',     // 지점 관리
                '.nav-btn[onclick*="comparison"]',   // 지점 비교
                '.admin-only'                        // 전체관리자 전용 클래스
            ];
            
            restrictedMenus.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.style.display = 'none';
                    console.log('🔒 메뉴 숨김:', element.textContent?.trim());
                });
            });
            
            console.log('✅ 지점관리자 권한 적용 완료');
        } else if (currentUser.role === '전체관리자') {
            console.log('✅ 전체관리자 - 모든 메뉴 접근 가능');
        }
        
    } catch (error) {
        console.error('❌ 전역 권한 체크 오류:', error);
    }
}

// 페이지 로드 후 자동 권한 적용
function initializeGlobalPermissions() {
    // DOM이 준비되면 권한 적용
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyGlobalMenuPermissions);
    } else {
        applyGlobalMenuPermissions();
    }
    
    // 추가 안전장치: 1초 후에도 한 번 더 실행
    setTimeout(applyGlobalMenuPermissions, 1000);
}

// 전역 함수로 노출
window.applyGlobalMenuPermissions = applyGlobalMenuPermissions;
window.initializeGlobalPermissions = initializeGlobalPermissions;

// 자동 초기화
initializeGlobalPermissions();
console.log('🧭 네비게이션 컴포넌트 로딩 완료');
