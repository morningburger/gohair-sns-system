// 체크리스트 입력 페이지 전용 로직

class ChecklistManager {
    constructor() {
        this.data = {
            designers: [],
            checklists: [],
            branches: []
        };
        this.currentUser = null;
        this.pagination = {
            currentPage: 1,
            itemsPerPage: 15,
            totalItems: 0,
            totalPages: 0
        };
        this.targets = {
            reviews: 10,
            posts: 5,
            experience: 2,
            reels: 8,
            photos: 12
        };
        this.isSubmitting = false;
        
        // 필터 상태
        this.filters = {
            period: 'month',
            startDate: '',
            endDate: '',
            branch: '',
            designer: ''
        };
        
        // 필터링된 데이터
        this.filteredChecklists = [];
    }

    // 페이지 초기화
    async initialize() {
        try {
            // 사용자 정보 확인
            this.currentUser = this.getCurrentUser();
            this.updateUserDisplay();
            
            // 데이터 로드
            await this.loadAllData();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 오늘 날짜 설정
            this.setTodayDate();

            // 지점 옵션 로드
            this.loadBranchOptions();
            
            // 디자이너 옵션 로드
            this.loadDesignerOptions();
            
            // 필터 초기화
            this.initializeFilters();
            
            // 오늘의 요약 로드
            this.loadTodaySummary();
            
            // 최근 기록 로드
            this.loadRecentHistory();

            // 선택 버튼 업데이트
            this.updateSelectButton();
            
            // 권한에 따른 UI 조정
            this.adjustUIByRole();
            
            console.log('체크리스트 페이지 초기화 완료');
        } catch (error) {
            console.error('체크리스트 페이지 초기화 오류:', error);
        }
    }

    // 권한에 따른 UI 조정
    adjustUIByRole() {
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            // 지점 필터 숨기기
            const branchFilterGroup = document.getElementById('branchFilterGroup');
            if (branchFilterGroup) {
                branchFilterGroup.style.display = 'none';
            }
        }
    }

    // 필터 초기화
    initializeFilters() {
        // 기본값 설정
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        this.filters.startDate = firstDayOfMonth.toISOString().split('T')[0];
        this.filters.endDate = lastDayOfMonth.toISOString().split('T')[0];
        
        // UI 업데이트
        document.getElementById('startDate').value = this.filters.startDate;
        document.getElementById('endDate').value = this.filters.endDate;
        document.getElementById('periodFilter').value = 'month';
        
        // 히스토리 필터 옵션 로드
        this.loadHistoryFilterOptions();

        // 초기 필터 적용 추가
        this.applyAllFilters();
    }

// 히스토리 필터 옵션 로드
loadHistoryFilterOptions() {
    // 지점 필터 옵션 (전체관리자만)
    if (this.currentUser && this.currentUser.role === '전체관리자') {
        const branchFilter = document.getElementById('historyBranchFilter');
        if (branchFilter) {
            // branches 배열에서 직접 가져오기
            const branches = this.data.branches;
            branchFilter.innerHTML = '<option value="">전체 지점</option>' +
                branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
        }
    }
    
    // 디자이너 필터 옵션
    this.updateDesignerFilterOptions();
}
        

    // 디자이너 필터 옵션 업데이트
    updateDesignerFilterOptions() {
        const designerFilter = document.getElementById('historyDesignerFilter');
        if (!designerFilter) return;
        
        let designers = [...this.data.designers];
        
        // 지점관리자는 자신의 지점 디자이너만
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            designers = designers.filter(d => d.branch === this.currentUser.branch);
        } else {
            // 전체관리자는 선택된 지점에 따라 필터링
            const selectedBranch = document.getElementById('historyBranchFilter')?.value;
            if (selectedBranch) {
                designers = designers.filter(d => d.branch === selectedBranch);
            }
        }
        
        designerFilter.innerHTML = '<option value="">전체 디자이너</option>' +
            designers.map(d => `<option value="${d.id}">${d.name} (${d.branch})</option>`).join('');
    }

    // 기간 필터 적용
    applyPeriodFilter() {
        const periodFilter = document.getElementById('periodFilter');
        const period = periodFilter.value;
        const today = new Date();
        let startDate, endDate;

        switch (period) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                startDate = startOfWeek.toISOString().split('T')[0];
                endDate = endOfWeek.toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0).toISOString().split('T')[0];
                break;
            case 'half':
                const half = Math.floor(today.getMonth() / 6);
                startDate = new Date(today.getFullYear(), half * 6, 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), (half + 1) * 6, 0).toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
                break;
            case 'all':
                startDate = '2020-01-01';
                endDate = '2030-12-31';
                break;
            case 'custom':
                // 사용자 지정인 경우 현재 값 유지
                return;
        }

        if (period !== 'custom') {
            document.getElementById('startDate').value = startDate;
            document.getElementById('endDate').value = endDate;
            this.filters.startDate = startDate;
            this.filters.endDate = endDate;
            this.filters.period = period;
            this.applyAllFilters();
        }
    }

    // 날짜 필터 적용
    applyDateFilter() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate) {
            this.filters.startDate = startDate;
            this.filters.endDate = endDate;
            this.filters.period = 'custom';
            document.getElementById('periodFilter').value = 'custom';
            this.applyAllFilters();
        }
    }

    // 히스토리 필터 적용
    applyHistoryFilters() {
        const branchFilter = document.getElementById('historyBranchFilter');
        const designerFilter = document.getElementById('historyDesignerFilter');
        
        this.filters.branch = branchFilter?.value || '';
        this.filters.designer = designerFilter?.value || '';
        
        // 지점이 변경되면 디자이너 옵션 업데이트
        if (branchFilter) {
            this.updateDesignerFilterOptions();
        }
        
        this.applyAllFilters();
    }

    // 모든 필터 적용
    applyAllFilters() {
        let filtered = [...this.data.checklists];
        
        // 권한 기반 필터링
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            filtered = filtered.filter(c => c.branch === this.currentUser.branch);
        }
        
        // 날짜 필터
        if (this.filters.startDate && this.filters.endDate) {
            filtered = filtered.filter(c => {
                const checklistDate = c.date;
                return checklistDate >= this.filters.startDate && checklistDate <= this.filters.endDate;
            });
        }
        
        // 지점 필터 (전체관리자만)
        if (this.filters.branch && this.currentUser?.role === '전체관리자') {
            filtered = filtered.filter(c => c.branch === this.filters.branch);
        }
        
        // 디자이너 필터
        if (this.filters.designer) {
            filtered = filtered.filter(c => c.designerId === this.filters.designer);
        }
        
        this.filteredChecklists = filtered;
        
        // 통계 업데이트
        this.updateQuickStats(filtered);
        
        // 페이지네이션 초기화
        this.pagination.currentPage = 1;
        
        // 테이블 로드
        this.loadRecentHistory();
    }

    // 빠른 통계 업데이트
    updateQuickStats(checklists) {
        const stats = checklists.reduce((acc, c) => {
            acc.total += 1;
            acc.reviews += c.naverReviews || 0;
            acc.posts += c.naverPosts || 0;
            acc.experience += c.naverExperience || 0;
            acc.reels += c.instaReels || 0;
            acc.photos += c.instaPhotos || 0;
            return acc;
        }, { total: 0, reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });
        
        stats.activity = stats.reviews + stats.posts + stats.experience + stats.reels + stats.photos;
        
        document.getElementById('statsTotal').textContent = stats.total.toLocaleString();
        document.getElementById('statsReviews').textContent = stats.reviews.toLocaleString();
        document.getElementById('statsPosts').textContent = stats.posts.toLocaleString();
        document.getElementById('statsReels').textContent = stats.reels.toLocaleString();
        document.getElementById('statsPhotos').textContent = stats.photos.toLocaleString();
        document.getElementById('statsActivity').textContent = stats.activity.toLocaleString();
    }

    // 필터 초기화
    resetFilters() {
        // 기본값으로 초기화
        document.getElementById('periodFilter').value = 'month';
        document.getElementById('historyBranchFilter').value = '';
        document.getElementById('historyDesignerFilter').value = '';
        
        this.filters = {
            period: 'month',
            startDate: '',
            endDate: '',
            branch: '',
            designer: ''
        };
        
        // 기간 필터 적용
        this.applyPeriodFilter();
    }

    // 필터링된 기록 내보내기
    exportFilteredHistory() {
        const checklists = this.filteredChecklists;
        
        if (checklists.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }
        
        let csvContent = "\ufeff날짜,디자이너,지점,네이버리뷰,블로그포스팅,체험단,인스타릴스,인스타사진,총합,메모,등록시간\n";
        
        checklists.forEach(c => {
            const total = (c.naverReviews || 0) + (c.naverPosts || 0) + (c.naverExperience || 0) + 
                         (c.instaReels || 0) + (c.instaPhotos || 0);
            const createdAt = new Date(c.createdAt).toLocaleString('ko-KR');
            
            csvContent += `${c.date},${c.designer},"${c.branch}",${c.naverReviews || 0},${c.naverPosts || 0},${c.naverExperience || 0},${c.instaReels || 0},${c.instaPhotos || 0},${total},"${(c.notes || '').replace(/"/g, '""')}","${createdAt}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        
        const startDate = this.filters.startDate || '전체';
        const endDate = this.filters.endDate || '전체';
        const filename = `GOHAIR_체크리스트_${startDate}_${endDate}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 지점 옵션 로드
    loadBranchOptions() {
        console.log('🏢 지점 옵션 로딩 중...');
        
        const branchContainer = document.getElementById('checklistBranch').closest('.form-group');
        const branchSelect = document.getElementById('checklistBranch');
        
        // 지점관리자는 지점 선택 필드 자체를 숨김
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            if (branchContainer) {
                branchContainer.style.display = 'none';
                console.log('🔒 지점관리자 - 지점 선택 필드 숨김');
            }
            
            // 자동으로 지점을 설정하고 디자이너 필터링 실행
            if (branchSelect) {
                branchSelect.value = this.currentUser.branch;
                branchSelect.removeAttribute('required');
            }
            setTimeout(() => this.filterDesignersByBranch(), 100);
            return;
        }
        
        // 전체관리자만 지점 선택 표시
        let branches = this.data.branches;
        
        console.log('🔍 로딩된 지점 데이터:', branches);
        console.log('🔍 지점 수:', branches.length);
        
        if (branchSelect) {
            if (!branches || branches.length === 0) {
                console.error('❌ 지점 데이터가 없습니다!');
                branchSelect.innerHTML = '<option value="">지점 데이터가 없습니다</option>';
                return;
            }
            
            branchSelect.innerHTML = '<option value="">지점을 선택하세요</option>' +
                branches.map(b => `<option value="${b}">${b}</option>`).join('');
            
            console.log(`✅ 지점 옵션 ${branches.length}개 로딩 완료:`, branches);
        }
    }

    // 지점별 디자이너 필터링
    filterDesignersByBranch() {
        const designerSelect = document.getElementById('checklistDesigner');
        let selectedBranch;
        
        // 지점관리자는 자신의 지점 사용
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            selectedBranch = this.currentUser.branch;
        } else {
            // 전체관리자는 선택된 지점 사용
            selectedBranch = document.getElementById('checklistBranch').value;
        }
        
        console.log('🔍 지점별 디자이너 필터링:', selectedBranch);
        
        if (!selectedBranch) {
            designerSelect.innerHTML = '<option value="">먼저 지점을 선택하세요</option>';
            designerSelect.disabled = true;
            return;
        }
        
        // 선택된 지점의 디자이너만 필터링
        let filteredDesigners = this.data.designers.filter(d => d.branch === selectedBranch);
        
        console.log(`🔍 ${selectedBranch} 지점 디자이너: ${filteredDesigners.length}명`);
        
        if (filteredDesigners.length === 0) {
            designerSelect.innerHTML = '<option value="">해당 지점에 디자이너가 없습니다</option>';
            designerSelect.disabled = true;
            return;
        }
        
        // 디자이너 옵션 생성
        designerSelect.innerHTML = '<option value="">디자이너를 선택하세요</option>' +
            filteredDesigners.map(d => `
                <option value="${d.id}">
                    ${d.name} (${d.position})
                </option>
            `).join('');
        
        designerSelect.disabled = false;
        this.updateSelectButton();
        console.log('✅ 디자이너 필터링 완료');
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

    // 사용자 표시 업데이트
    updateUserDisplay() {
        const userElement = document.getElementById('currentUser');
        if (userElement) {
            // 실제 Firebase 연결 상태 확인
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                userElement.textContent = 'Firebase 연결됨 ✅';
                userElement.style.color = '#10b981';
            } else {
                userElement.textContent = 'Firebase 연결 실패 ❌';
                userElement.style.color = '#ef4444';
            }
            userElement.style.fontWeight = '500';
        }
    }

    // 데이터 로드
    async loadAllData() {
        try {
            console.log('📊 실제 Firebase 데이터 로딩 시작...');
            
            // Firebase에서 실제 데이터 로딩
            this.data.designers = await this.loadDesignersFromFirebase();
            this.data.checklists = await this.loadChecklistsFromFirebase();
            this.data.branches = await this.loadBranchesFromFirebase();
            
            console.log('✅ 모든 데이터 로딩 완료');
            console.log('📊 로딩된 데이터 요약:');
            console.log(`- 디자이너: ${this.data.designers.length}개`);
            console.log(`- 체크리스트: ${this.data.checklists.length}개`);
            console.log(`- 지점: ${this.data.branches.length}개`);
            
        } catch (error) {
            console.error('❌ 데이터 로딩 중 오류:', error);
            throw error;
        }
    }

    // 실제 디자이너 데이터 로딩  
    async loadDesignersFromFirebase() {
        try {
            console.log('👥 디자이너 데이터 로딩 중...');
            
            if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
                console.warn('⚠️ Firebase가 초기화되지 않음 - 빈 데이터 반환');
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
            
            if (designers.length === 0) {
                console.log('📝 Firebase에 디자이너 데이터가 없음');
                return [];
            }
            
            return designers;
        } catch (error) {
            console.error('❌ 디자이너 데이터 로딩 실패:', error);
            console.log('🔧 Firebase 연결을 확인하세요');
            return [];
        }
    }

    // 실제 체크리스트 데이터 로딩 - 삭제된 항목 필터링 추가
    async loadChecklistsFromFirebase() {
        try {
            console.log('📋 체크리스트 데이터 로딩 중...');
            
            if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
                console.warn('⚠️ Firebase가 초기화되지 않음 - 빈 데이터 반환');
                return [];
            }

            const db = firebase.firestore();
            const snapshot = await db.collection('checklists')
                .orderBy('createdAt', 'desc')
                .limit(500)
                .get();
            
            const checklists = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // 삭제된 항목은 제외
                if (data.deleted === true) {
                    console.log(`🗑️ 삭제된 체크리스트 제외: ${doc.id}`);
                    return;
                }
                
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
            
            if (checklists.length === 0) {
                console.log('📝 Firebase에 체크리스트 데이터가 없음');
                return [];
            }
            
            return checklists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('❌ 체크리스트 데이터 로딩 실패:', error);
            console.log('🔧 Firebase 연결을 확인하세요');
            return [];
        }
    }

    // 실제 지점 데이터 로딩
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
                branches.push(data.name || '');
            });
            
            console.log(`✅ 지점 데이터 로딩 완료: ${branches.length}개`);
            
            if (branches.length === 0) {
                console.log('📝 Firebase에 지점 데이터가 없음');
                return [];
            }
            
            return branches;
        } catch (error) {
            console.error('❌ 지점 데이터 로딩 실패:', error);
            console.log('🔧 Firebase 연결을 확인하세요');
            return [];
        }
    }

    // Firebase에 체크리스트 저장
    async saveChecklistToFirebase(checklistData) {
        try {
            const db = firebase.firestore();
            const docRef = await db.collection('checklists').add({
                ...checklistData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ 체크리스트가 Firebase에 저장됨:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ 체크리스트 저장 실패:', error);
            throw error;
        }
    }

    // Firebase에서 중복 체크리스트 확인
    async checkDuplicateInFirebase(designerId, date) {
        try {
            if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
                return null;
            }

            const db = firebase.firestore();
            const snapshot = await db.collection('checklists')
                .where('designerId', '==', designerId)
                .where('date', '==', date)
                .get();
            
            // 삭제되지 않은 문서만 확인
            let existingChecklist = null;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.deleted !== true) {
                    existingChecklist = {
                        docId: doc.id,
                        ...data
                    };
                }
            });
            
            return existingChecklist;
        } catch (error) {
            console.error('❌ Firebase 중복 확인 오류:', error);
            return null;
        }
    }

    // Firebase에서 체크리스트 업데이트
    async updateChecklistInFirebase(docId, checklistData) {
        try {
            const db = firebase.firestore();
            await db.collection('checklists').doc(docId).update({
                ...checklistData,
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ 체크리스트 Firebase 업데이트 완료:', docId);
            return docId;
        } catch (error) {
            console.error('❌ 체크리스트 업데이트 실패:', error);
            throw error;
        }
    }

    // 오늘 날짜 설정
    setTodayDate() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayFormatted = today.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        document.getElementById('checklistDate').value = todayStr;
        document.getElementById('todayDate').textContent = todayFormatted;
    }

    // 디자이너 옵션 로드
    loadDesignerOptions() {
        console.log('🔍 loadDesignerOptions 호출됨');
        
        const designers = this.data.designers;
        
        // 디자이너가 없으면 경고
        if (!designers || designers.length === 0) {
            console.error('❌ 디자이너 데이터가 없습니다!');
            const select = document.getElementById('checklistDesigner');
            if (select) {
                select.innerHTML = '<option value="">디자이너 데이터가 없습니다</option>';
                select.disabled = true;
            }
            return;
        }
        
        // 초기에는 지점 선택 전이므로 비활성화
        const select = document.getElementById('checklistDesigner');
        if (select) {
            select.innerHTML = '<option value="">먼저 지점을 선택하세요</option>';
            select.disabled = true;
            console.log('✅ 디자이너 옵션 초기화 완료');
        }
    }

    // 오늘의 요약 로드
    loadTodaySummary() {
        const today = new Date().toISOString().split('T')[0];
        const todayChecklists = this.data.checklists.filter(c => c.date === today);

        // 사용자 권한에 따른 필터링
        let filteredChecklists = todayChecklists;
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            filteredChecklists = todayChecklists.filter(c => c.branch === this.currentUser.branch);
        }

        const totals = filteredChecklists.reduce((acc, c) => {
            acc.reviews += c.naverReviews || 0;
            acc.posts += c.naverPosts || 0;
            acc.experience += c.naverExperience || 0;
            acc.reels += c.instaReels || 0;
            acc.photos += c.instaPhotos || 0;
            return acc;
        }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });

        // 진행률 업데이트
        this.updateProgressBar('reviews', totals.reviews, this.targets.reviews);
        this.updateProgressBar('posts', totals.posts, this.targets.posts);
        this.updateProgressBar('experience', totals.experience, this.targets.experience);
        this.updateProgressBar('reels', totals.reels, this.targets.reels);
        this.updateProgressBar('photos', totals.photos, this.targets.photos);
    }

    // 진행률 바 업데이트
    updateProgressBar(type, current, target) {
        const percentage = Math.min((current / target) * 100, 100);
        
        document.getElementById(`${type}Count`).textContent = current;
        document.getElementById(`${type}Target`).textContent = target;
        document.getElementById(`${type}Progress`).style.width = `${percentage}%`;
        
        // 100% 달성 시 색상 변경
        const progressBar = document.getElementById(`${type}Progress`);
        if (percentage >= 100) {
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
        }
    }

// 최근 기록 로드 (필터링 적용)
loadRecentHistory() {
    let checklists;
    
    // 필터가 적용된 경우 해당 데이터 사용, 아니면 전체 데이터 사용
    if (this.filteredChecklists && this.filteredChecklists.length >= 0 && 
        (this.filters.startDate || this.filters.endDate || 
         this.filters.branch || this.filters.designer)) {
        checklists = [...this.filteredChecklists];
    } else {
        checklists = [...this.data.checklists];
        
        // 권한에 따른 기본 필터링
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            checklists = checklists.filter(c => c.branch === this.currentUser.branch);
        }
    }
    
    // 나머지 코드는 그대로...

        // 페이지네이션 적용
        this.pagination.totalItems = checklists.length;
        this.pagination.totalPages = Math.ceil(checklists.length / this.pagination.itemsPerPage);
        
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
        const endIndex = startIndex + this.pagination.itemsPerPage;
        const paginatedChecklists = checklists.slice(startIndex, endIndex);

        // 테이블 렌더링
        this.renderHistoryTable(paginatedChecklists);
        
        // 페이지네이션 렌더링
        this.renderHistoryPagination();
    }

    // 기록 테이블 렌더링
    renderHistoryTable(checklists) {
        const tbody = document.getElementById('recentHistoryList');
        if (!tbody) return;

        if (checklists.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-8">
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <p>등록된 체크리스트가 없습니다.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = checklists.map(checklist => {
            const total = (checklist.naverReviews || 0) + (checklist.naverPosts || 0) + 
                         (checklist.naverExperience || 0) + (checklist.instaReels || 0) + (checklist.instaPhotos || 0);
            
            const createdDate = new Date(checklist.createdAt);
            const formattedTime = createdDate.toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <tr class="checklist-row" data-checklist-id="${checklist.docId}">
                    <td class="font-medium">${checklist.date}</td>
                    <td>${checklist.designer}</td>
                    <td>
                        <span class="badge badge-blue">${checklist.branch}</span>
                    </td>
                    <td class="text-center">${checklist.naverReviews || 0}</td>
                    <td class="text-center">${checklist.naverPosts || 0}</td>
                    <td class="text-center">${checklist.naverExperience || 0}</td>
                    <td class="text-center">${checklist.instaReels || 0}</td>
                    <td class="text-center">${checklist.instaPhotos || 0}</td>
                    <td class="text-center font-bold" style="color: #10b981;">${total}</td>
                    <td class="text-xs">${formattedTime}</td>
                    <td>
                        <div class="flex gap-1">
                            <button onclick="editChecklist('${checklist.docId}')" 
                                    class="btn btn-sm" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                    title="수정">
                                ✏️
                            </button>
                            <button onclick="deleteChecklist('${checklist.docId}')" 
                                    class="btn btn-red btn-sm" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                                    title="삭제">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 기록 페이지네이션 렌더링
    renderHistoryPagination() {
        const pagination = document.getElementById('historyPagination');
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
                    onclick="window.checklistManager.goToPage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                ◀ 이전
            </button>
        `;

        // 페이지 번호들
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}"
                        onclick="window.checklistManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button class="pagination-btn" 
                    onclick="window.checklistManager.goToPage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                다음 ▶
            </button>
            <div style="margin-left: 1rem; color: #6b7280; font-size: 0.875rem;">
                ${startItem}-${endItem} / ${totalItems}개
            </div>
        `;

        pagination.innerHTML = paginationHTML;
    }

    // 페이지 이동
    goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.currentPage = page;
        this.loadRecentHistory();
    }

    // 선택된 디자이너 정보 로드
    loadSelectedDesignerInfo(designerId) {
        console.log('========== 디자이너 정보 로딩 시작 ==========');
        console.log('🔍 받은 designerId:', designerId);
        console.log('🔍 designerId 타입:', typeof designerId);
        
        const targetElement = document.getElementById('selectedDesignerInfo');
        console.log('🔍 타겟 요소 존재:', !!targetElement);
        
        if (!targetElement) {
            console.error('❌ selectedDesignerInfo 요소를 찾을 수 없음!');
            return;
        }
        
        console.log('🔍 전체 디자이너 수:', this.data.designers.length);
        console.log('🔍 전체 디자이너 목록:', this.data.designers.map(d => ({id: d.id, name: d.name})));
        
        if (!designerId) {
            console.log('⚠️ designerId가 비어있음');
            targetElement.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">ℹ️</div>
                    <p>디자이너를 선택하면 정보가 표시됩니다.</p>
                </div>
            `;
            return;
        }

        const designer = this.data.designers.find(d => 
            d.id === designerId || 
            d.id === String(designerId) || 
            String(d.id) === String(designerId) ||
            d.docId === designerId
        );
        
        console.log('🔍 찾은 디자이너:', designer);

        if (!designer) {
            console.error('❌ 디자이너를 찾을 수 없음:', designerId);
            console.error('❌ 사용 가능한 디자이너 ID들:', this.data.designers.map(d => d.id));
            
            targetElement.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <p>선택된 디자이너 정보를 찾을 수 없습니다.</p>
                    <small>디자이너 ID: ${designerId}</small>
                </div>
            `;
            return;
        }

        console.log('✅ 디자이너 찾기 성공:', designer.name);

        const simpleHTML = `
            <div style="padding: 1rem; background: #f0f9ff; border-radius: 8px; border: 2px solid #0ea5e9;">
                <h4 style="margin: 0 0 0.5rem 0; color: #0c4a6e;">✅ 디자이너 정보 로드 성공!</h4>
                <p><strong>이름:</strong> ${designer.name}</p>
                <p><strong>지점:</strong> ${designer.branch}</p>
                <p><strong>직급:</strong> ${designer.position}</p>
                <p><strong>전화번호:</strong> ${designer.phone}</p>
                <p style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">
                    디자이너 ID: ${designer.id} (타입: ${typeof designer.id})
                </p>
            </div>
        `;
        
        console.log('🔍 HTML 생성 완료, 요소에 삽입 중...');
        targetElement.innerHTML = simpleHTML;
        console.log('✅ HTML 삽입 완료');
        console.log('========== 디자이너 정보 로딩 끝 ==========');
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

    // 섹션 총합 업데이트
    updateSectionTotal(section) {
        if (section === 'naver') {
            const reviews = parseInt(document.getElementById('naverReviews').value) || 0;
            const posts = parseInt(document.getElementById('naverPosts').value) || 0;
            const experience = parseInt(document.getElementById('naverExperience').value) || 0;
            const total = reviews + posts + experience;
            document.getElementById('naverTotal').textContent = total;
        } else if (section === 'instagram') {
            const reels = parseInt(document.getElementById('instaReels').value) || 0;
            const photos = parseInt(document.getElementById('instaPhotos').value) || 0;
            const total = reels + photos;
            document.getElementById('instagramTotal').textContent = total;
        }
        
        this.updateTotalActivity();
    }

    // 전체 활동량 업데이트
    updateTotalActivity() {
        const naverTotal = parseInt(document.getElementById('naverTotal').textContent) || 0;
        const instagramTotal = parseInt(document.getElementById('instagramTotal').textContent) || 0;
        const grandTotal = naverTotal + instagramTotal;
        
        document.getElementById('totalActivity').textContent = grandTotal;
    }

    // 값 증가/감소
    incrementValue(fieldId, section) {
        const input = document.getElementById(fieldId);
        const currentValue = parseInt(input.value) || 0;
        input.value = currentValue + 1;
        this.updateSectionTotal(section);
    }

    decrementValue(fieldId, section) {
        const input = document.getElementById(fieldId);
        const currentValue = parseInt(input.value) || 0;
        if (currentValue > 0) {
            input.value = currentValue - 1;
            this.updateSectionTotal(section);
        }
    }

    // 선택하기 버튼 상태 업데이트
    updateSelectButton() {
        const branchSelect = document.getElementById('checklistBranch');
        const designerSelect = document.getElementById('checklistDesigner');
        const selectBtn = document.getElementById('selectDesignerBtn');
        
        if (selectBtn) {
            const branchSelected = branchSelect?.value || (this.currentUser?.role === '지점관리자' ? this.currentUser.branch : '');
            const designerSelected = designerSelect?.value;
            
            if (branchSelected && designerSelected) {
                selectBtn.disabled = false;
                selectBtn.textContent = '👤 디자이너 정보 보기';
            } else {
                selectBtn.disabled = true;
                selectBtn.textContent = '👤 디자이너 선택하기';
            }
        }
    }

    // 디자이너 선택하기 버튼 클릭
    selectDesigner() {
        console.log('🔍 selectDesigner() 호출됨');
        
        const designerSelect = document.getElementById('checklistDesigner');
        const designerId = designerSelect?.value;
        
        console.log('🔍 디자이너 선택 요소:', designerSelect);
        console.log('🔍 선택된 디자이너 ID:', designerId);
        console.log('🔍 전체 디자이너 옵션들:', Array.from(designerSelect?.options || []).map(opt => opt.value));
        
        if (designerId) {
            console.log('✅ 디자이너 ID가 있음, 정보 로딩 시작');
            this.loadSelectedDesignerInfo(designerId);
            alert('디자이너 정보가 로드되었습니다!');
        } else {
            console.log('❌ 디자이너 ID가 없음');
            alert('먼저 디자이너를 선택해주세요.');
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 지점 선택 변경
        const branchSelect = document.getElementById('checklistBranch');
        if (branchSelect) {
            branchSelect.addEventListener('change', () => {
                this.filterDesignersByBranch();
                // 지점 변경 시 디자이너 정보 초기화
                document.getElementById('selectedDesignerInfo').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">ℹ️</div>
                        <p>디자이너를 선택하면 정보가 표시됩니다.</p>
                    </div>
                `;
            });
        }

        // 디자이너 선택 변경
        const designerSelect = document.getElementById('checklistDesigner');
        if (designerSelect) {
            designerSelect.addEventListener('change', (e) => {
                console.log('🔍 디자이너 선택 변경됨:', e.target.value);
                this.updateSelectButton();
            });
            console.log('✅ 디자이너 선택 이벤트 리스너 설정 완료');
        } else {
            console.error('❌ checklistDesigner select 요소를 찾을 수 없음');
        }

        // 폼 제출 이벤트
        this.setupFormEventListeners();
    }

    // 폼 이벤트 리스너 설정
    setupFormEventListeners() {
        // 체크리스트 제출 폼
        const checklistForm = document.getElementById('checklistForm');
        if (checklistForm) {
            const newForm = checklistForm.cloneNode(true);
            checklistForm.parentNode.replaceChild(newForm, checklistForm);
            
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmitChecklist();
            });
        }

        // 체크리스트 수정 폼
        const editForm = document.getElementById('editChecklistForm');
        if (editForm) {
            const newEditForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newEditForm, editForm);
            
            newEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditChecklist();
            });
        }
    }

    // 체크리스트 제출 처리
    async handleSubmitChecklist() {
        if (this.isSubmitting) {
            console.log('이미 제출 중입니다.');
            return;
        }
        this.isSubmitting = true;
        
        try {
            let selectedBranch;
            if (this.currentUser && this.currentUser.role === '지점관리자') {
                selectedBranch = this.currentUser.branch;
            } else {
                selectedBranch = document.getElementById('checklistBranch').value;
            }
            const designerId = document.getElementById('checklistDesigner').value;

            if (!selectedBranch) {
                alert('지점을 선택해주세요.');
                this.isSubmitting = false;
                return;
            }

            if (!designerId) {
                alert('디자이너를 선택해주세요.');
                this.isSubmitting = false;
                return;
            }

            const designer = this.data.designers.find(d => d.id === designerId);

            if (!designer) {
                alert('선택한 디자이너 정보를 찾을 수 없습니다.');
                this.isSubmitting = false;
                return;
            }

            if (designer.branch !== selectedBranch) {
                alert('선택한 지점과 디자이너의 지점이 일치하지 않습니다.');
                this.isSubmitting = false;
                return;
            }

            const checklistData = {
                id: `checklist_${designerId}_${Date.now()}`,
                docId: `checklist_${designerId}_${Date.now()}`,
                designerId: designerId,
                designer: designer.name,
                branch: designer.branch,
                date: document.getElementById('checklistDate').value,
                naverReviews: parseInt(document.getElementById('naverReviews').value) || 0,
                naverPosts: parseInt(document.getElementById('naverPosts').value) || 0,
                naverExperience: parseInt(document.getElementById('naverExperience').value) || 0,
                instaReels: parseInt(document.getElementById('instaReels').value) || 0,
                instaPhotos: parseInt(document.getElementById('instaPhotos').value) || 0,
                notes: document.getElementById('checklistNotes').value || '',
                createdAt: new Date().toISOString()
            };

            // Firebase에서 실제 중복 확인
            const existingChecklist = await this.checkDuplicateInFirebase(designerId, checklistData.date);

            if (existingChecklist) {
                if (!confirm('해당 날짜에 이미 체크리스트가 있습니다. 덮어쓰시겠습니까?')) {
                    this.isSubmitting = false;
                    return;
                }
                
                try {
                    await this.updateChecklistInFirebase(existingChecklist.docId, checklistData);
                    
                    const localIndex = this.data.checklists.findIndex(c => c.docId === existingChecklist.docId);
                    if (localIndex !== -1) {
                        this.data.checklists[localIndex] = { ...checklistData, docId: existingChecklist.docId };
                    } else {
                        this.data.checklists.unshift({ ...checklistData, docId: existingChecklist.docId });
                    }
                    console.log('✅ 기존 체크리스트 업데이트 완료');
                } catch (error) {
                    console.error('❌ 체크리스트 업데이트 실패:', error);
                    this.showNotification('체크리스트 업데이트 중 오류가 발생했습니다.', 'error');
                    this.isSubmitting = false;
                    return;
                }
            } else {
                try {
                    const savedId = await this.saveChecklistToFirebase(checklistData);
                    checklistData.docId = savedId;
                    checklistData.id = savedId;
                    this.data.checklists.unshift(checklistData);
                    console.log('✅ 새 체크리스트 저장 완료');
                } catch (firebaseError) {
                    console.error('⚠️ Firebase 저장 실패:', firebaseError);
                    this.showNotification('체크리스트 저장 중 오류가 발생했습니다.', 'error');
                    this.isSubmitting = false;
                    return;
                }
            }
            
            // 성공 메시지 표시
            this.showSuccessMessage();
            
            // 폼 리셋 (디자이너 선택과 날짜는 유지)
            this.clearForm();
            
            // 관련 데이터 새로고침
            this.loadTodaySummary();
            this.loadRecentHistory();
            this.loadSelectedDesignerInfo(designerId);
            
        } catch (error) {
            console.error('체크리스트 제출 오류:', error);
            this.showNotification('체크리스트 제출 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    // 폼 초기화
    clearForm() {
        document.getElementById('naverReviews').value = 0;
        document.getElementById('naverPosts').value = 0;
        document.getElementById('naverExperience').value = 0;
        document.getElementById('instaReels').value = 0;
        document.getElementById('instaPhotos').value = 0;
        document.getElementById('checklistNotes').value = '';
        
        this.updateSectionTotal('naver');
        this.updateSectionTotal('instagram');
    }

    // 성공 메시지 표시
    showSuccessMessage() {
        const form = document.getElementById('checklistForm');
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <div class="success-icon">🎉</div>
            <div>체크리스트가 성공적으로 제출되었습니다!</div>
        `;
        
        form.insertBefore(successMessage, form.firstChild);
        
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    }

    // 체크리스트 수정 처리
    async handleEditChecklist() {
        try {
            const docId = document.getElementById('editChecklistId').value;
            const formData = {
                date: document.getElementById('editChecklistDate').value,
                naverReviews: parseInt(document.getElementById('editNaverReviews').value) || 0,
                naverPosts: parseInt(document.getElementById('editNaverPosts').value) || 0,
                naverExperience: parseInt(document.getElementById('editNaverExperience').value) || 0,
                instaReels: parseInt(document.getElementById('editInstaReels').value) || 0,
                instaPhotos: parseInt(document.getElementById('editInstaPhotos').value) || 0,
                notes: document.getElementById('editChecklistNotes').value || ''
            };

            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                await this.updateChecklistInFirebase(docId, formData);
            }

            const checklistIndex = this.data.checklists.findIndex(c => c.docId === docId);
            if (checklistIndex !== -1) {
                this.data.checklists[checklistIndex] = {
                    ...this.data.checklists[checklistIndex],
                    ...formData
                };
            }

            this.hideEditChecklist();
            this.loadRecentHistory();
            this.loadTodaySummary();
            
            this.showNotification('체크리스트가 성공적으로 수정되었습니다.', 'success');
        } catch (error) {
            console.error('체크리스트 수정 오류:', error);
            this.showNotification('체크리스트 수정 중 오류가 발생했습니다.', 'error');
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
    showEditChecklist(docId) {
        const checklist = this.data.checklists.find(c => c.docId === docId);
        if (!checklist) return;

        document.getElementById('editChecklistId').value = checklist.docId;
        document.getElementById('editChecklistDate').value = checklist.date;
        document.getElementById('editNaverReviews').value = checklist.naverReviews || 0;
        document.getElementById('editNaverPosts').value = checklist.naverPosts || 0;
        document.getElementById('editNaverExperience').value = checklist.naverExperience || 0;
        document.getElementById('editInstaReels').value = checklist.instaReels || 0;
        document.getElementById('editInstaPhotos').value = checklist.instaPhotos || 0;
        document.getElementById('editChecklistNotes').value = checklist.notes || '';
        
        document.getElementById('editChecklistModal').classList.remove('hidden');
    }

    hideEditChecklist() {
        document.getElementById('editChecklistModal').classList.add('hidden');
        document.getElementById('editChecklistForm').reset();
    }

    async deleteChecklist(docId) {
        const checklist = this.data.checklists.find(c => c.docId === docId);
        if (!checklist) return;

        if (confirm(`${checklist.date} ${checklist.designer}님의 체크리스트를 삭제하시겠습니까?`)) {
            try {
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    const db = firebase.firestore();
                    await db.collection('checklists').doc(docId).delete();
                    console.log('✅ Firebase에서 체크리스트 삭제 완료:', docId);
                } else {
                    console.warn('⚠️ Firebase 연결 안됨 - 로컬에만 삭제');
                }
                
                this.data.checklists = this.data.checklists.filter(c => c.docId !== docId);
                
                this.loadRecentHistory();
                this.loadTodaySummary();
                this.showNotification('체크리스트가 삭제되었습니다.', 'success');
            } catch (error) {
                console.error('체크리스트 삭제 오류:', error);
                this.showNotification('체크리스트 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
            }
        }
    }

    // 오늘의 요약 새로고침
    refreshTodaySummary() {
        this.loadTodaySummary();
        this.showNotification('오늘의 현황이 새로고침되었습니다.', 'success');
    }

    // 체크리스트 기록 내보내기
    exportChecklistHistory() {
        let checklists = [...this.data.checklists];
        
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            checklists = checklists.filter(c => c.branch === this.currentUser.branch);
        }

        let csvContent = "\ufeff날짜,디자이너,지점,네이버리뷰,블로그포스팅,체험단,인스타릴스,인스타사진,총합,메모,등록시간\n";
        
        checklists.forEach(c => {
            const total = (c.naverReviews || 0) + (c.naverPosts || 0) + (c.naverExperience || 0) + 
                         (c.instaReels || 0) + (c.instaPhotos || 0);
            const createdAt = new Date(c.createdAt).toLocaleString('ko-KR');
            
            csvContent += `${c.date},${c.designer},"${c.branch}",${c.naverReviews || 0},${c.naverPosts || 0},${c.naverExperience || 0},${c.instaReels || 0},${c.instaPhotos || 0},${total},"${(c.notes || '').replace(/"/g, '""')}","${createdAt}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `GOHAIR_체크리스트기록_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 전역 함수들
function updateSectionTotal(section) {
    window.checklistManager?.updateSectionTotal(section);
}

function incrementValue(fieldId, section) {
    window.checklistManager?.incrementValue(fieldId, section);
}

function decrementValue(fieldId, section) {
    window.checklistManager?.decrementValue(fieldId, section);
}

function clearForm() {
    window.checklistManager?.clearForm();
}

function refreshTodaySummary() {
    window.checklistManager?.refreshTodaySummary();
}

function loadRecentHistory() {
    window.checklistManager?.loadRecentHistory();
}

function editChecklist(docId) {
    window.checklistManager?.showEditChecklist(docId);
}

function hideEditChecklist() {
    window.checklistManager?.hideEditChecklist();
}

function deleteChecklist(docId) {
    window.checklistManager?.deleteChecklist(docId);
}

function exportChecklistHistory() {
    window.checklistManager?.exportChecklistHistory();
}

function goToMainSystem() {
    window.location.href = '../index.html';
}

function goToPage(pageId) {
    window.location.href = `${pageId}.html`;
}

function filterDesignersByBranch() {
    window.checklistManager?.filterDesignersByBranch();
}

function selectDesigner() {
    window.checklistManager?.selectDesigner();
}

function updateSelectButton() {
    window.checklistManager?.updateSelectButton();
}

// 필터 관련 전역 함수들
function applyPeriodFilter() {
    window.checklistManager?.applyPeriodFilter();
}

function applyDateFilter() {
    window.checklistManager?.applyDateFilter();
}

function applyHistoryFilters() {
    window.checklistManager?.applyHistoryFilters();
}

function applyAllFilters() {
    window.checklistManager?.applyAllFilters();
}

function resetFilters() {
    window.checklistManager?.resetFilters();
}

function exportFilteredHistory() {
    window.checklistManager?.exportFilteredHistory();
}
