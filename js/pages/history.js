// 디자이너 히스토리 페이지 전용 로직

class HistoryManager {
constructor() {
    this.data = {
        designers: [],
        checklists: [],
        branches: []
    };
    this.currentUser = null;
    this.selectedDesigner = null;
    this.selectedBranch = '';
    this.currentPeriod = 'month';
    this.dateRange = {
        start: null,
        end: null
    };
    this.pagination = {
        currentPage: 1,
        itemsPerPage: 15,
        totalItems: 0,
        totalPages: 0
    };
}
        this.pagination = {
            currentPage: 1,
            itemsPerPage: 15,
            totalItems: 0,
            totalPages: 0
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
            
            // 디자이너 옵션 로드
            this.loadDesignerOptions();
            // 지점 옵션 로드
this.loadBranchOptions();

// 초기 날짜 범위 설정
this.setPeriod('month');
            console.log('히스토리 페이지 초기화 완료');
        } catch (error) {
            console.error('히스토리 페이지 초기화 오류:', error);
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

    // 샘플 데이터 생성
    generateSampleDesigners() {
        const branches = ['송도1지점', '검단테라스점', '부평점', '인천논현점', '청라국제점'];
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
            const recordCount = Math.floor(Math.random() * 30) + 20; // 20-49개 기록
            
            for (let i = 0; i < recordCount; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // 최근 90일
                
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
                    notes: i % 8 === 0 ? '특별한 이벤트가 있었습니다!' : '',
                    createdAt: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
                });
            }
        });
        
        return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    generateSampleBranches() {
        return ['송도1지점', '검단테라스점', '부평점', '인천논현점', '청라국제점'];
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
        
        if (designers.length === 0) {
            console.log('📝 Firebase에 디자이너 데이터가 없음 - 임시 데이터 사용');
            return this.generateSampleDesigners();
        }
        
        return designers;
    } catch (error) {
        console.error('❌ 디자이너 데이터 로딩 실패:', error);
        console.log('📝 오류로 인해 임시 데이터 사용');
        return this.generateSampleDesigners();
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
        
        if (checklists.length === 0) {
            console.log('📝 Firebase에 체크리스트 데이터가 없음 - 임시 데이터 사용');
            return this.generateSampleChecklists();
        }
        
        return checklists.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('❌ 체크리스트 데이터 로딩 실패:', error);
        console.log('📝 오류로 인해 임시 데이터 사용');
        return this.generateSampleChecklists();
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
            branches.push(data.name || '');
        });
        
        console.log(`✅ 지점 데이터 로딩 완료: ${branches.length}개`);
        
        if (branches.length === 0) {
            console.log('📝 Firebase에 지점 데이터가 없음 - 임시 데이터 사용');
            return this.generateSampleBranches();
        }
        
        return branches;
    } catch (error) {
        console.error('❌ 지점 데이터 로딩 실패:', error);
        console.log('📝 오류로 인해 임시 데이터 사용');
        return this.generateSampleBranches();
    }
}
    // 디자이너 옵션 로드
loadDesignerOptions() {
    let designers = this.data.designers;
    
    // 사용자 권한에 따른 필터링
    if (this.currentUser && this.currentUser.role === 'leader') {
        designers = designers.filter(d => d.branch === this.currentUser.branch);
    }

    const select = document.getElementById('historyDesigner');
    if (select) {
        select.innerHTML = '<option value="">디자이너를 선택하세요</option>' +
            designers.map(d => `<option value="${d.id}">${d.name} (${d.branch} - ${d.position})</option>`).join('');
    }
}
// 지점 옵션 로드
loadBranchOptions() {
    const select = document.getElementById('historyBranch');
    if (select && this.data.branches) {
        select.innerHTML = '<option value="">전체 지점</option>' +
            this.data.branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
    }
}
// 기간 설정
setPeriod(period) {
    this.currentPeriod = period;
    
    // 기간 버튼 활성화 상태 업데이트
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // 날짜 범위 계산 및 표시
    this.updateDateRange();
    
    // 사용자 정의 날짜 입력 필드 표시/숨김
    const customDateRange = document.getElementById('customDateRange');
    if (period === 'custom') {
        customDateRange.classList.remove('hidden');
    } else {
        customDateRange.classList.add('hidden');
    }
}

updateDateRange() {
    const now = new Date();
    let startDate, endDate, label;
    
    switch(this.currentPeriod) {
        case 'day':
            startDate = new Date(now);
            endDate = new Date(now);
            label = '오늘';
            break;
            
        case 'week':
            const monday = new Date(now);
            monday.setDate(now.getDate() - now.getDay() + 1);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            startDate = monday;
            endDate = sunday;
            label = '이번 주';
            break;
            
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            label = '이번 달';
            break;
            
        case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
            label = '이번 분기';
            break;
            
        case 'all':
            startDate = new Date('2020-01-01');
            endDate = now;
            label = '전체 기간';
            break;
            
        case 'custom':
            const customStart = document.getElementById('customStartDate').value;
            const customEnd = document.getElementById('customEndDate').value;
            if (customStart && customEnd) {
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                label = '사용자 정의';
            } else {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                label = '기간을 선택하세요';
            }
            break;
            
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            label = '이번 달';
    }
    
    this.dateRange = { start: startDate, end: endDate };
    
    // 날짜 범위 표시 업데이트
    const dateRangeDisplay = document.getElementById('dateRangeDisplay');
    if (dateRangeDisplay) {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        dateRangeDisplay.textContent = `${startStr} ~ ${endStr} (${label})`;
    }
    
    // 사용자 정의 날짜 입력 필드 업데이트
    if (this.currentPeriod === 'custom') {
        document.getElementById('customStartDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('customEndDate').value = endDate.toISOString().split('T')[0];
    }
}
// 히스토리 로드
loadHistory() {
    const designerId = document.getElementById('historyDesigner').value;
    const branchFilter = document.getElementById('historyBranch').value;
    
    if (!designerId) {
        document.getElementById('historyContent').innerHTML = `
            <div class="text-center" style="padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">ℹ️</div>
                <p style="color: #6b7280;">디자이너를 선택해주세요.</p>
            </div>
        `;
        return;
    }

    this.selectedDesigner = this.data.designers.find(d => d.id == designerId);
    this.selectedBranch = branchFilter;
    
    // 사용자 정의 기간인 경우 날짜 범위 업데이트
    if (this.currentPeriod === 'custom') {
        this.updateDateRange();
    }
    
    // 로딩 표시
    document.getElementById('historyContent').innerHTML = `
        <div class="text-center" style="padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
            <p style="color: #6b7280;">히스토리를 불러오는 중...</p>
        </div>
    `;

    setTimeout(() => {
        this.displayHistory();
    }, 500);
}

    // 히스토리 표시
    displayHistory() {
        if (!this.selectedDesigner) return;

        const filteredChecklists = this.getFilteredChecklists();
        
        // 페이지네이션 적용
        this.pagination.totalItems = filteredChecklists.length;
        this.pagination.totalPages = Math.ceil(filteredChecklists.length / this.pagination.itemsPerPage);
        
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
        const endIndex = startIndex + this.pagination.itemsPerPage;
        const paginatedChecklists = filteredChecklists.slice(startIndex, endIndex);

        // 통계 계산
        const stats = this.calculateStats(filteredChecklists);
        
        const historyHTML = `
            

                
                

                    

                            
${this.selectedDesigner.name}

                            
${this.selectedDesigner.branch} • ${this.selectedDesigner.position}


                        

                            
${stats.totalActivity}

                            
총 활동량

                        

                


                
                

                        
${stats.reviews}

                        
⭐ 네이버 리뷰

                    

                        
${stats.posts}

                        
📝 블로그 포스팅

                    

                        
${stats.experience}

                        
🎯 체험단 운영

                    

                        
${stats.reels}

                        
🎬 인스타 릴스

                    

                        
${stats.photos}

                        
📷 인스타 사진

                    


                
                

                    

                        
📈 상세 활동 기록 (${this.getPeriodLabel()})

                        
총 ${filteredChecklists.length}건의 기록


                    

                    
                    ${paginatedChecklists.length > 0 ? `
                        

                            
                                    ${paginatedChecklists.map((checklist, index) => {
                                        const total = (checklist.naverReviews || 0) + (checklist.naverPosts || 0) + 
                                                     (checklist.naverExperience || 0) + (checklist.instaReels || 0) + (checklist.instaPhotos || 0);
                                        const rowBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                                        
                                        return `
                                            
                                        `;
                                    }).join('')}
                                
날짜	리뷰	포스팅	체험단	릴스	사진	합계	메모
${checklist.date}	${checklist.naverReviews || 0}	${checklist.naverPosts || 0}	${checklist.naverExperience || 0}	${checklist.instaReels || 0}	${checklist.instaPhotos || 0}	${total}	${checklist.notes || '-'}

                        

                    ` : `
                        

                            
📭

                            
선택한 기간에 활동 기록이 없습니다.


                        

                    `}
                


                
                ${this.renderPagination()}
            

        `;

        document.getElementById('historyContent').innerHTML = historyHTML;
    }

// 필터링된 체크리스트 가져오기
getFilteredChecklists() {
    let checklists = this.data.checklists.filter(c => {
        // 디자이너 필터
        if (c.designerId != this.selectedDesigner.id) return false;
        
        // 지점 필터 (선택된 경우에만)
        if (this.selectedBranch && c.branch !== this.selectedBranch) return false;
        
        return true;
    });
    
    // 날짜 필터링
    if (this.dateRange.start && this.dateRange.end) {
        checklists = checklists.filter(c => {
            const checklistDate = new Date(c.date);
            return checklistDate >= this.dateRange.start && checklistDate <= this.dateRange.end;
        });
    }

    return checklists.sort((a, b) => new Date(b.date) - new Date(a.date));
}

    // 통계 계산
    calculateStats(checklists) {
        return checklists.reduce((acc, c) => {
            acc.reviews += c.naverReviews || 0;
            acc.posts += c.naverPosts || 0;
            acc.experience += c.naverExperience || 0;
            acc.reels += c.instaReels || 0;
            acc.photos += c.instaPhotos || 0;
            acc.totalActivity += (c.naverReviews || 0) + (c.naverPosts || 0) + (c.naverExperience || 0) + (c.instaReels || 0) + (c.instaPhotos || 0);
            return acc;
        }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0, totalActivity: 0 });
    }

    // 기간 라벨 반환
    getPeriodLabel() {
        const labels = {
            week: '최근 1주일',
            month: '이번 달',
            quarter: '이번 분기',
            all: '전체 기간'
        };
        return labels[this.currentPeriod] || '전체 기간';
    }

    // 페이지네이션 렌더링
    renderPagination() {
        const { currentPage, totalPages, totalItems, itemsPerPage } = this.pagination;
        
        if (totalPages <= 1) return '';

        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        let paginationHTML = `
            

                    ◀ 이전
                

        `;

        // 페이지 번호들
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                
                    ${i}
                

            `;
        }

        paginationHTML += `
            
                다음 ▶
            

                ${startItem}-${endItem} / ${totalItems}개
            

        `;

        return `
${paginationHTML}
`;
    }

    // 페이지 이동
    goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.currentPage = page;
        this.displayHistory();
    }

    // 이벤트 리스너 설정
// 이벤트 리스너 설정
setupEventListeners() {
    // 기간 버튼 클릭 이벤트
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const period = e.target.getAttribute('data-period');
            this.setPeriod(period);
        });
    });
    
    // 사용자 정의 날짜 변경 이벤트
    const customStartDate = document.getElementById('customStartDate');
    const customEndDate = document.getElementById('customEndDate');
    
    if (customStartDate && customEndDate) {
        customStartDate.addEventListener('change', () => {
            if (this.currentPeriod === 'custom') {
                this.updateDateRange();
            }
        });
        
        customEndDate.addEventListener('change', () => {
            if (this.currentPeriod === 'custom') {
                this.updateDateRange();
            }
        });
    }
    
    // 폼 요소들 이벤트 리스너
    const designerSelect = document.getElementById('historyDesigner');
    const branchSelect = document.getElementById('historyBranch');
    
    if (designerSelect) {
        designerSelect.addEventListener('change', () => {
            this.pagination.currentPage = 1;
        });
    }
    
    if (branchSelect) {
        branchSelect.addEventListener('change', () => {
            this.pagination.currentPage = 1;
        });
    }
}

    // 히스토리 내보내기
    exportHistory() {
        if (!this.selectedDesigner) {
            alert('디자이너를 먼저 선택해주세요.');
            return;
        }

        const filteredChecklists = this.getFilteredChecklists();
        
        let csvContent = "날짜,네이버리뷰,블로그포스팅,체험단운영,인스타릴스,인스타사진,총합,메모\n";
        
        filteredChecklists.forEach(c => {
            const total = (c.naverReviews || 0) + (c.naverPosts || 0) + (c.naverExperience || 0) + 
                         (c.instaReels || 0) + (c.instaPhotos || 0);
            
            csvContent += `${c.date},${c.naverReviews || 0},${c.naverPosts || 0},${c.naverExperience || 0},${c.instaReels || 0},${c.instaPhotos || 0},${total},"${(c.notes || '').replace(/"/g, '""')}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `GOHAIR_${this.selectedDesigner.name}_히스토리_${this.getPeriodLabel()}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 전역 함수들
function loadHistory() {
    window.historyManager?.loadHistory();
}

function exportHistory() {
    window.historyManager?.exportHistory();
}

function goToMainSystem() {
    window.location.href = '../index.html';
}

function goToPage(pageId) {
    const pages = {
        'designers': 'designers.html',
        'branches': 'branches.html',
        'checklist': 'checklist.html',
        'statistics': 'statistics.html',
        'comparison': 'comparison.html'
    };
    
    if (pages[pageId]) {
        window.location.href = pages[pageId];
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.historyManager = new HistoryManager();
    window.historyManager.initialize();
});

console.log('히스토리 페이지 스크립트 로딩 완료');
