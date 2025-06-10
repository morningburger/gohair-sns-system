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
            
            // 디자이너 옵션 로드
            this.loadDesignerOptions();
            
            // 오늘의 요약 로드
            this.loadTodaySummary();
            
            // 최근 기록 로드
            this.loadRecentHistory();
            
            console.log('체크리스트 페이지 초기화 완료');
        } catch (error) {
            console.error('체크리스트 페이지 초기화 오류:', error);
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

    // 사용자 표시 업데이트
    updateUserDisplay() {
        const userElement = document.getElementById('currentUser');
        if (userElement && this.currentUser) {
            userElement.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
        }
    }

    // 데이터 로드
    async loadAllData() {
        try {
            // 실제로는 Firebase에서 로드
            this.data.designers = this.generateSampleDesigners();
            this.data.checklists = this.generateSampleChecklists();
            this.data.branches = this.generateSampleBranches();
            
        } catch (error) {
            console.error('데이터 로딩 오류:', error);
            throw error;
        }
    }

    // 샘플 데이터 생성
    generateSampleDesigners() {
        const branches = ['송도센트럴점', '검단테라스점', '부평점', '인천논현점', '청라국제점'];
        const positions = ['인턴', '디자이너', '팀장', '실장'];
        const names = ['김수현', '이지민', '박준호', '최미영', '정태윤', '한소희', '오민석', '신예은'];
        
        return names.map((name, index) => ({
            id: index + 1,
            docId: `designer_${index + 1}`,
            name: name,
            branch: branches[Math.floor(Math.random() * branches.length)],
            position: positions[Math.floor(Math.random() * positions.length)],
            phone: `010-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));
    }

    generateSampleChecklists() {
        const data = [];
        const designers = this.data.designers || this.generateSampleDesigners();
        
        designers.forEach(designer => {
            const recordCount = Math.floor(Math.random() * 15) + 10; // 10-24개 기록
            
            for (let i = 0; i < recordCount; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // 최근 30일
                
                data.push({
                    id: `checklist_${designer.id}_${i}`,
                    docId: `checklist_${designer.id}_${i}`,
                    designerId: designer.id,
                    designer: designer.name,
                    branch: designer.branch,
                    date: date.toISOString().split('T')[0],
                    naverReviews: Math.floor(Math.random() * 8),
                    naverPosts: Math.floor(Math.random() * 4),
                    naverExperience: Math.floor(Math.random() * 2),
                    instaReels: Math.floor(Math.random() * 6),
                    instaPhotos: Math.floor(Math.random() * 10),
                    notes: i % 5 === 0 ? '오늘은 특별히 좋은 반응이었습니다!' : '',
                    createdAt: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
                });
            }
        });
        
        return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    generateSampleBranches() {
        return ['송도센트럴점', '검단테라스점', '부평점', '인천논현점', '청라국제점'];
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
        let designers = this.data.designers;
        
        // 사용자 권한에 따른 필터링
        if (this.currentUser && this.currentUser.role === 'leader') {
            designers = designers.filter(d => d.branch === this.currentUser.branch);
        }

        const select = document.getElementById('checklistDesigner');
        if (select) {
            select.innerHTML = '<option value="">디자이너를 선택하세요</option>' +
                designers.map(d => `
                    <option value="${d.id}">
                        ${d.name} (${d.branch} - ${d.position})
                    </option>
                `).join('');
        }
    }

    // 오늘의 요약 로드
    loadTodaySummary() {
        const today = new Date().toISOString().split('T')[0];
        const todayChecklists = this.data.checklists.filter(c => c.date === today);

        // 사용자 권한에 따른 필터링
        let filteredChecklists = todayChecklists;
        if (this.currentUser && this.currentUser.role === 'leader') {
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

    // 최근 기록 로드
    loadRecentHistory() {
        let checklists = [...this.data.checklists];
        
        // 필터 적용
        const filterValue = document.getElementById('historyFilter')?.value || 'all';
        if (filterValue === 'mine' && this.currentUser && this.currentUser.role === 'leader') {
            checklists = checklists.filter(c => c.branch === this.currentUser.branch);
        }

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
        if (!designerId) {
            document.getElementById('selectedDesignerInfo').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">ℹ️</div>
                    <p>디자이너를 선택하면 정보가 표시됩니다.</p>
                </div>
            `;
            return;
        }

        const designer = this.data.designers.find(d => d.id == designerId);
        if (!designer) return;

        // 최근 7일 기록
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentChecklists = this.data.checklists
            .filter(c => c.designerId == designerId && new Date(c.date) >= sevenDaysAgo)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7);

        // 총 활동량 계산
        const totalActivity = recentChecklists.reduce((acc, c) => {
            acc.reviews += c.naverReviews || 0;
            acc.posts += c.naverPosts || 0;
            acc.experience += c.naverExperience || 0;
            acc.reels += c.instaReels || 0;
            acc.photos += c.instaPhotos || 0;
            return acc;
        }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });

        const totalSum = totalActivity.reviews + totalActivity.posts + totalActivity.experience + 
                        totalActivity.reels + totalActivity.photos;

        // 성과 등급 계산
        let performanceGrade = 'poor';
        if (totalSum >= 100) performanceGrade = 'excellent';
        else if (totalSum >= 70) performanceGrade = 'good';
        else if (totalSum >= 40) performanceGrade = 'average';

        const infoHTML = `
            <div class="designer-info-card">
                <div class="designer-profile">
                    <div class="designer-avatar">
                        ${designer.name.charAt(0)}
                    </div>
                    <div class="designer-details">
                        <h4>${designer.name}</h4>
                        <div class="designer-meta">
                            ${designer.branch} • ${designer.position} • ${designer.phone}
                        </div>
                        <span class="performance-badge performance-${performanceGrade}">
                            ${this.getPerformanceLabel(performanceGrade)}
                        </span>
                    </div>
                </div>
                
                <div class="designer-stats">
                    <div class="stat-item">
                        <div class="stat-value">${totalActivity.reviews}</div>
                        <div class="stat-label">리뷰</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalActivity.posts}</div>
                        <div class="stat-label">포스팅</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalActivity.experience}</div>
                        <div class="stat-label">체험단</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalActivity.reels}</div>
                        <div class="stat-label">릴스</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalActivity.photos}</div>
                        <div class="stat-label">사진</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 1rem;">
                <h5 style="font-weight: 600; margin-bottom: 0.75rem; color: #374151;">📈 최근 7일 활동</h5>
                ${recentChecklists.length > 0 ? `
                    <div style="background: #f8fafc; border-radius: 8px; padding: 1rem;">
                        ${recentChecklists.map((c, index) => {
                            const daily = (c.naverReviews || 0) + (c.naverPosts || 0) + (c.naverExperience || 0) + 
                                         (c.instaReels || 0) + (c.instaPhotos || 0);
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; ${index !== recentChecklists.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                                    <span style="font-size: 0.875rem; color: #6b7280;">${c.date}</span>
                                    <span style="font-weight: 500; color: #374151;">${daily}건</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : '<p style="color: #6b7280; font-size: 0.875rem;">최근 활동 기록이 없습니다.</p>'}
            </div>
        `;

        document.getElementById('selectedDesignerInfo').innerHTML = infoHTML;
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

    // 샘플 데이터 채우기
    fillSampleData() {
        document.getElementById('naverReviews').value = Math.floor(Math.random() * 6) + 2;
        document.getElementById('naverPosts').value = Math.floor(Math.random() * 3) + 1;
        document.getElementById('naverExperience').value = Math.floor(Math.random() * 2);
        document.getElementById('instaReels').value = Math.floor(Math.random() * 4) + 1;
        document.getElementById('instaPhotos').value = Math.floor(Math.random() * 8) + 3;
        document.getElementById('checklistNotes').value = '오늘은 고객 반응이 좋았습니다!';
        
        this.updateSectionTotal('naver');
        this.updateSectionTotal('instagram');
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

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 디자이너 선택 변경
        const designerSelect = document.getElementById('checklistDesigner');
        if (designerSelect) {
            designerSelect.addEventListener('change', (e) => {
                this.loadSelectedDesignerInfo(e.target.value);
            });
        }

        // 기록 필터 변경
        const historyFilter = document.getElementById('historyFilter');
        if (historyFilter) {
            historyFilter.addEventListener('change', () => {
                this.pagination.currentPage = 1;
                this.loadRecentHistory();
            });
        }

        // 폼 제출 이벤트
        this.setupFormEventListeners();
    }

    // 폼 이벤트 리스너 설정
    setupFormEventListeners() {
        // 체크리스트 제출 폼
        const checklistForm = document.getElementById('checklistForm');
        if (checklistForm) {
            checklistForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmitChecklist();
            });
        }

        // 체크리스트 수정 폼
        const editForm = document.getElementById('editChecklistForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditChecklist();
            });
        }
    }

    // 체크리스트 제출 처리
    async handleSubmitChecklist() {
        try {
            const designerId = document.getElementById('checklistDesigner').value;
            const designer = this.data.designers.find(d => d.id == designerId);
            
            if (!designer) {
                alert('디자이너를 선택해주세요.');
                return;
            }

            const checklistData = {
                id: `checklist_${designerId}_${Date.now()}`,
                docId: `checklist_${designerId}_${Date.now()}`,
                designerId: parseInt(designerId),
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

            // 같은 날짜 중복 확인
            const existingChecklist = this.data.checklists.find(c => 
                c.designerId == designerId && c.date === checklistData.date);
            
            if (existingChecklist) {
                if (!confirm('해당 날짜에 이미 체크리스트가 있습니다. 덮어쓰시겠습니까?')) {
                    return;
                }
                // 기존 기록 제거
                this.data.checklists = this.data.checklists.filter(c => c.docId !== existingChecklist.docId);
            }

            // 실제로는 Firebase에 저장
            this.data.checklists.unshift(checklistData);
            
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
        }
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

            // 실제로는 Firebase에서 업데이트
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
                // 실제로는 Firebase에서 삭제
                this.data.checklists = this.data.checklists.filter(c => c.docId !== docId);
                
                this.loadRecentHistory();
                this.loadTodaySummary();
                this.showNotification('체크리스트가 삭제되었습니다.', 'success');
            } catch (error) {
                console.error('체크리스트 삭제 오류:', error);
                this.showNotification('체크리스트 삭제 중 오류가 발생했습니다.', 'error');
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
        
        // 사용자 권한에 따른 필터링
        if (this.currentUser && this.currentUser.role === 'leader') {
            checklists = checklists.filter(c => c.branch === this.currentUser.branch);
        }

        let csvContent = "날짜,디자이너,지점,네이버리뷰,블로그포스팅,체험단,인스타릴스,인스타사진,총합,메모,등록시간\n";
        
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

function fillSampleData() {
    window.checklistManager?.fillSampleData();
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

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.checklistManager = new ChecklistManager();
    window.checklistManager.initialize();
});

console.log('체크리스트 페이지 스크립트 로딩 완료');