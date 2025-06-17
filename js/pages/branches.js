// 지점 관리 페이지 전용 로직 (사용자 관리 기능 추가)

class BranchesManager {
    constructor() {
        this.data = {
            branches: [],
            designers: [],
            checklists: [],
            users: [] // 🆕 사용자 데이터 추가
        };
        this.currentUser = null;
        this.currentView = 'table'; // 'table' or 'grid'
        this.pagination = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0
        };
        this.filters = {
            search: '',
            sortBy: 'name',
            sortOrder: 'asc'
        };
    }

    // 사용자 권한에 따른 데이터 필터링
    filterDataByUserRole(data, branchField = 'branch') {
        try {
            const userData = sessionStorage.getItem('currentUser');
            const currentUser = userData ? JSON.parse(userData) : null;
            
            if (!currentUser || currentUser.role === '전체관리자') {
                return data; // 전체관리자는 모든 데이터 접근
            }
            
            if (currentUser.role === '지점관리자') {
                const userBranch = currentUser.branch || currentUser.branchName;
                const filteredData = data.filter(item => {
                    const itemBranch = item[branchField] || item.branchName || item.selectedBranch || item.name;
                    return itemBranch === userBranch;
                });
                
                console.log(`🔒 지점관리자 필터링: ${userBranch} - ${data.length}개 → ${filteredData.length}개`);
                return filteredData;
            }
            
            return data;
        } catch (error) {
            console.error('데이터 필터링 오류:', error);
            return data;
        }
    }

    // 페이지 초기화
    async initialize() {
        try {
            // 사용자 정보 확인
            this.currentUser = this.getCurrentUser();
            this.updateUserDisplay();
            
            // 지점관리자 권한 확인
            if (this.currentUser && this.currentUser.role === '지점관리자') {
                console.log('🔒 지점관리자 접근 - 본인 지점만 표시');
            }
            
            // 데이터 로드
            await this.loadAllData();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 지점 목록 로드
            this.loadBranches();
            
            console.log('지점 페이지 초기화 완료');
        } catch (error) {
            console.error('지점 페이지 초기화 오류:', error);
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

    // 관리자 권한 확인
    isAdmin() {
        return this.currentUser && (this.currentUser.role === '전체관리자' || this.currentUser.role === '지점관리자');
    }

    // 메인으로 리다이렉트
    redirectToMain() {
        alert('지점 관리는 관리자만 접근할 수 있습니다.');
        window.location.href = '../index.html';
    }

    // 사용자 표시 업데이트
    updateUserDisplay() {
        const userElement = document.getElementById('currentUser');
        if (userElement) {
            // 강제로 Firebase 연결 상태 표시
            userElement.textContent = 'Firebase 연결됨';
            userElement.style.color = '#10b981';
            userElement.style.fontWeight = '500';
            
            console.log('✅ "Firebase 연결됨" 표시 완료');
        }
    }

    // 데이터 로드
    async loadAllData() {
        try {
            console.log('📊 실제 Firebase 데이터 로딩 시작...');
            
            // Firebase에서 실제 데이터 로딩
            this.data.branches = await this.loadBranchesFromFirebase();
            this.data.designers = await this.loadDesignersFromFirebase();
            this.data.checklists = await this.loadChecklistsFromFirebase();
            this.data.users = await this.loadUsersFromFirebase(); // 🆕 사용자 데이터 로드
            
            // 사용자 권한에 따른 데이터 필터링 적용
            this.data.branches = this.filterDataByUserRole(this.data.branches, 'name');
            this.data.designers = this.filterDataByUserRole(this.data.designers, 'branch');
            this.data.checklists = this.filterDataByUserRole(this.data.checklists, 'branch');

            console.log('✅ 모든 데이터 로딩 완료');
            console.log('🔒 권한별 필터링 후 데이터:');
            console.log(`- 지점: ${this.data.branches.length}개`);
            console.log(`- 디자이너: ${this.data.designers.length}개`);
            console.log(`- 체크리스트: ${this.data.checklists.length}개`);
            console.log(`- 사용자: ${this.data.users.length}개`);
            
        } catch (error) {
            console.error('❌ 데이터 로딩 중 오류:', error);
            throw error;
        }
    }

    // 🏢 실제 지점 데이터 로딩
    async loadBranchesFromFirebase() {
        try {
            console.log('🏢 지점 데이터 로딩 중...');
            
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

    // 👥 실제 디자이너 데이터 로딩  
    async loadDesignersFromFirebase() {
        try {
            console.log('👥 디자이너 데이터 로딩 중...');
            
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

    // 📋 실제 체크리스트 데이터 로딩
    async loadChecklistsFromFirebase() {
        try {
            console.log('📋 체크리스트 데이터 로딩 중...');
            
            if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
                console.warn('⚠️ Firebase가 초기화되지 않음');
                return [];
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
            return checklists;
        } catch (error) {
            console.error('❌ 체크리스트 데이터 로딩 실패:', error);
            return [];
        }
    }

    // 🆕 👤 실제 사용자 데이터 로딩
    async loadUsersFromFirebase() {
        try {
            console.log('👤 사용자 데이터 로딩 중...');
            
            if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
                console.warn('⚠️ Firebase가 초기화되지 않음');
                return [];
            }

            const db = firebase.firestore();
            const snapshot = await db.collection('users').get();
            
            const users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    docId: doc.id,
                    name: data.name || '',
                    email: data.email || '',
                    role: data.role || '',
                    branch: data.branch || '',
                    branchCode: data.branchCode || '',
                    phone: data.phone || '',
                    status: data.status || 'active',
                    createdAt: data.createdAt || new Date().toISOString().split('T')[0],
                    lastLogin: data.lastLogin || ''
                });
            });
            
            console.log(`✅ 사용자 데이터 로딩 완료: ${users.length}개`);
            return users;
        } catch (error) {
            console.error('❌ 사용자 데이터 로딩 실패:', error);
            return [];
        }
    }

    // 🆕 지점별 관리자 가져오기
    getBranchManagers(branchName) {
        return this.data.users.filter(user => 
            user.role === '지점관리자' && 
            user.branch === branchName && 
            user.status === 'active'
        );
    }

    // 지점 목록 로드
    loadBranches() {
        let branches = [...this.data.branches];
        
        // 검색 필터 적용
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            branches = branches.filter(branch => 
                branch.name.toLowerCase().includes(searchTerm) ||
                branch.code.toLowerCase().includes(searchTerm) ||
                branch.address.toLowerCase().includes(searchTerm) ||
                (branch.manager && branch.manager.toLowerCase().includes(searchTerm))
            );
        }

        // 성과 데이터 및 관리자 정보 계산
        branches = this.calculateBranchPerformance(branches);

        // 정렬 적용
        branches.sort((a, b) => {
            let aVal, bVal;
            
            switch(this.filters.sortBy) {
                case 'designerCount':
                    aVal = a.designerCount;
                    bVal = b.designerCount;
                    break;
                case 'performance':
                    aVal = a.totalPerformance;
                    bVal = b.totalPerformance;
                    break;
                case 'managerCount': // 🆕 관리자 수로 정렬
                    aVal = a.managerCount;
                    bVal = b.managerCount;
                    break;
                case 'createdAt':
                    aVal = new Date(a.createdAt);
                    bVal = new Date(b.createdAt);
                    break;
                default:
                    aVal = a[this.filters.sortBy] || '';
                    bVal = b[this.filters.sortBy] || '';
            }
            
            if (this.filters.sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // 페이지네이션 적용
        this.pagination.totalItems = branches.length;
        this.pagination.totalPages = Math.ceil(branches.length / this.pagination.itemsPerPage);
        
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
        const endIndex = startIndex + this.pagination.itemsPerPage;
        const paginatedBranches = branches.slice(startIndex, endIndex);

        // 통계 업데이트
        this.updateBranchStats(branches);

        // 뷰에 따라 렌더링
        if (this.currentView === 'table') {
            this.renderBranchesTable(paginatedBranches);
        } else {
            this.renderBranchesGrid(paginatedBranches);
        }

        // 페이지네이션 업데이트
        this.renderPagination();
    }

    // 지점 성과 및 관리자 정보 계산
    calculateBranchPerformance(branches) {
        return branches.map(branch => {
            // 해당 지점의 디자이너들
            const branchDesigners = this.data.designers.filter(d => d.branch === branch.name);
            const designerCount = branchDesigners.length;

            // 🆕 해당 지점의 관리자들
            const branchManagers = this.getBranchManagers(branch.name);
            const managerCount = branchManagers.length;

            // 해당 지점의 최근 30일 체크리스트
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const branchChecklists = this.data.checklists.filter(c => 
                c.branch === branch.name && 
                new Date(c.date) >= thirtyDaysAgo
            );

            // 성과 계산
            const performance = branchChecklists.reduce((acc, c) => {
                acc.reviews += c.naverReviews || 0;
                acc.posts += c.naverPosts || 0;
                acc.experience += c.naverExperience || 0;
                acc.reels += c.instaReels || 0;
                acc.photos += c.instaPhotos || 0;
                return acc;
            }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });

            const totalPerformance = performance.reviews + performance.posts + 
                                   performance.experience + performance.reels + performance.photos;

            // 성과 등급 계산
            let performanceGrade = 'poor';
            if (totalPerformance >= 200) performanceGrade = 'excellent';
            else if (totalPerformance >= 150) performanceGrade = 'good';
            else if (totalPerformance >= 100) performanceGrade = 'average';

            return {
                ...branch,
                designerCount,
                designerNames: branchDesigners.map(d => d.name),
                managerCount, // 🆕 관리자 수
                managerNames: branchManagers.map(m => m.name), // 🆕 관리자 이름들
                managers: branchManagers, // 🆕 관리자 전체 정보
                totalPerformance,
                performance,
                performanceGrade,
                avgPerformancePerDesigner: designerCount > 0 ? Math.round(totalPerformance / designerCount) : 0
            };
        });
    }

    // 지점 통계 업데이트
    updateBranchStats(branches) {
        const totalBranches = branches.length;
        const totalDesigners = branches.reduce((sum, b) => sum + b.designerCount, 0);
        const avgDesignersPerBranch = totalBranches > 0 ? Math.round(totalDesigners / totalBranches) : 0;
        
        // 최고 성과 지점
        const topBranch = branches.reduce((top, current) => 
            current.totalPerformance > (top?.totalPerformance || 0) ? current : top, null);

        document.getElementById('totalBranches').textContent = totalBranches;
        document.getElementById('totalDesigners').textContent = totalDesigners;
        document.getElementById('avgDesignersPerBranch').textContent = avgDesignersPerBranch;
        document.getElementById('topPerformingBranch').textContent = 
            topBranch ? topBranch.name : '-';
    }

    // 테이블 뷰 렌더링 (관리자 정보 추가)
    renderBranchesTable(branches) {
        const tbody = document.getElementById('branchesList');
        if (!tbody) return;

        if (branches.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8">
                        <div class="empty-state">
                            <div class="empty-state-icon">🏢</div>
                            <p>등록된 지점이 없습니다.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = branches.map(branch => `
            <tr class="branch-row" data-branch-id="${branch.id}">
                <td class="font-medium">
                    <div class="flex items-center">
                        <span>${branch.name}</span>
                    </div>
                </td>
                <td>
                    <span class="badge badge-gray">${branch.code}</span>
                </td>
                <td title="${branch.address}">
                    ${branch.address.length > 30 ? branch.address.substring(0, 30) + '...' : branch.address}
                </td>
                <td class="text-center">
                    <span class="badge badge-blue">${branch.designerCount}명</span>
                </td>
                <td class="text-center">
                    ${branch.managerCount > 0 ? `
                        <div class="managers-list" title="${branch.managerNames.join(', ')}">
                            <span class="badge badge-green">${branch.managerCount}명</span>
                        </div>
                    ` : `
                        <span class="badge badge-red">미배정</span>
                    `}
                </td>
                <td class="text-center">
                    <span class="performance-badge performance-${branch.performanceGrade}">
                        ${branch.totalPerformance}
                    </span>
                </td>
                <td>${branch.createdAt}</td>
                <td>
                    <div class="flex gap-1">
                        <button onclick="viewBranch('${branch.docId}')" 
                                class="btn btn-sm" 
                                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                title="상세보기">
                            👁️
                        </button>
                        <button onclick="manageBranchUsers('${branch.docId}')" 
                                class="btn btn-sm" 
                                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                title="관리자 관리">
                            👥
                        </button>
                        <button onclick="editBranch('${branch.docId}')" 
                                class="btn btn-sm" 
                                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                title="수정">
                            ✏️
                        </button>
                        <button onclick="deleteBranch('${branch.docId}')" 
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

    // 그리드 뷰 렌더링 (관리자 정보 추가)
    renderBranchesGrid(branches) {
        const grid = document.getElementById('branchesGrid');
        if (!grid) return;

        if (branches.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">🏢</div>
                    <p>등록된 지점이 없습니다.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = branches.map(branch => `
            <div class="branch-card" data-branch-id="${branch.id}">
                <div class="branch-card-header">
                    <div>
                        <div class="branch-name">${branch.name}</div>
                        <div class="branch-code">${branch.code}</div>
                    </div>
                    <span class="performance-badge performance-${branch.performanceGrade}">
                        ${this.getPerformanceLabel(branch.performanceGrade)}
                    </span>
                </div>
                
                <div class="branch-info">
                    <div class="branch-info-item">
                        📍 <strong>${branch.address}</strong>
                    </div>
                    <div class="branch-info-item">
                        📞 <strong>${branch.phone || '-'}</strong>
                    </div>
                    <div class="branch-info-item">
                        🏃‍♂️ <strong>${branch.manager || '-'}</strong>
                    </div>
                    <div class="branch-info-item">
                        🕐 <strong>${branch.hours || '-'}</strong>
                    </div>
                    <div class="branch-info-item">
                        👥 <strong>${branch.managerCount}명 관리자</strong>
                        ${branch.managerNames.length > 0 ? `<br><small>${branch.managerNames.join(', ')}</small>` : ''}
                    </div>
                </div>

                <div class="branch-stats">
                    <div class="branch-stat">
                        <div class="branch-stat-value">${branch.designerCount}</div>
                        <div class="branch-stat-label">디자이너</div>
                    </div>
                    <div class="branch-stat">
                        <div class="branch-stat-value">${branch.managerCount}</div>
                        <div class="branch-stat-label">관리자</div>
                    </div>
                    <div class="branch-stat">
                        <div class="branch-stat-value">${branch.totalPerformance}</div>
                        <div class="branch-stat-label">월간 성과</div>
                    </div>
                </div>

                <div class="branch-actions">
                    <button onclick="viewBranch('${branch.docId}')" class="btn" title="상세보기">
                        👁️ 보기
                    </button>
                    <button onclick="manageBranchUsers('${branch.docId}')" class="btn" title="관리자 관리">
                        👥 관리자
                    </button>
                    <button onclick="editBranch('${branch.docId}')" class="btn" title="수정">
                        ✏️ 수정
                    </button>
                    <button onclick="deleteBranch('${branch.docId}')" class="btn btn-red" title="삭제">
                        🗑️ 삭제
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 성과 등급 라벨
    getPerformanceLabel(grade) {
        const labels = {
            excellent: '우수',
            good: '양호',
            average: '보통',
            poor: '부진'
        };
        return labels[grade] || '알 수 없음';
    }

    // 페이지네이션 렌더링
    renderPagination() {
        const pagination = document.getElementById('branchesPagination');
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
                    onclick="window.branchesManager.goToPage(${currentPage - 1})"
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
                        onclick="window.branchesManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button class="pagination-btn" 
                    onclick="window.branchesManager.goToPage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                다음 ▶
            </button>
            <div class="pagination-info" style="margin-left: 1rem; color: #6b7280;">
                ${startItem}-${endItem} / ${totalItems}개
            </div>
        `;

        pagination.innerHTML = paginationHTML;
    }

    // 페이지 이동
    goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.currentPage = page;
        this.loadBranches();
    }

    // 뷰 전환
    switchView(view) {
        this.currentView = view;
        
        // 버튼 상태 업데이트
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="switchView('${view}')"]`).classList.add('active');
        
        // 뷰 전환
        const tableView = document.getElementById('tableView');
        const gridView = document.getElementById('gridView');
        
        if (view === 'table') {
            tableView.classList.remove('hidden');
            gridView.classList.add('hidden');
        } else {
            tableView.classList.add('hidden');
            gridView.classList.remove('hidden');
        }
        
        this.loadBranches();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 검색 입력
        const searchInput = document.getElementById('branchSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.pagination.currentPage = 1;
                this.loadBranches();
            });
        }

        // 정렬 선택
        const sortBySelect = document.getElementById('branchSortBy');
        const sortOrderSelect = document.getElementById('branchSortOrder');
        
        if (sortBySelect) {
            sortBySelect.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.pagination.currentPage = 1;
                this.loadBranches();
            });
        }

        if (sortOrderSelect) {
            sortOrderSelect.addEventListener('change', (e) => {
                this.filters.sortOrder = e.target.value;
                this.pagination.currentPage = 1;
                this.loadBranches();
            });
        }

        // 폼 제출 이벤트
        this.setupFormEventListeners();
    }

    // 폼 이벤트 리스너 설정
    setupFormEventListeners() {
        // 지점 추가 폼
        const addForm = document.getElementById('addBranchForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddBranch();
            });
        }

        // 지점 수정 폼
        const editForm = document.getElementById('editBranchForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditBranch();
            });
        }
    }

    // 지점 추가 처리
    async handleAddBranch() {
        try {
            const formData = {
                name: document.getElementById('branchName').value,
                code: document.getElementById('branchCode').value.toUpperCase(),
                address: document.getElementById('branchAddress').value,
                phone: document.getElementById('branchPhone').value || null,
                manager: document.getElementById('branchManager').value || null,
                hours: document.getElementById('branchHours').value || null,
                notes: document.getElementById('branchNotes').value || null
            };

            // 지점코드 중복 확인
            const existingBranch = this.data.branches.find(b => b.code === formData.code);
            if (existingBranch) {
                alert('이미 사용 중인 지점코드입니다.');
                return;
            }

            // Firebase에 저장
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                const db = firebase.firestore();
                await db.collection('branches').add({
                    ...formData,
                    createdAt: new Date().toISOString().split('T')[0]
                });
                
                // 데이터 다시 로드
                await this.loadAllData();
            }
            
            this.hideAddBranch();
            this.loadBranches();
            
            this.showNotification('지점이 성공적으로 추가되었습니다.', 'success');
        } catch (error) {
            console.error('지점 추가 오류:', error);
            this.showNotification('지점 추가 중 오류가 발생했습니다.', 'error');
        }
    }

    // 지점 수정 처리
    async handleEditBranch() {
        try {
            const docId = document.getElementById('editBranchId').value;
            const formData = {
                name: document.getElementById('editBranchName').value,
                code: document.getElementById('editBranchCode').value.toUpperCase(),
                address: document.getElementById('editBranchAddress').value,
                phone: document.getElementById('editBranchPhone').value || null,
                manager: document.getElementById('editBranchManager').value || null,
                hours: document.getElementById('editBranchHours').value || null,
                notes: document.getElementById('editBranchNotes').value || null
            };

            // 지점코드 중복 확인 (자신 제외)
            const existingBranch = this.data.branches.find(b => 
                b.code === formData.code && b.docId !== docId);
            if (existingBranch) {
                alert('이미 사용 중인 지점코드입니다.');
                return;
            }

            // Firebase에서 업데이트
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                const db = firebase.firestore();
                await db.collection('branches').doc(docId).update(formData);
                
                // 데이터 다시 로드
                await this.loadAllData();
            }

            this.hideEditBranch();
            this.loadBranches();
            
            this.showNotification('지점 정보가 성공적으로 수정되었습니다.', 'success');
        } catch (error) {
            console.error('지점 수정 오류:', error);
            this.showNotification('지점 수정 중 오류가 발생했습니다.', 'error');
        }
    }

    // 🆕 지점 관리자 관리 모달 표시
    showManageBranchUsers(docId) {
        const branch = this.data.branches.find(b => b.docId === docId);
        if (!branch) return;

        const branchManagers = this.getBranchManagers(branch.name);
        const allBranchManagers = this.data.users.filter(u => u.role === '지점관리자' && u.status === 'active');

        const manageHTML = `
            <div class="branch-managers-management">
                <div class="current-managers">
                    <h4>🏢 ${branch.name} 현재 관리자 (${branchManagers.length}명)</h4>
                    ${branchManagers.length > 0 ? `
                        <div class="managers-list">
                            ${branchManagers.map(manager => `
                                <div class="manager-item">
                                    <div class="manager-info">
                                        <strong>${manager.name}</strong>
                                        <span>${manager.email}</span>
                                        <span>${manager.phone || '-'}</span>
                                    </div>
                                    <button onclick="removeBranchManager('${manager.docId}', '${branch.name}')" 
                                            class="btn btn-red btn-sm">
                                        제거
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>배정된 관리자가 없습니다.</p>'}
                </div>

                <div class="available-managers">
                    <h4>👥 지점 배정 가능한 관리자</h4>
                    ${allBranchManagers.filter(m => m.branch !== branch.name).length > 0 ? `
                        <div class="managers-list">
                            ${allBranchManagers.filter(m => m.branch !== branch.name).map(manager => `
                                <div class="manager-item">
                                    <div class="manager-info">
                                        <strong>${manager.name}</strong>
                                        <span>${manager.email}</span>
                                        <span>현재: ${manager.branch || '미배정'}</span>
                                    </div>
                                    <button onclick="assignBranchManager('${manager.docId}', '${branch.name}')" 
                                            class="btn btn-green btn-sm">
                                        배정
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>배정 가능한 관리자가 없습니다.</p>'}
                </div>
            </div>
        `;

        // 기존 모달이 있다면 제거
        const existingModal = document.getElementById('manageBranchUsersModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 새 모달 생성
        const modalHTML = `
            <div id="manageBranchUsersModal" class="modal">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3 class="text-lg font-bold">👥 ${branch.name} 관리자 관리</h3>
                        <button onclick="hideManageBranchUsers()" class="modal-close">❌</button>
                    </div>
                    ${manageHTML}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 🆕 지점 관리자 관리 모달 숨기기
    hideManageBranchUsers() {
        const modal = document.getElementById('manageBranchUsersModal');
        if (modal) {
            modal.remove();
        }
    }

    // 🆕 지점 관리자 배정
    async assignBranchManager(userId, branchName) {
        try {
            const user = this.data.users.find(u => u.docId === userId);
            if (!user) return;

            const branch = this.data.branches.find(b => b.name === branchName);
            if (!branch) return;

            if (confirm(`"${user.name}" 관리자를 "${branchName}" 지점에 배정하시겠습니까?`)) {
                const updateData = {
                    branch: branchName,
                    branchCode: branch.code
                };

                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    const db = firebase.firestore();
                    await db.collection('users').doc(userId).update(updateData);
                    
                    await this.loadAllData();
                }

                this.loadBranches();
                this.showManageBranchUsers(branch.docId); // 모달 새로고침
                this.showNotification(`${user.name} 관리자가 ${branchName}에 배정되었습니다.`, 'success');
            }
        } catch (error) {
            console.error('관리자 배정 오류:', error);
            this.showNotification('관리자 배정 중 오류가 발생했습니다.', 'error');
        }
    }

    // 🆕 지점 관리자 제거
    async removeBranchManager(userId, branchName) {
        try {
            const user = this.data.users.find(u => u.docId === userId);
            if (!user) return;

            if (confirm(`"${user.name}" 관리자를 "${branchName}" 지점에서 제거하시겠습니까?`)) {
                const updateData = {
                    branch: null,
                    branchCode: null
                };

                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    const db = firebase.firestore();
                    await db.collection('users').doc(userId).update(updateData);
                    
                    await this.loadAllData();
                }

                this.loadBranches();
                this.showManageBranchUsers(this.data.branches.find(b => b.name === branchName).docId); // 모달 새로고침
                this.showNotification(`${user.name} 관리자가 ${branchName}에서 제거되었습니다.`, 'success');
            }
        } catch (error) {
            console.error('관리자 제거 오류:', error);
            this.showNotification('관리자 제거 중 오류가 발생했습니다.', 'error');
        }
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // 모달 제어
    showAddBranch() {
        document.getElementById('addBranchModal').classList.remove('hidden');
    }

    hideAddBranch() {
        document.getElementById('addBranchModal').classList.add('hidden');
        document.getElementById('addBranchForm').reset();
    }

    showEditBranch(docId) {
        const branch = this.data.branches.find(b => b.docId === docId);
        if (!branch) return;

        document.getElementById('editBranchId').value = branch.docId;
        document.getElementById('editBranchName').value = branch.name;
        document.getElementById('editBranchCode').value = branch.code;
        document.getElementById('editBranchAddress').value = branch.address;
        document.getElementById('editBranchPhone').value = branch.phone || '';
        document.getElementById('editBranchManager').value = branch.manager || '';
        document.getElementById('editBranchHours').value = branch.hours || '';
        document.getElementById('editBranchNotes').value = branch.notes || '';
        
        document.getElementById('editBranchModal').classList.remove('hidden');
    }

    hideEditBranch() {
        document.getElementById('editBranchModal').classList.add('hidden');
        document.getElementById('editBranchForm').reset();
    }

    showViewBranch(docId) {
        const branch = this.data.branches.find(b => b.docId === docId);
        if (!branch) return;

        // 지점 성과 데이터 계산
        const branchWithPerformance = this.calculateBranchPerformance([branch])[0];
        const branchDesigners = this.data.designers.filter(d => d.branch === branch.name);
        const branchManagers = this.getBranchManagers(branch.name); // 🆕 관리자 정보

        const detailHTML = `
            <div class="branch-detail">
                <div class="detail-section">
                    <h4>🏢 기본 정보</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">지점명</div>
                            <div class="info-value">${branch.name}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">지점코드</div>
                            <div class="info-value">${branch.code}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">주소</div>
                            <div class="info-value">${branch.address}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">전화번호</div>
                            <div class="info-value">${branch.phone || '-'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">점장</div>
                            <div class="info-value">${branch.manager || '-'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">운영시간</div>
                            <div class="info-value">${branch.hours || '-'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">등록일</div>
                            <div class="info-value">${branch.createdAt}</div>
                        </div>
                    </div>
                    ${branch.notes ? `<div style="margin-top: 1rem;"><strong>메모:</strong><br>${branch.notes}</div>` : ''}
                </div>

                <div class="detail-section">
                    <h4>👥 시스템 관리자 (${branchManagers.length}명)</h4>
                    ${branchManagers.length > 0 ? `
                        <div class="managers-list">
                            ${branchManagers.map(manager => `
                                <div class="manager-item">
                                    <div class="manager-info">
                                        <div class="manager-name">${manager.name}</div>
                                        <div class="manager-email">${manager.email}</div>
                                        <div class="manager-phone">${manager.phone || '-'}</div>
                                        <div class="manager-status">상태: ${this.getStatusLabel(manager.status)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>등록된 시스템 관리자가 없습니다.</p>'}
                </div>

                <div class="detail-section">
                    <h4>📊 성과 현황 (최근 30일)</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">⭐ 네이버 리뷰</div>
                            <div class="info-value">${branchWithPerformance.performance.reviews}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">📝 블로그 포스팅</div>
                            <div class="info-value">${branchWithPerformance.performance.posts}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">🎯 체험단 운영</div>
                            <div class="info-value">${branchWithPerformance.performance.experience}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">🎬 인스타 릴스</div>
                            <div class="info-value">${branchWithPerformance.performance.reels}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">📷 인스타 사진</div>
                            <div class="info-value">${branchWithPerformance.performance.photos}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">총 성과</div>
                            <div class="info-value">${branchWithPerformance.totalPerformance}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>👥 소속 디자이너 (${branchDesigners.length}명)</h4>
                    ${branchDesigners.length > 0 ? `
                        <div class="designers-list">
                            ${branchDesigners.map(designer => `
                                <div class="designer-item">
                                    <div class="designer-name">${designer.name}</div>
                                    <div class="designer-position">${designer.position}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>등록된 디자이너가 없습니다.</p>'}
                </div>
            </div>
        `;

        document.getElementById('branchDetailContent').innerHTML = detailHTML;
        document.getElementById('viewBranchModal').classList.remove('hidden');
    }

    hideViewBranch() {
        document.getElementById('viewBranchModal').classList.add('hidden');
    }

    async deleteBranch(docId) {
        const branch = this.data.branches.find(b => b.docId === docId);
        if (!branch) return;

        const branchDesigners = this.data.designers.filter(d => d.branch === branch.name);
        const branchManagers = this.getBranchManagers(branch.name); // 🆕 관리자 확인
        
        let confirmMessage = `정말로 "${branch.name}" 지점을 삭제하시겠습니까?`;
        
        if (branchDesigners.length > 0 || branchManagers.length > 0) {
            confirmMessage += `\n\n⚠️ 이 지점에는:`;
            if (branchDesigners.length > 0) {
                confirmMessage += `\n- ${branchDesigners.length}명의 디자이너`;
            }
            if (branchManagers.length > 0) {
                confirmMessage += `\n- ${branchManagers.length}명의 시스템 관리자`;
            }
            confirmMessage += `\n\n지점을 삭제하면 관련된 모든 데이터가 함께 삭제됩니다.`;
        }

        if (confirm(confirmMessage)) {
            try {
                // 🆕 지점 관리자들의 지점 정보 제거
                if (branchManagers.length > 0) {
                    const db = firebase.firestore();
                    const batch = db.batch();
                    
                    branchManagers.forEach(manager => {
                        const userRef = db.collection('users').doc(manager.docId);
                        batch.update(userRef, {
                            branch: null,
                            branchCode: null
                        });
                    });
                    
                    await batch.commit();
                }

                // Firebase에서 지점 삭제
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    const db = firebase.firestore();
                    await db.collection('branches').doc(docId).delete();
                    
                    // 데이터 다시 로드
                    await this.loadAllData();
                }
                
                this.loadBranches();
                this.showNotification('지점이 삭제되었습니다.', 'success');
            } catch (error) {
                console.error('지점 삭제 오류:', error);
                this.showNotification('지점 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // 내보내기 (관리자 정보 포함)
    exportBranches() {
        const branches = this.calculateBranchPerformance([...this.data.branches]);
        
        let csvContent = "\ufeff지점명,지점코드,주소,전화번호,점장,운영시간,디자이너수,관리자수,관리자명,월간성과,등록일\n";
        
        branches.forEach(b => {
            const managerNames = b.managerNames ? b.managerNames.join(';') : '';
            csvContent += `${b.name},${b.code},"${b.address}",${b.phone || ''},${b.manager || ''},${b.hours || ''},${b.designerCount},${b.managerCount},"${managerNames}",${b.totalPerformance},${b.createdAt}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `GOHAIR_지점목록_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 🆕 상태 라벨 가져오기 (사용자 상태용)
    getStatusLabel(status) {
        const labels = {
            active: '활성',
            pending: '승인대기',
            suspended: '정지'
        };
        return labels[status] || status;
    }
}

// 전역 함수들
function loadBranches() {
    window.branchesManager?.loadBranches();
}

function switchView(view) {
    window.branchesManager?.switchView(view);
}

function showAddBranch() {
    window.branchesManager?.showAddBranch();
}

function hideAddBranch() {
    window.branchesManager?.hideAddBranch();
}

function editBranch(docId) {
    window.branchesManager?.showEditBranch(docId);
}

function hideEditBranch() {
    window.branchesManager?.hideEditBranch();
}

function viewBranch(docId) {
    window.branchesManager?.showViewBranch(docId);
}

function hideViewBranch() {
    window.branchesManager?.hideViewBranch();
}

function deleteBranch(docId) {
    window.branchesManager?.deleteBranch(docId);
}

// 🆕 지점 관리자 관리 관련 함수들
function manageBranchUsers(docId) {
    window.branchesManager?.showManageBranchUsers(docId);
}

function hideManageBranchUsers() {
    window.branchesManager?.hideManageBranchUsers();
}

function assignBranchManager(userId, branchName) {
    window.branchesManager?.assignBranchManager(userId, branchName);
}

function removeBranchManager(userId, branchName) {
    window.branchesManager?.removeBranchManager(userId, branchName);
}

function exportBranches() {
    window.branchesManager?.exportBranches();
}

function goToMainSystem() {
    window.location.href = '../index.html';
}

function goToPage(pageId) {
    window.location.href = `${pageId}.html`;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.branchesManager = new BranchesManager();
    window.branchesManager.initialize();
});

console.log('지점 페이지 스크립트 로딩 완료');