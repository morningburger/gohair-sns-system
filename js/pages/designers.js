// 디자이너 관리 페이지 전용 로직

class DesignersManager {
    constructor() {
        this.data = {
            designers: [],
            branches: [],
            checklists: []
        };
        this.currentUser = null;
        this.sortConfig = {
            field: null,
            direction: 'asc'
        };
        this.pagination = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0
        };
        this.filters = {
            branch: '',
            period: 'month',
            search: ''
        };
    }

    // 페이지 초기화
    async initialize() {
        try {
            // 사용자 정보 확인
            this.currentUser = this.getCurrentUser();
            this.updateUserDisplay();
            
            // 권한에 따른 UI 조정
            this.adjustUIForPermissions();
            
            // 데이터 로드
            await this.loadAllData();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            // 초기 날짜 설정 (이번 달로 기본 설정)
            this.setAutomaticDateRange('month');
            // 디자이너 목록 로드
            this.loadDesigners();
            
            console.log('디자이너 페이지 초기화 완료');
        } catch (error) {
            console.error('디자이너 페이지 초기화 오류:', error);
        }
    }

    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }
    // 디자이너 ID로 이름 찾기
getDesignerNameById(designerId) {
    const designer = this.data.designers.find(d => 
        d.id === designerId || 
        d.docId === designerId || 
        String(d.id) === String(designerId) ||
        String(d.docId) === String(designerId)
    );
    return designer ? designer.name : null;
}

    // 사용자 표시 업데이트
updateUserDisplay() {
    const userElement = document.getElementById('currentUser');
    if (userElement) {
        if (this.currentUser) {
            if (this.currentUser.role === '전체관리자') {
                userElement.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
                userElement.style.color = '#059669';
            } else if (this.currentUser.role === '지점관리자') {
                userElement.textContent = `${this.currentUser.name} (${this.currentUser.role} - ${this.currentUser.branch})`;
                userElement.style.color = '#3b82f6';
            }
        } else {
            userElement.textContent = 'Firebase 연결됨';
            userElement.style.color = '#10b981';
        }
        userElement.style.fontWeight = '500';
    }
}

    // 권한에 따른 UI 조정
    adjustUIForPermissions() {
        const branchFilterContainer = document.getElementById('branchFilterContainer');
        
        // 리더인 경우 지점 필터 숨김
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            if (branchFilterContainer) {
                branchFilterContainer.style.display = 'none';
            }
        }
    }

    // 데이터 로드
    async loadAllData() {
        try {
            console.log('📊 실제 Firebase 데이터 로딩 시작...');
            
            // Firebase에서 실제 데이터 로딩
            this.data.designers = await this.loadDesignersFromFirebase();
            this.data.branches = await this.loadBranchesFromFirebase();
            this.data.checklists = await this.loadChecklistsFromFirebase();
            
            console.log('✅ 모든 데이터 로딩 완료');
            console.log('📊 로딩된 데이터 요약:');
            console.log(`- 디자이너: ${this.data.designers.length}개`);
            console.log(`- 지점: ${this.data.branches.length}개`);
            console.log(`- 체크리스트: ${this.data.checklists.length}개`);
            
            // 지점 옵션 로드
            this.loadBranchOptions();
            
        } catch (error) {
            console.error('❌ 데이터 로딩 중 오류:', error);
            throw error;
        }
    }

    // 샘플 데이터 생성
    generateSampleDesigners() {
        const branches = ['송도센트럴점', '검단테라스점', '부평점', '인천논현점', '청라국제점'];
        const positions = ['인턴', '디자이너', '팀장', '실장', '부원장', '원장'];
        const names = ['김수현', '이지민', '박준호', '최미영', '정태윤', '한소희', '오민석', '신예은'];
        
        return names.map((name, index) => ({
            id: index + 1,
            docId: `designer_${index + 1}`,
            name: name,
            branch: branches[Math.floor(Math.random() * branches.length)],
            position: positions[Math.floor(Math.random() * positions.length)],
            phone: `010-${String(Math.floor(Math.random() * 9000) + 1000).substring(0, 4)}-${String(Math.floor(Math.random() * 9000) + 1000).substring(0, 4)}`,
            email: `${name.toLowerCase()}@gohair.com`,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: index % 3 === 0 ? '우수 디자이너, 고객 만족도 높음' : ''
        }));
    }

    generateSampleBranches() {
        return ['송도센트럴점', '검단테라스점', '부평점', '인천논현점', '청라국제점'];
    }

    generateSampleChecklists() {
        const data = [];
        const designers = this.data.designers || this.generateSampleDesigners();
        
        designers.forEach(designer => {
            // 각 디자이너당 최근 30일 내 랜덤 체크리스트 생성
            const recordCount = Math.floor(Math.random() * 15) + 5; // 5-19개 기록
            
            for (let i = 0; i < recordCount; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                
                data.push({
                    id: `checklist_${designer.id}_${i}`,
                    designerId: designer.id,
                    designer: designer.name,
                    branch: designer.branch,
                    date: date.toISOString().split('T')[0],
                    naverReviews: Math.floor(Math.random() * 8),
                    naverPosts: Math.floor(Math.random() * 4),
                    naverExperience: Math.floor(Math.random() * 2),
                    instaReels: Math.floor(Math.random() * 6),
                    instaPhotos: Math.floor(Math.random() * 10)
                });
            }
        });
        
        return data;
    }

    async loadDesignersFromFirebase() {
        try {
            console.log('👥 디자이너 데이터 로딩 중...');
            
            if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
                console.warn('⚠️ Firebase가 초기화되지 않음 - 임시 데이터 사용');
                return this.generateSampleDesigners();
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
                    notes: data.notes || '',
                    createdAt: data.createdAt || new Date().toISOString().split('T')[0]
                });
            });
            
console.log(`✅ 디자이너 데이터 로딩 완료: ${designers.length}개`);

// 🔍 Firebase 디자이너 데이터 구조 확인
console.log('🔍 Firebase 디자이너 샘플 3개:');
designers.slice(0, 3).forEach((designer, index) => {
    console.log(`디자이너 ${index + 1}:`, {
        id: designer.id,
        docId: designer.docId,
        name: designer.name,
        branch: designer.branch
    });
});

return designers;
        } catch (error) {
            console.error('❌ 디자이너 데이터 로딩 실패:', error);
            console.log('📝 오류로 인해 임시 데이터 사용');
            return this.generateSampleDesigners();
        }
    }

    // 🏢 실제 지점 데이터 로딩
    async loadBranchesFromFirebase() {
        try {
            console.log('🏢 지점 데이터 로딩 중...');
            
            if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
                console.warn('⚠️ Firebase가 초기화되지 않음 - 임시 데이터 사용');
                return this.generateSampleBranches();
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
            
            if (branches.length === 0) {
                console.log('📝 Firebase에 지점 데이터가 없음 - 임시 데이터 사용');
                return this.generateSampleBranches();
            }
            
            // 지점명만 배열로 반환 (기존 코드와 호환)
            return branches.map(b => b.name);
        } catch (error) {
            console.error('❌ 지점 데이터 로딩 실패:', error);
            console.log('📝 오류로 인해 임시 데이터 사용');
            return this.generateSampleBranches();
        }
    }

    // 📋 실제 체크리스트 데이터 로딩
    async loadChecklistsFromFirebase() {
        try {
            console.log('📋 체크리스트 데이터 로딩 중...');
            
            if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
                console.warn('⚠️ Firebase가 초기화되지 않음 - 임시 데이터 사용');
                return this.generateSampleChecklists();
            }

            const db = firebase.firestore();
            const snapshot = await db.collection('checklists')
                .orderBy('date', 'desc')
                .limit(500)
                .get();
            
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

// 🔍 Firebase 체크리스트 데이터 구조 확인
console.log('🔍 Firebase 체크리스트 샘플 3개:');
checklists.slice(0, 3).forEach((checklist, index) => {
    console.log(`체크리스트 ${index + 1}:`, {
        id: checklist.id,
        designerId: checklist.designerId,
        designer: checklist.designer,
        branch: checklist.branch,
        date: checklist.date
    });
});

return checklists;
        } catch (error) {
            console.error('❌ 체크리스트 데이터 로딩 실패:', error);
            console.log('📝 오류로 인해 임시 데이터 사용');
            return this.generateSampleChecklists();
        }
    }

    // 지점 옵션 로드
loadBranchOptions() {
    let branches = this.data.branches;
    
    // 지점관리자인 경우 해당 지점만 필터링
    if (this.currentUser && this.currentUser.role === '지점관리자') {
        branches = branches.filter(b => b === this.currentUser.branch);
        console.log(`🔒 지점관리자 지점 필터링: ${this.currentUser.branch}`);
    }

    // 지점 필터 옵션 (전체관리자만 보임)
    const branchFilter = document.getElementById('designerBranchFilter');
    if (branchFilter) {
        if (this.currentUser && this.currentUser.role === '전체관리자') {
            branchFilter.innerHTML = '<option value="">전체 지점</option>' +
                branches.map(b => `<option value="${b}">${b}</option>`).join('');
        }
    }

    // 모달의 지점 선택 옵션
    const modalSelects = ['designerBranch', 'editDesignerBranch'];
    modalSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            if (this.currentUser && this.currentUser.role === '지점관리자') {
                // 지점관리자는 자신의 지점만 선택 가능
                select.innerHTML = `<option value="${this.currentUser.branch}">${this.currentUser.branch}</option>`;
                select.disabled = true;
                select.style.backgroundColor = '#f3f4f6';
            } else {
                // 전체관리자는 모든 지점 선택 가능
                select.innerHTML = '<option value="">지점을 선택하세요</option>' +
                    branches.map(b => `<option value="${b}">${b}</option>`).join('');
                select.disabled = false;
                select.style.backgroundColor = '';
            }
        }
    });
}

    // 기간에 따른 자동 날짜 설정
    setAutomaticDateRange(period) {
        const startDateInput = document.getElementById('designersStartDate');
        const endDateInput = document.getElementById('designersEndDate');
        
        if (!startDateInput || !endDateInput) return;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        let startDate = '';
        
        switch(period) {
            case 'week':
                // 이번 주 (월요일부터)
                const dayOfWeek = now.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const monday = new Date(now);
                monday.setDate(now.getDate() + mondayOffset);
                startDate = monday.toISOString().split('T')[0];
                break;
                
            case 'month':
                // 이번 달 첫째 날
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                break;
                
            case 'quarter':
                // 이번 분기 첫째 날
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
                break;
                
            case 'all':
                // 전체 기간 (1년 전부터)
                const oneYearAgo = new Date(now);
                oneYearAgo.setFullYear(now.getFullYear() - 1);
                startDate = oneYearAgo.toISOString().split('T')[0];
                break;
                
            case 'custom':
            default:
                // 사용자 정의인 경우 자동 설정하지 않음
                return;
        }
        
        startDateInput.value = startDate;
        endDateInput.value = today;
        
        console.log(`📅 자동 날짜 설정: ${period} - ${startDate} ~ ${today}`);
    }

// 디자이너 목록 로드
loadDesigners() {
    let designers = [...this.data.designers];
    
    // 🔍 데이터 연동 디버깅
    console.log('📊 디자이너 수:', designers.length);
    console.log('📋 체크리스트 수:', this.data.checklists.length);
    console.log('📋 체크리스트 샘플:', this.data.checklists.slice(0, 3));
        
        // 권한에 따른 필터링
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            designers = designers.filter(d => d.branch === this.currentUser.branch);
        }

        // 지점 필터 적용
        if (this.filters.branch) {
            designers = designers.filter(d => d.branch === this.filters.branch);
        }

        // 검색 필터 적용
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            designers = designers.filter(d => 
                d.name.toLowerCase().includes(searchTerm) ||
                d.branch.toLowerCase().includes(searchTerm) ||
                d.position.toLowerCase().includes(searchTerm)
            );
        }

        // 활동량 데이터 계산
        designers = this.calculateDesignerActivity(designers);

        // 정렬 적용
        if (this.sortConfig.field) {
            designers.sort((a, b) => {
                const aVal = a[this.sortConfig.field] || 0;
                const bVal = b[this.sortConfig.field] || 0;
                
                if (this.sortConfig.direction === 'asc') {
                    return aVal - bVal;
                } else {
                    return bVal - aVal;
                }
            });
        }

        // 페이지네이션 적용
        this.pagination.totalItems = designers.length;
        this.pagination.totalPages = Math.ceil(designers.length / this.pagination.itemsPerPage);
        
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
        const endIndex = startIndex + this.pagination.itemsPerPage;
        const paginatedDesigners = designers.slice(startIndex, endIndex);

        // 통계 업데이트
        this.updateDesignerStats(designers);

        // 테이블 업데이트
        this.renderDesignersTable(paginatedDesigners);

        // 페이지네이션 업데이트
        this.renderPagination();
    }

// 디자이너 활동량 계산
calculateDesignerActivity(designers) {
    return designers.map(designer => {
        // 다양한 ID로 체크리스트 찾기 시도
        let designerChecklists = this.getFilteredChecklists(designer.id);
        
        // ID로 못 찾으면 이름으로 찾기
        if (designerChecklists.length === 0) {
            designerChecklists = this.getFilteredChecklists(designer.docId);
        }
        
        // 여전히 못 찾으면 이름으로 찾기
        if (designerChecklists.length === 0) {
            designerChecklists = this.data.checklists.filter(c => 
                c.designer === designer.name && 
                (c.branch === designer.branch || !c.branch)
            );
        }
        
        console.log(`🔍 ${designer.name} 체크리스트 찾기: ${designerChecklists.length}개 발견`);
            
            const reviews = designerChecklists.reduce((sum, c) => sum + (c.naverReviews || 0), 0);
            const posts = designerChecklists.reduce((sum, c) => sum + (c.naverPosts || 0), 0);
            const experience = designerChecklists.reduce((sum, c) => sum + (c.naverExperience || 0), 0);
            const reels = designerChecklists.reduce((sum, c) => sum + (c.instaReels || 0), 0);
            const photos = designerChecklists.reduce((sum, c) => sum + (c.instaPhotos || 0), 0);
            const total = reviews + posts + experience + reels + photos;

            return {
                ...designer,
                reviews,
                posts,
                experience,
                reels,
                photos,
                total,
                isActive: total > 0
            };
        });
    }

// 기간별 체크리스트 필터링
getFilteredChecklists(designerId) {
    let checklists = this.data.checklists.filter(c => {
        // 다양한 ID 매칭 방식 시도
        return c.designerId === designerId || 
               c.designerId === String(designerId) ||
               c.designer === this.getDesignerNameById(designerId) ||
               String(c.designerId) === String(designerId);
    });
        
        const now = new Date();
        let filterDate;

        switch(this.filters.period) {
            case 'week':
                filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                filterDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'custom':
                const startDate = document.getElementById('designersStartDate')?.value;
                const endDate = document.getElementById('designersEndDate')?.value;
                if (startDate && endDate) {
                    return checklists.filter(c => c.date >= startDate && c.date <= endDate);
                }
                return checklists;
            case 'all':
            default:
                return checklists;
        }

        return checklists.filter(c => new Date(c.date) >= filterDate);
    }

    // 디자이너 통계 업데이트
    updateDesignerStats(designers) {
        const totalDesigners = designers.length;
        const activeDesigners = designers.filter(d => d.isActive).length;
        const avgActivity = totalDesigners > 0 ? 
            Math.round(designers.reduce((sum, d) => sum + d.total, 0) / totalDesigners) : 0;

        document.getElementById('totalDesigners').textContent = totalDesigners;
        document.getElementById('activeDesigners').textContent = activeDesigners;
        document.getElementById('avgActivity').textContent = avgActivity;
    }

    // 디자이너 테이블 렌더링
    renderDesignersTable(designers) {
        const tbody = document.getElementById('designersList');
        if (!tbody) return;

            // 🔍 활동량 디버깅
    designers.forEach(d => {
        if (d.total > 0) {
            console.log(`✅ ${d.name}: 총 활동량 ${d.total}`);
        } else {
            console.log(`⚠️ ${d.name}: 활동량 0 (체크리스트 연동 확인 필요)`);
        }
    });

        tbody.innerHTML = designers.map(designer => `
            <tr class="designer-row" data-designer-id="${designer.id}">
<td class="font-medium">${designer.name}</td>
<td>${designer.branch}</td>
<td>
    <span class="badge badge-blue">${designer.position}</span>
</td>
<td>${designer.phone}</td>
<td>
    ${designer.instagram ? 
        `<a href="${designer.instagram.startsWith('http') ? designer.instagram : 'https://instagram.com/' + designer.instagram}" 
           target="_blank" 
           class="instagram-link" 
           style="color: #e4405f; text-decoration: none;" 
           title="인스타그램 보기">📷 인스타그램</a>` : 
        '<span style="color: #9ca3af;">-</span>'
    }
</td>
<td>${designer.createdAt}</td>
                <td class="text-center">${designer.reviews}</td>
                <td class="text-center">${designer.posts}</td>
                <td class="text-center">${designer.experience}</td>
                <td class="text-center">${designer.reels}</td>
                <td class="text-center">${designer.photos}</td>
                <td class="text-center font-bold" style="color: #10b981;">${designer.total}</td>
                <td>
                    <div class="flex gap-1">
                        <button onclick="viewDesigner('${designer.docId}')" 
                                class="btn btn-sm" 
                                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                title="상세보기">
                            👁️
                        </button>
                        <button onclick="editDesigner('${designer.docId}')" 
                                class="btn btn-sm" 
                                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                title="수정">
                            ✏️
                        </button>
                        <button onclick="deleteDesigner('${designer.docId}')" 
                                class="btn btn-red btn-sm" 
                                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                title="삭제">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 페이지네이션 렌더링
    renderPagination() {
        const pagination = document.getElementById('designersPagination');
        if (!pagination) return;

        const { currentPage, totalPages, totalItems, itemsPerPage } = this.pagination;
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        let paginationHTML = `
            <button class="pagination-btn" 
                    onclick="window.designersManager.goToPage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                ◀ 이전
            </button>
        `;

        // 페이지 번호들
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}"
                        onclick="window.designersManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button class="pagination-btn" 
                    onclick="window.designersManager.goToPage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                다음 ▶
            </button>
            <div class="pagination-info">
                ${startItem}-${endItem} / ${totalItems}개
            </div>
        `;

        pagination.innerHTML = paginationHTML;
    }

    // 페이지 이동
    goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.currentPage = page;
        this.loadDesigners();
    }

    // 정렬
    sortDesigners(field) {
        if (this.sortConfig.field === field) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.field = field;
            this.sortConfig.direction = 'desc';
        }

        // 정렬 아이콘 업데이트
        document.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('asc', 'desc');
        });

        const currentTh = document.querySelector(`[onclick="sortDesigners('${field}')"]`);
        if (currentTh) {
            currentTh.classList.add(this.sortConfig.direction);
        }

        this.loadDesigners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 기간 선택 변경
const periodSelect = document.getElementById('designersPeriod');
if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
        this.filters.period = e.target.value;
        const customRange = document.getElementById('designersCustomRange');
        
        // 자동 날짜 설정
        this.setAutomaticDateRange(e.target.value);
        
        if (customRange) {
            if (e.target.value === 'custom') {
                customRange.classList.remove('hidden');
            } else {
                customRange.classList.add('hidden');
            }
        }
        this.loadDesigners();
    });
}

        // 지점 필터 변경
        const branchFilter = document.getElementById('designerBranchFilter');
        if (branchFilter) {
            branchFilter.addEventListener('change', (e) => {
                this.filters.branch = e.target.value;
                this.pagination.currentPage = 1; // 첫 페이지로 리셋
                this.loadDesigners();
            });
        }

        // 사용자 정의 날짜 변경
        const startDate = document.getElementById('designersStartDate');
        const endDate = document.getElementById('designersEndDate');
        if (startDate && endDate) {
            startDate.addEventListener('change', () => this.loadDesigners());
            endDate.addEventListener('change', () => this.loadDesigners());
        }

        // 폼 제출 이벤트
        this.setupFormEventListeners();
    }

    // 폼 이벤트 리스너 설정
    setupFormEventListeners() {
        // 디자이너 추가 폼
        const addForm = document.getElementById('addDesignerForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddDesigner();
            });
        }

        // 디자이너 수정 폼
        const editForm = document.getElementById('editDesignerForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditDesigner();
            });
        }
    }

    // 🔥 Firebase에 디자이너 추가 (실제 저장)
    async handleAddDesigner() {
        try {
const formData = {
    name: document.getElementById('designerName').value,
    branch: document.getElementById('designerBranch').value,
    position: document.getElementById('designerPosition').value,
    phone: document.getElementById('designerPhone').value,
    email: document.getElementById('designerEmail').value || '',
    instagram: document.getElementById('designerInstagram').value || '',
    createdAt: new Date().toISOString().split('T')[0],
    notes: ''
};

            console.log('🔥 Firebase에 디자이너 추가 중...', formData);

            // Firebase에 실제로 저장
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                const db = firebase.firestore();
                const docRef = await db.collection('designers').add(formData);
                
                console.log('✅ Firebase에 디자이너 추가 완료. 문서 ID:', docRef.id);
                
                // 로컬 데이터에도 추가
                const newDesigner = {
                    id: docRef.id,
                    docId: docRef.id,
                    ...formData
                };
                this.data.designers.push(newDesigner);
                
            } else {
                // Firebase가 없는 경우 로컬에만 저장
                console.warn('⚠️ Firebase 없음 - 로컬에만 저장');
                const newDesigner = {
                    id: Date.now(),
                    docId: `designer_${Date.now()}`,
                    ...formData
                };
                this.data.designers.push(newDesigner);
            }
            
            this.hideAddDesigner();
            this.loadDesigners();
            
            this.showNotification('디자이너가 성공적으로 추가되었습니다.', 'success');
            
        } catch (error) {
            console.error('❌ 디자이너 추가 오류:', error);
            this.showNotification('디자이너 추가 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }

    // 🔥 Firebase에서 디자이너 수정 (실제 저장)
    async handleEditDesigner() {
        try {
            const docId = document.getElementById('editDesignerId').value;
const formData = {
    name: document.getElementById('editDesignerName').value,
    branch: document.getElementById('editDesignerBranch').value,
    position: document.getElementById('editDesignerPosition').value,
    phone: document.getElementById('editDesignerPhone').value,
    email: document.getElementById('editDesignerEmail').value || '',
    instagram: document.getElementById('editDesignerInstagram').value || '',
    notes: document.getElementById('editDesignerNotes').value || ''
};

            console.log('🔥 Firebase에서 디자이너 수정 중...', docId, formData);

            // Firebase에서 실제로 수정
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                const db = firebase.firestore();
                await db.collection('designers').doc(docId).update(formData);
                
                console.log('✅ Firebase에서 디자이너 수정 완료');
                
            } else {
                console.warn('⚠️ Firebase 없음 - 로컬에만 수정');
            }
            
            // 로컬 데이터도 업데이트
            const designerIndex = this.data.designers.findIndex(d => d.docId === docId);
            if (designerIndex !== -1) {
                this.data.designers[designerIndex] = {
                    ...this.data.designers[designerIndex],
                    ...formData
                };
            }

            this.hideEditDesigner();
            this.loadDesigners();
            
            this.showNotification('디자이너 정보가 성공적으로 수정되었습니다.', 'success');
            
        } catch (error) {
            console.error('❌ 디자이너 수정 오류:', error);
            this.showNotification('디자이너 수정 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }

    // 🔥 Firebase에서 디자이너 삭제 (실제 삭제)
    async deleteDesigner(docId) {
        const designer = this.data.designers.find(d => d.docId === docId);
        if (!designer) return;

        if (confirm(`정말로 "${designer.name}" 디자이너를 삭제하시겠습니까?`)) {
            try {
                console.log('🔥 Firebase에서 디자이너 삭제 중...', docId);

                // Firebase에서 실제로 삭제
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    const db = firebase.firestore();
                    await db.collection('designers').doc(docId).delete();
                    
                    console.log('✅ Firebase에서 디자이너 삭제 완료');
                    
                } else {
                    console.warn('⚠️ Firebase 없음 - 로컬에만 삭제');
                }
                
                // 로컬 데이터에서도 삭제
                this.data.designers = this.data.designers.filter(d => d.docId !== docId);
                
                this.loadDesigners();
                this.showNotification('디자이너가 삭제되었습니다.', 'success');
                
            } catch (error) {
                console.error('❌ 디자이너 삭제 오류:', error);
                this.showNotification('디자이너 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
            }
        }
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        // UI 유틸리티의 showNotification 사용
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // 모달 제어
    showAddDesigner() {
        this.loadBranchOptions();
        document.getElementById('addDesignerModal').classList.remove('hidden');
    }

    hideAddDesigner() {
        document.getElementById('addDesignerModal').classList.add('hidden');
        document.getElementById('addDesignerForm').reset();
    }

    showEditDesigner(docId) {
        const designer = this.data.designers.find(d => d.docId === docId);
        if (!designer) return;

        this.loadBranchOptions();
        
document.getElementById('editDesignerId').value = designer.docId;
document.getElementById('editDesignerName').value = designer.name;
document.getElementById('editDesignerBranch').value = designer.branch;
document.getElementById('editDesignerPosition').value = designer.position;
document.getElementById('editDesignerPhone').value = designer.phone;
document.getElementById('editDesignerEmail').value = designer.email || '';
document.getElementById('editDesignerInstagram').value = designer.instagram || '';
document.getElementById('editDesignerNotes').value = designer.notes || '';
        
        document.getElementById('editDesignerModal').classList.remove('hidden');
    }

    hideEditDesigner() {
        document.getElementById('editDesignerModal').classList.add('hidden');
        document.getElementById('editDesignerForm').reset();
    }

    showViewDesigner(docId) {
        const designer = this.data.designers.find(d => d.docId === docId);
        if (!designer) return;

// 다양한 방식으로 체크리스트 찾기
let designerChecklists = this.data.checklists.filter(c => 
    c.designerId === designer.id || 
    c.designerId === designer.docId ||
    c.designer === designer.name ||
    String(c.designerId) === String(designer.id) ||
    String(c.designerId) === String(designer.docId)
);

// 이름과 지점으로도 찾기
if (designerChecklists.length === 0) {
    designerChecklists = this.data.checklists.filter(c => 
        c.designer === designer.name && 
        (c.branch === designer.branch || !c.branch)
    );
}

console.log(`🔍 ${designer.name} 상세보기 체크리스트: ${designerChecklists.length}개 발견`);        const recentChecklists = designerChecklists.slice(-10).reverse();

        const totalActivity = designerChecklists.reduce((acc, c) => {
            acc.reviews += c.naverReviews || 0;
            acc.posts += c.naverPosts || 0;
            acc.experience += c.naverExperience || 0;
            acc.reels += c.instaReels || 0;
            acc.photos += c.instaPhotos || 0;
            return acc;
        }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });

        const detailHTML = `
            <div class="designer-detail">
                <div class="designer-info">
                    <h4>👤 기본 정보</h4>
                    <div class="info-grid">
<div><strong>이름:</strong> ${designer.name}</div>
<div><strong>지점:</strong> ${designer.branch}</div>
<div><strong>직급:</strong> ${designer.position}</div>
<div><strong>전화번호:</strong> ${designer.phone}</div>
<div><strong>이메일:</strong> ${designer.email || '-'}</div>
<div><strong>인스타그램:</strong> ${designer.instagram ? 
    `<a href="${designer.instagram.startsWith('http') ? designer.instagram : 'https://instagram.com/' + designer.instagram}" 
       target="_blank" style="color: #e4405f;">📷 ${designer.instagram}</a>` : '-'
}</div>
<div><strong>등록일:</strong> ${designer.createdAt}</div>
                    </div>
                    ${designer.notes ? `<div class="mt-4"><strong>메모:</strong><br>${designer.notes}</div>` : ''}
                </div>

                <div class="activity-summary">
                    <h4>📊 전체 활동 요약</h4>
                    <div class="activity-grid">
                        <div class="activity-item">
                            <span>⭐ 네이버 리뷰</span>
                            <span>${totalActivity.reviews}</span>
                        </div>
                        <div class="activity-item">
                            <span>📝 블로그 포스팅</span>
                            <span>${totalActivity.posts}</span>
                        </div>
                        <div class="activity-item">
                            <span>🎯 체험단 운영</span>
                            <span>${totalActivity.experience}</span>
                        </div>
                        <div class="activity-item">
                            <span>🎬 인스타 릴스</span>
                            <span>${totalActivity.reels}</span>
                        </div>
                        <div class="activity-item">
                            <span>📷 인스타 사진</span>
                            <span>${totalActivity.photos}</span>
                        </div>
                    </div>
                </div>

                <div class="recent-activity">
                    <h4>📈 최근 활동 (최근 10건)</h4>
                    ${recentChecklists.length > 0 ? `
                        <div class="activity-table">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>날짜</th>
                                        <th>리뷰</th>
                                        <th>포스팅</th>
                                        <th>체험단</th>
                                        <th>릴스</th>
                                        <th>사진</th>
                                        <th>합계</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentChecklists.map(c => {
                                        const daily = (c.naverReviews || 0) + (c.naverPosts || 0) + (c.naverExperience || 0) + (c.instaReels || 0) + (c.instaPhotos || 0);
                                        return `
                                            <tr>
                                                <td>${c.date}</td>
                                                <td>${c.naverReviews || 0}</td>
                                                <td>${c.naverPosts || 0}</td>
                                                <td>${c.naverExperience || 0}</td>
                                                <td>${c.instaReels || 0}</td>
                                                <td>${c.instaPhotos || 0}</td>
                                                <td class="font-bold">${daily}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<p>최근 활동 기록이 없습니다.</p>'}
                </div>
            </div>
        `;

        document.getElementById('designerDetailContent').innerHTML = detailHTML;
        document.getElementById('viewDesignerModal').classList.remove('hidden');
    }

    hideViewDesigner() {
        document.getElementById('viewDesignerModal').classList.add('hidden');
    }

    // 내보내기
    exportDesigners() {
        const designers = this.calculateDesignerActivity([...this.data.designers]);
        
        let csvContent = "이름,지점,직급,전화번호,이메일,등록일,리뷰,포스팅,체험단,릴스,사진,총활동량\n";
        
        designers.forEach(d => {
            csvContent += `${d.name},${d.branch},${d.position},${d.phone},${d.email || ''},${d.createdAt},${d.reviews},${d.posts},${d.experience},${d.reels},${d.photos},${d.total}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `GOHAIR_디자이너목록_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 전역 함수들
function loadDesigners() {
    window.designersManager?.loadDesigners();
}

function sortDesigners(field) {
    window.designersManager?.sortDesigners(field);
}

function showAddDesigner() {
    window.designersManager?.showAddDesigner();
}

function hideAddDesigner() {
    window.designersManager?.hideAddDesigner();
}

function editDesigner(docId) {
    window.designersManager?.showEditDesigner(docId);
}

function hideEditDesigner() {
    window.designersManager?.hideEditDesigner();
}

function viewDesigner(docId) {
    window.designersManager?.showViewDesigner(docId);
}

function hideViewDesigner() {
    window.designersManager?.hideViewDesigner();
}

function deleteDesigner(docId) {
    window.designersManager?.deleteDesigner(docId);
}

function exportDesigners() {
    window.designersManager?.exportDesigners();
}

function goToMainSystem() {
    window.location.href = '../index.html';
}

function goToPage(pageId) {
    window.location.href = `${pageId}.html`;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.designersManager = new DesignersManager();
    window.designersManager.initialize();
});

console.log('디자이너 페이지 스크립트 로딩 완료');
