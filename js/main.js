// 메인 애플리케이션 로직 - Firebase 직접 연동
// 전역 변수
let currentPage = 'dashboard';
let sortOrder = {};

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

// Firebase에서 직접 데이터 가져오기 함수들
async function getChecklistsFromFirebase() {
    try {
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            console.warn('⚠️ Firebase가 초기화되지 않음');
            return [];
        }

        const db = firebase.firestore();
        const snapshot = await db.collection('checklists').get();
        
        const checklists = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            checklists.push({
                id: doc.id,
                docId: doc.id,
                designerId: data.designerId || '',
                designer: data.designer || '',
                branch: data.branch || '',
                date: data.date || '',
                naverReviews: data.naverReviews || 0,
                naverPosts: data.naverPosts || 0,
                naverExperience: data.naverExperience || 0,
                instaReels: data.instaReels || 0,
                instaPhotos: data.instaPhotos || 0,
                notes: data.notes || '',
                createdAt: data.createdAt || new Date().toISOString()
            });
        });
        
        console.log(`✅ 체크리스트 데이터 로딩 완료: ${checklists.length}개`);
        return checklists;
    } catch (error) {
        console.error('❌ 체크리스트 데이터 로딩 실패:', error);
        return [];
    }
}

async function getBranchesFromFirebase() {
    try {
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            console.warn('⚠️ Firebase가 초기화되지 않음');
            return [];
        }

        const db = firebase.firestore();
        const snapshot = await db.collection('branches').get();
        
        const branches = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            branches.push({
                id: doc.id,
                docId: doc.id,
                name: data.name || '',
                code: data.code || '',
                address: data.address || '',
                phone: data.phone || '',
                manager: data.manager || '',
                hours: data.hours || '',
                notes: data.notes || '',
                createdAt: data.createdAt || new Date().toISOString().split('T')[0]
            });
        });
        
        console.log(`✅ 지점 데이터 로딩 완료: ${branches.length}개`);
        return branches;
    } catch (error) {
        console.error('❌ 지점 데이터 로딩 실패:', error);
        return [];
    }
}

async function getDesignersFromFirebase() {
    try {
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            console.warn('⚠️ Firebase가 초기화되지 않음');
            return [];
        }

        const db = firebase.firestore();
        const snapshot = await db.collection('designers').get();
        
        const designers = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            designers.push({
                id: doc.id,
                docId: doc.id,
                name: data.name || '',
                branch: data.branch || '',
                position: data.position || '',
                phone: data.phone || '',
                email: data.email || '',
                instagram: data.instagram || '',
                notes: data.notes || '',
                createdAt: data.createdAt || new Date().toISOString().split('T')[0]
            });
        });
        
        console.log(`✅ 디자이너 데이터 로딩 완료: ${designers.length}개`);
        return designers;
    } catch (error) {
        console.error('❌ 디자이너 데이터 로딩 실패:', error);
        return [];
    }
}

async function addDesignerToFirebase(designer) {
    try {
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error('Firebase가 초기화되지 않음');
        }

        const db = firebase.firestore();
        const docRef = await db.collection('designers').add(designer);
        console.log('✅ Firebase에 디자이너 추가 완료. 문서 ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ 디자이너 추가 실패:', error);
        throw error;
    }
}

async function updateDesignerInFirebase(docId, designer) {
    try {
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error('Firebase가 초기화되지 않음');
        }

        const db = firebase.firestore();
        await db.collection('designers').doc(docId).update(designer);
        console.log('✅ Firebase에서 디자이너 수정 완료');
    } catch (error) {
        console.error('❌ 디자이너 수정 실패:', error);
        throw error;
    }
}

async function addBranchToFirebase(branch) {
    try {
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error('Firebase가 초기화되지 않음');
        }

        const db = firebase.firestore();
        const docRef = await db.collection('branches').add(branch);
        console.log('✅ Firebase에 지점 추가 완료. 문서 ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ 지점 추가 실패:', error);
        throw error;
    }
}

async function updateBranchInFirebase(docId, branch) {
    try {
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error('Firebase가 초기화되지 않음');
        }

        const db = firebase.firestore();
        await db.collection('branches').doc(docId).update(branch);
        console.log('✅ Firebase에서 지점 수정 완료');
    } catch (error) {
        console.error('❌ 지점 수정 실패:', error);
        throw error;
    }
}

async function addChecklistToFirebase(checklist) {
    try {
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error('Firebase가 초기화되지 않음');
        }

        const db = firebase.firestore();
        const docRef = await db.collection('checklists').add({
            ...checklist,
            createdAt: new Date().toISOString()
        });
        console.log('✅ Firebase에 체크리스트 추가 완료. 문서 ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ 체크리스트 추가 실패:', error);
        throw error;
    }
}

// 앱 초기화
async function initializeApp() {
    try {
        // 이벤트 핸들러 설정
        setupEventHandlers();
        
        // 파일 가져오기 설정
        if (window.setupFileImport) {
            window.setupFileImport();
        }
        
        // 기간 선택 이벤트 리스너 추가
        setupPeriodEventListeners();
        
        console.log('앱 초기화 완료');
    } catch (error) {
        console.error('앱 초기화 오류:', error);
    }
}

// 이벤트 핸들러 설정
function setupEventHandlers() {
    // 인증 관련 이벤트
    if (window.setupAuthEventHandlers) {
        window.setupAuthEventHandlers();
    }
    
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
                    name: document.getElementById('designerName').value,
                    branch: document.getElementById('designerBranch').value,
                    position: document.getElementById('designerPosition').value,
                    phone: document.getElementById('designerPhone').value,
                    createdAt: new Date().toISOString().split('T')[0]
                };

                await addDesignerToFirebase(designer);
                window.hideAddDesigner();
                window.showNotification('디자이너가 성공적으로 추가되었습니다.', 'success');
                
                // 디자이너 페이지가 열려있으면 새로고침
                if (currentPage === 'designers') {
                    await loadDesigners();
                }
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

                await updateDesignerInFirebase(docId, designer);
                window.hideEditDesigner();
                window.showNotification('디자이너 정보가 성공적으로 수정되었습니다.', 'success');
                
                // 디자이너 페이지가 열려있으면 새로고침
                if (currentPage === 'designers') {
                    await loadDesigners();
                }
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
                    name: document.getElementById('branchName').value,
                    code: document.getElementById('branchCode').value,
                    address: document.getElementById('branchAddress').value,
                    createdAt: new Date().toISOString().split('T')[0]
                };

                await addBranchToFirebase(branch);
                window.hideAddBranch();
                window.showNotification('지점이 성공적으로 추가되었습니다.', 'success');
                
                // 지점 페이지가 열려있으면 새로고침
                if (currentPage === 'branches') {
                    await loadBranches();
                }
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

                await updateBranchInFirebase(docId, branch);
                window.hideEditBranch();
                window.showNotification('지점이 성공적으로 수정되었습니다.', 'success');
                
                // 지점 페이지가 열려있으면 새로고침
                if (currentPage === 'branches') {
                    await loadBranches();
                }
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
                
                // Firebase에서 디자이너 정보 직접 조회
                const designers = await getDesignersFromFirebase();
                const designer = designers.find(d => d.id == designerId);
                
                if (!designer) {
                    throw new Error('디자이너 정보를 찾을 수 없습니다.');
                }
                
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

                await addChecklistToFirebase(checklist);
                
                // 폼 리셋 (디자이너 선택과 날짜 제외)
                ['naverReviews', 'naverPosts', 'naverExperience', 'instaReels', 'instaPhotos'].forEach(id => {
                    document.getElementById(id).value = '0';
                });
                
                await loadSelectedDesignerInfo(designerId);
                window.showNotification('체크리스트가 성공적으로 제출되었습니다.', 'success');
                
                // 대시보드가 열려있으면 새로고침
                if (currentPage === 'dashboard') {
                    await loadDashboard();
                }
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

// 대시보드 로드 - Firebase에서 직접 데이터 가져오기
async function loadDashboard() {
    try {
        const period = document.getElementById('dashboardPeriod')?.value || 'month';
        const startDate = document.getElementById('dashboardStartDate')?.value;
        const endDate = document.getElementById('dashboardEndDate')?.value;
        
        // Firebase에서 직접 데이터 가져오기
        let checklists = await getChecklistsFromFirebase();
        
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
        if (window.filterDataByPeriod) {
            checklists = window.filterDataByPeriod(checklists, period, startDate, endDate);
        }
        
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
        await loadBranchRankings(checklists);
        
    } catch (error) {
        console.error('대시보드 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('대시보드 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 지점별 순위 로드 - Firebase에서 직접 지점 데이터 가져오기
async function loadBranchRankings(checklists) {
    try {
        // Firebase에서 직접 지점 데이터 가져오기
        const branches = await getBranchesFromFirebase();
        
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
            });
            
            const reviews = branchChecklists.reduce((sum, c) => sum + (c.naverReviews || 0), 0);
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
        
    } catch (error) {
        console.error('지점별 순위 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('지점별 순위 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 순위 정렬
function sortRankings(column) {
    const order = sortOrder[column] === 'asc' ? 'desc' : 'asc';
    sortOrder[column] = order;
    loadDashboard();
}

// 디자이너 페이지 로드 - Firebase에서 직접 데이터 가져오기
async function loadDesigners() {
    try {
        await loadBranchOptions();
        
        // Firebase에서 직접 디자이너 데이터 가져오기
        const designers = await getDesignersFromFirebase();
        
        // 사용자 권한에 따른 디자이너 필터링
        let filteredDesigners = designers;
        try {
            const userData = sessionStorage.getItem('currentUser');
            const currentUser = userData ? JSON.parse(userData) : null;
            
            if (currentUser && currentUser.role === '지점관리자') {
                const userBranch = currentUser.branch || currentUser.branchName;
                filteredDesigners = designers.filter(d => {
                    const designerBranch = d.branch || d.branchName;
                    return designerBranch === userBranch;
                });
                console.log(`지점관리자 디자이너 필터링: ${userBranch}, 필터링된 디자이너: ${filteredDesigners.length}명`);
            }
        } catch (error) {
            console.error('디자이너 필터링 오류:', error);
        }
        
        // 디자이너 목록 UI 업데이트 로직 구현 필요
        console.log('디자이너 로드 완료:', filteredDesigners.length + '명');
        
    } catch (error) {
        console.error('디자이너 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('디자이너 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 지점 페이지 로드 - Firebase에서 직접 데이터 가져오기
async function loadBranches() {
    try {
        // Firebase에서 직접 지점 데이터 가져오기
        const branches = await getBranchesFromFirebase();
        
        // 지점 목록 UI 업데이트 로직 구현 필요
        console.log('지점 로드 완료:', branches.length + '개');
        
    } catch (error) {
        console.error('지점 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('지점 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 히스토리 페이지 로드 - Firebase에서 직접 데이터 가져오기
async function loadHistoryPage() {
    try {
        // Firebase에서 직접 체크리스트 데이터 가져오기
        const checklists = await getChecklistsFromFirebase();
        
        // 히스토리 UI 업데이트 로직 구현 필요
        console.log('히스토리 로드 완료:', checklists.length + '건');
        
    } catch (error) {
        console.error('히스토리 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('히스토리 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 체크리스트 페이지 로드
async function loadChecklist() {
    try {
        // 체크리스트 로드 로직 구현
        if (window.DateUtils && window.DateUtils.today) {
            const today = window.DateUtils.today();
            const dateInput = document.getElementById('checklistDate');
            if (dateInput) {
                dateInput.value = today;
            }
        }
        
        await loadBranchOptions();
        
    } catch (error) {
        console.error('체크리스트 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('체크리스트 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 통계 페이지 로드 - Firebase에서 직접 데이터 가져오기
async function loadStatistics() {
    try {
        // Firebase에서 직접 데이터 가져오기
        const checklists = await getChecklistsFromFirebase();
        
        // 통계 UI 업데이트 로직 구현 필요
        console.log('통계 로드 완료:', checklists.length + '건');
        
    } catch (error) {
        console.error('통계 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('통계 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 비교 페이지 로드 - Firebase에서 직접 데이터 가져오기
async function loadComparison() {
    try {
        // Firebase에서 직접 데이터 가져오기
        const [branches, checklists] = await Promise.all([
            getBranchesFromFirebase(),
            getChecklistsFromFirebase()
        ]);
        
        // 비교 UI 업데이트 로직 구현 필요
        console.log('비교 로드 완료 - 지점:', branches.length + '개, 체크리스트:', checklists.length + '건');
        
    } catch (error) {
        console.error('비교 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('비교 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 지점 옵션 로드 - Firebase에서 직접 데이터 가져오기
async function loadBranchOptions() {
    try {
        // Firebase에서 직접 지점과 디자이너 데이터 가져오기
        const [branches, designers] = await Promise.all([
            getBranchesFromFirebase(),
            getDesignersFromFirebase()
        ]);
        
        // 지점 옵션 UI 업데이트 로직 구현 필요
        console.log('지점 옵션 로드 완료 - 지점:', branches.length + '개, 디자이너:', designers.length + '명');
        
    } catch (error) {
        console.error('지점 옵션 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('지점 옵션 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 선택된 디자이너 정보 로드 - Firebase에서 직접 데이터 가져오기
async function loadSelectedDesignerInfo(designerId) {
    try {
        // Firebase에서 직접 체크리스트 데이터 가져오기
        const checklists = await getChecklistsFromFirebase();
        
        // 해당 디자이너의 체크리스트 필터링
        const designerChecklists = checklists.filter(c => c.designerId == designerId);
        
        // 디자이너 정보 UI 업데이트 로직 구현 필요
        console.log('디자이너 정보 로드 완료:', designerChecklists.length + '건');
        
    } catch (error) {
        console.error('디자이너 정보 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('디자이너 정보 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 디자이너 히스토리 로드 - Firebase에서 직접 데이터 가져오기
async function loadDesignerHistory() {
    try {
        // Firebase에서 직접 체크리스트 데이터 가져오기
        const checklists = await getChecklistsFromFirebase();
        
        // 디자이너 히스토리 UI 업데이트 로직 구현 필요
        console.log('디자이너 히스토리 로드 완료:', checklists.length + '건');
        
    } catch (error) {
        console.error('디자이너 히스토리 로드 오류:', error);
        if (window.showNotification) {
            window.showNotification('디자이너 히스토리 로드 중 오류가 발생했습니다.', 'error');
        }
    }
}

function exportRankings() {
    // 순위 내보내기 로직 구현
    if (window.showNotification) {
        window.showNotification('순위 내보내기 기능은 개발 중입니다.', 'info');
    }
}

function updateStatisticsChart() {
    // 통계 차트 업데이트 로직 구현
    if (window.showNotification) {
        window.showNotification('통계 차트 업데이트 기능은 개발 중입니다.', 'info');
    }
}

function updateComparisonCharts() {
    // 비교 차트 업데이트 로직 구현
    if (window.showNotification) {
        window.showNotification('비교 차트 업데이트 기능은 개발 중입니다.', 'info');
    }
}

// 전역으로 노출
window.showPage = showPage;
window.loadDashboard = loadDashboard;
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
window.currentPage = currentPage;

console.log('메인 애플리케이션 로직 로딩 완료 - Firebase 직접 연동');