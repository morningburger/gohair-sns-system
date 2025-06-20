// 메인 애플리케이션 로직
// 전역 변수
let currentPage = 'dashboard';
let sortOrder = {};
let cachedData = {
    branches: [],
    designers: [],
    checklists: []
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 메인 시스템 로드 시작');
    
    // 사용자 권한에 따른 네비게이션 메뉴 제어
    function setupNavigationByRole() {
        try {
            const userData = sessionStorage.getItem('currentUser');
            const currentUser = userData ? JSON.parse(userData) : null;
            
            console.log('현재 사용자:', currentUser);
            
if (currentUser && currentUser.role === '지점관리자') {
    // 지점관리자는 지점 관리 메뉴 숨김
    const branchNavBtn = document.querySelector('.nav-btn[onclick*="branches"]');
    if (branchNavBtn) {
        branchNavBtn.style.display = 'none';
        console.log('지점관리자 - 지점 관리 메뉴 숨김');
    }
    
    // 지점관리자는 지점 비교 메뉴도 숨김
    const comparisonNavBtn = document.querySelector('.nav-btn[onclick*="comparison"]');
    if (comparisonNavBtn) {
        comparisonNavBtn.style.display = 'none';
        console.log('지점관리자 - 지점 비교 메뉴 숨김');
    }
                
                // 사용자 정보 표시
                const userElement = document.getElementById('currentUser');
                if (userElement) {
                    userElement.textContent = `${currentUser.name} (${currentUser.role} - ${currentUser.branch})`;
                    userElement.style.color = '#3b82f6';
                }
            } else if (currentUser && currentUser.role === '전체관리자') {
                // 전체관리자는 모든 메뉴 표시
                const userElement = document.getElementById('currentUser');
                if (userElement) {
                    userElement.textContent = `${currentUser.name} (${currentUser.role})`;
                    userElement.style.color = '#059669';
                }
            }
        } catch (error) {
            console.error('네비게이션 권한 설정 오류:', error);
        }
    }

    // 네비게이션 설정 실행
    setupNavigationByRole();
    
    // 앱 초기화
    initializeApp();
});

// 앱 초기화
async function initializeApp() {
    try {
        // 데이터 관리자 초기화
        window.dataManager = new window.FirebaseDataManager();
        
        // 인증 관리자 초기화  
        window.authManager = new window.AuthManager();
        
        // 이벤트 핸들러 설정
        setupEventHandlers();
        
        // 파일 가져오기 설정
        window.setupFileImport();
        
        // 기간 선택 이벤트 리스너 추가
        setupPeriodEventListeners();
        
        // 실시간 데이터 동기화 설정
        setupRealtimeSync();
        
        // 초기 데이터 로드 (1초 후)
        setTimeout(() => {
            loadInitialData();
        }, 1000);
        
        console.log('앱 초기화 완료');
    } catch (error) {
        console.error('앱 초기화 오류:', error);
    }
}

// 이벤트 핸들러 설정
function setupEventHandlers() {
    // 인증 관련 이벤트
    window.setupAuthEventHandlers();
    
    // 폼 제출 이벤트들
    setupFormEventHandlers();
}

// 폼 이벤트 핸들러 설정
function setupFormEventHandlers() {
    // 디자이너 추가 폼
    const addDesignerForm = document.getElementById('addDesignerForm');
    if (addDesignerForm) {
        addDesignerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const designer = {
                    id: Date.now(),
                    name: document.getElementById('designerName').value,
                    branch: document.getElementById('designerBranch').value,
                    position: document.getElementById('designerPosition').value,
                    phone: document.getElementById('designerPhone').value
                };

                await window.dataManager.addDesigner(designer);
                window.hideAddDesigner();
                window.showNotification('디자이너가 성공적으로 추가되었습니다.', 'success');
            } catch (error) {
                console.error('디자이너 추가 오류:', error);
                window.showNotification('디자이너 추가 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    // 디자이너 수정 폼
    const editDesignerForm = document.getElementById('editDesignerForm');
    if (editDesignerForm) {
        editDesignerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const docId = document.getElementById('editDesignerId').value;
                const designer = {
                    name: document.getElementById('editDesignerName').value,
                    branch: document.getElementById('editDesignerBranch').value,
                    position: document.getElementById('editDesignerPosition').value,
                    phone: document.getElementById('editDesignerPhone').value
                };

                await window.dataManager.updateDesigner(docId, designer);
                window.hideEditDesigner();
                window.showNotification('디자이너 정보가 성공적으로 수정되었습니다.', 'success');
            } catch (error) {
                console.error('디자이너 수정 오류:', error);
                window.showNotification('디자이너 수정 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    // 지점 추가 폼
    const addBranchForm = document.getElementById('addBranchForm');
    if (addBranchForm) {
        addBranchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const branch = {
                    id: Date.now(),
                    name: document.getElementById('branchName').value,
                    code: document.getElementById('branchCode').value,
                    address: document.getElementById('branchAddress').value
                };

                await window.dataManager.addBranch(branch);
                window.hideAddBranch();
                window.showNotification('지점이 성공적으로 추가되었습니다.', 'success');
            } catch (error) {
                console.error('지점 추가 오류:', error);
                window.showNotification('지점 추가 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    // 지점 수정 폼
    const editBranchForm = document.getElementById('editBranchForm');
    if (editBranchForm) {
        editBranchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const docId = document.getElementById('editBranchId').value;
                const branch = {
                    name: document.getElementById('editBranchName').value,
                    code: document.getElementById('editBranchCode').value,
                    address: document.getElementById('editBranchAddress').value
                };

                await window.dataManager.updateBranch(docId, branch);
                window.hideEditBranch();
                window.showNotification('지점이 성공적으로 수정되었습니다.', 'success');
            } catch (error) {
                console.error('지점 수정 오류:', error);
                window.showNotification('지점 수정 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    // 체크리스트 폼
    const checklistForm = document.getElementById('checklistForm');
    if (checklistForm) {
        checklistForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const designerId = document.getElementById('checklistDesigner').value;
                const designer = cachedData.designers.find(d => d.id == designerId);
                
                const checklist = {
                    designerId: parseInt(designerId),
                    designer: designer.name,
                    branch: designer.branch,
                    date: document.getElementById('checklistDate').value,
                    naverReviews: parseInt(document.getElementById('naverReviews').value) || 0,
                    naverPosts: parseInt(document.getElementById('naverPosts').value) || 0,
                    naverExperience: parseInt(document.getElementById('naverExperience').value) || 0,
                    instaReels: parseInt(document.getElementById('instaReels').value) || 0,
                    instaPhotos: parseInt(document.getElementById('instaPhotos').value) || 0
                };

                await window.dataManager.addChecklist(checklist);
                
                // 폼 리셋 (디자이너 선택과 날짜 제외)
                ['naverReviews', 'naverPosts', 'naverExperience', 'instaReels', 'instaPhotos'].forEach(id => {
                    document.getElementById(id).value = '0';
                });
                
                loadSelectedDesignerInfo(designerId);
                window.showNotification('체크리스트가 성공적으로 제출되었습니다.', 'success');
            } catch (error) {
                console.error('체크리스트 제출 오류:', error);
                window.showNotification('체크리스트 제출 중 오류가 발생했습니다.', 'error');
            }
        });
    }
}

// 기간 선택 이벤트 리스너 설정
function setupPeriodEventListeners() {
    const periods = ['dashboard', 'designers', 'history'];
    
    periods.forEach(prefix => {
        const periodSelect = document.getElementById(`${prefix}Period`);
        if (periodSelect) {
            periodSelect.addEventListener('change', function() {
                const customRange = document.getElementById(`${prefix}CustomRange`);
                if (customRange) {
                    if (this.value === 'custom') {
                        customRange.classList.remove('hidden');
                    } else {
                        customRange.classList.add('hidden');
                    }
                }
            });
        }
    });
}

// 실시간 데이터 동기화 설정
function setupRealtimeSync() {
    // 지점 데이터 동기화
    window.dataManager.onBranchesChange((branches) => {
        cachedData.branches = branches;
        if (currentPage === 'branches') {
            loadBranches();
        }
        loadDashboard();
    });

    // 디자이너 데이터 동기화
    window.dataManager.onDesignersChange((designers) => {
        cachedData.designers = designers;
        if (currentPage === 'designers') {
            loadDesigners();
        }
    });

// 체크리스트 데이터 동기화
window.dataManager.onChecklistsChange((checklists) => {
    // 캐시 완전히 교체 (이전 데이터 제거)
    cachedData.checklists = [...checklists];
    console.log('체크리스트 캐시 업데이트:', checklists.length + '개');
    if (currentPage === 'dashboard') {
        loadDashboard();
    }
});
}

// 초기 데이터 로드
async function loadInitialData() {
    try {
        // 캐시 초기화 - 이전 데이터 완전히 제거
        cachedData = {
            branches: [],
            designers: [],
            checklists: []
        };
        
        // 새로 로드
        cachedData.branches = await window.dataManager.getBranches();
        cachedData.designers = await window.dataManager.getDesigners();
        cachedData.checklists = await window.dataManager.getChecklists();
        
        console.log('초기 데이터 로드 완료:', {
            branches: cachedData.branches.length,
            designers: cachedData.designers.length,
            checklists: cachedData.checklists.length
        });
    } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
    }
}

// 페이지 전환
function showPage(pageId) {
    currentPage = pageId;
    const pages = ['dashboard', 'designers', 'branches', 'history', 'checklist', 'statistics', 'comparison'];
    
    // 모든 페이지 숨김
    pages.forEach(page => {
        const element = document.getElementById(page + 'Page');
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // 선택된 페이지 표시
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // 네비게이션 버튼 활성화
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // 페이지별 데이터 로드
    switch(pageId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'designers':
            loadDesigners();
            break;
        case 'branches':
            loadBranches();
            break;
        case 'history':
            loadHistoryPage();
            break;
        case 'checklist':
            loadChecklist();
            break;
        case 'statistics':
            loadStatistics();
            break;
        case 'comparison':
            loadComparison();
            break;
    }
}

// 대시보드 로드
function loadDashboard() {
    const period = document.getElementById('dashboardPeriod')?.value || 'month';
    const startDate = document.getElementById('dashboardStartDate')?.value;
    const endDate = document.getElementById('dashboardEndDate')?.value;
    
    let checklists = cachedData.checklists;
    
// 사용자 권한에 따른 데이터 필터링
try {
    const userData = sessionStorage.getItem('currentUser');
    const currentUser = userData ? JSON.parse(userData) : null;
    
    if (currentUser && currentUser.role === '지점관리자') {
        const userBranch = currentUser.branch || currentUser.branchName;
        checklists = checklists.filter(c => {
            const itemBranch = c.branch || c.branchName || c.selectedBranch;
            return itemBranch === userBranch;
        });
        console.log(`지점관리자 데이터 필터링: ${userBranch}, 필터링된 데이터: ${checklists.length}건`);
    }
} catch (error) {
    console.error('대시보드 데이터 필터링 오류:', error);
}
    
    // 기간 필터링
    checklists = window.filterDataByPeriod(checklists, period, startDate, endDate);
    
    // 전체 통계 계산
    const totalReviews = checklists.reduce((sum, c) => sum + (c.naverReviews || 0), 0);
    const totalPosts = checklists.reduce((sum, c) => sum + (c.naverPosts || 0), 0);
    const totalExperience = checklists.reduce((sum, c) => sum + (c.naverExperience || 0), 0);
    const totalReels = checklists.reduce((sum, c) => sum + (c.instaReels || 0), 0);
    const totalPhotos = checklists.reduce((sum, c) => sum + (c.instaPhotos || 0), 0);

    // UI 업데이트
    const elements = {
        totalReviews: document.getElementById('totalReviews'),
        totalPosts: document.getElementById('totalPosts'), 
        totalExperience: document.getElementById('totalExperience'),
        totalReels: document.getElementById('totalReels'),
        totalPhotos: document.getElementById('totalPhotos')
    };

    if (elements.totalReviews) elements.totalReviews.textContent = totalReviews;
    if (elements.totalPosts) elements.totalPosts.textContent = totalPosts;
    if (elements.totalExperience) elements.totalExperience.textContent = totalExperience;
    if (elements.totalReels) elements.totalReels.textContent = totalReels;
    if (elements.totalPhotos) elements.totalPhotos.textContent = totalPhotos;

    // 지점별 순위 로드
    loadBranchRankings(checklists);
}

// 지점별 순위 로드
function loadBranchRankings(checklists) {
    const branches = cachedData.branches;
    const currentUser = window.authManager?.getCurrentUser();
    
// 사용자 권한에 따른 지점 필터링
let userBranches = branches;
try {
    const userData = sessionStorage.getItem('currentUser');
    const currentUser = userData ? JSON.parse(userData) : null;
    
    if (currentUser && currentUser.role === '지점관리자') {
        const userBranch = currentUser.branch || currentUser.branchName;
        userBranches = branches.filter(b => {
            const branchName = b.name || b.branchName;
            return branchName === userBranch;
        });
    }
} catch (error) {
    console.error('지점 순위 필터링 오류:', error);
}
    
    const branchStats = userBranches.map(branch => {
const branchChecklists = checklists.filter(c => {
    // 다양한 branch 필드명 처리
    const checklistBranch = c.branch || c.branchName || c.selectedBranch;
    const branchName = branch.name || branch.branchName || branch;
    return checklistBranch === branchName;
});        const reviews = branchChecklists.reduce((sum, c) => sum + (c.naverReviews || 0), 0);
        const posts = branchChecklists.reduce((sum, c) => sum + (c.naverPosts || 0), 0);
        const experience = branchChecklists.reduce((sum, c) => sum + (c.naverExperience || 0), 0);
        const reels = branchChecklists.reduce((sum, c) => sum + (c.instaReels || 0), 0);
        const photos = branchChecklists.reduce((sum, c) => sum + (c.instaPhotos || 0), 0);
        const total = reviews + posts + experience + reels + photos;
        
        return { branch: branch.name, reviews, posts, experience, reels, photos, total };
    });

    branchStats.sort((a, b) => b.total - a.total);

    const tbody = document.getElementById('branchRankings');
    if (tbody) {
        tbody.innerHTML = branchStats.map((stat, index) => `
            <tr style="${index % 2 === 0 ? 'background-color: #f8fafc;' : ''}">
                <td class="font-bold">${index + 1}</td>
                <td class="font-medium">${stat.branch}</td>
                <td>${stat.reviews}</td>
                <td>${stat.posts}</td>
                <td>${stat.experience}</td>
                <td>${stat.reels}</td>
                <td>${stat.photos}</td>
                <td class="font-bold" style="color: #6366f1;">${stat.total}</td>
            </tr>
        `).join('');
    }
}

// 순위 정렬
function sortRankings(column) {
    const order = sortOrder[column] === 'asc' ? 'desc' : 'asc';
    sortOrder[column] = order;
    loadDashboard();
}

// 나머지 페이지 로드 함수들 (간단화된 버전)
function loadDesigners() {
    loadBranchOptions();
    // 디자이너 로드 로직 구현
}

function loadBranches() {
    // 지점 로드 로직 구현  
}

function loadHistoryPage() {
    // 히스토리 페이지 로드 로직 구현
}

function loadChecklist() {
    // 체크리스트 로드 로직 구현
    const today = window.DateUtils.today();
    const dateInput = document.getElementById('checklistDate');
    if (dateInput) {
        dateInput.value = today;
    }
}

function loadStatistics() {
    // 통계 로드 로직 구현
}

function loadComparison() {
    // 비교 로드 로직 구현
}

function loadBranchOptions() {
    // 지점 옵션 로드 로직 구현
}

function loadSelectedDesignerInfo(designerId) {
    // 선택된 디자이너 정보 로드 로직 구현
}

function loadDesignerHistory() {
    // 디자이너 히스토리 로드 로직 구현
}

function exportRankings() {
    // 순위 내보내기 로직 구현
    window.showNotification('순위 내보내기 기능은 개발 중입니다.', 'info');
}

function updateStatisticsChart() {
    // 통계 차트 업데이트 로직 구현
    window.showNotification('통계 차트 업데이트 기능은 개발 중입니다.', 'info');
}

function updateComparisonCharts() {
    // 비교 차트 업데이트 로직 구현
    window.showNotification('비교 차트 업데이트 기능은 개발 중입니다.', 'info');
}

// 전역으로 노출
window.showPage = showPage;
window.loadDashboard = loadDashboard;
window.loadInitialData = loadInitialData;
window.sortRankings = sortRankings;
window.loadDesigners = loadDesigners;
window.loadBranches = loadBranches;
window.loadHistoryPage = loadHistoryPage;
window.loadChecklist = loadChecklist;
window.loadStatistics = loadStatistics;
window.loadComparison = loadComparison;
window.loadBranchOptions = loadBranchOptions;
window.loadSelectedDesignerInfo = loadSelectedDesignerInfo;
window.loadDesignerHistory = loadDesignerHistory;
window.exportRankings = exportRankings;
window.updateStatisticsChart = updateStatisticsChart;
window.updateComparisonCharts = updateComparisonCharts;
window.cachedData = cachedData;
window.currentPage = currentPage;

console.log('메인 애플리케이션 로직 로딩 완료');
