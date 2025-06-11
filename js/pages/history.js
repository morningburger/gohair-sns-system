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
        this.currentPeriod = 'month';
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

    // 디자이너 옵션 로드
    loadDesignerOptions() {
        let designers = this.data.designers;
        
        // 사용자 권한에 따른 필터링
        if (this.currentUser && this.currentUser.role === 'leader') {
            designers = designers.filter(d => d.branch === this.currentUser.branch);
        }

        const select = document.getElementById('historyDesigner');
        if (select) {
            select.innerHTML = '디자이너를 선택하세요' +
                designers.map(d => `
                    ${d.name} (${d.branch} - ${d.position})
                `).join('');
        }
    }

    // 히스토리 로드
    loadHistory() {
        const designerId = document.getElementById('historyDesigner').value;
        const period = document.getElementById('historyPeriod').value;
        
        if (!designerId) {
            document.getElementById('historyContent').innerHTML = `
                

                    
ℹ️

                    
디자이너를 선택해주세요.


                

            `;
            return;
        }

        this.selectedDesigner = this.data.designers.find(d => d.id == designerId);
        this.currentPeriod = period;
        
        // 로딩 표시
        document.getElementById('historyContent').innerHTML = `
            

                
⏳

                
히스토리를 불러오는 중...


            

        `;

        // 약간의 지연 후 히스토리 표시 (실제 로딩 시뮬레이션)
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
        let checklists = this.data.checklists.filter(c => c.designerId == this.selectedDesigner.id);
        
        const now = new Date();
        let filterDate;

        switch(this.currentPeriod) {
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
            case 'all':
            default:
                return checklists.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return checklists
            .filter(c => new Date(c.date) >= filterDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
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
    setupEventListeners() {
        // 폼 요소들이 존재할 때만 이벤트 리스너 추가
        const designerSelect = document.getElementById('historyDesigner');
        const periodSelect = document.getElementById('historyPeriod');
        
        if (designerSelect) {
            designerSelect.addEventListener('change', () => {
                this.pagination.currentPage = 1; // 페이지 리셋
            });
        }
        
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                this.pagination.currentPage = 1; // 페이지 리셋
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
