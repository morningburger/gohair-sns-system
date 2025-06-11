// 통계 분석 페이지 전용 로직

class StatisticsManager {
    constructor() {
        this.data = {
            checklists: [],
            designers: [],
            branches: []
        };
        this.currentPeriod = {
            startDate: null,
            endDate: null
        };
        this.charts = {
            branchChart: null,
            categoryChart: null
        };
        this.currentUser = null;
    }

    // 페이지 초기화
// 페이지 초기화
async initialize() {
    try {
        this.showLoading();
        
        // Firebase 연결 확인
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error('Firebase가 초기화되지 않았습니다');
        }
        
        // 사용자 정보 확인
        this.currentUser = this.getCurrentUser();
        this.updateUserDisplay();
        
        // 기본 기간 설정 (이번 달)
        this.setThisMonth();
        
        // 데이터 로드
        await this.loadAllData();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        console.log('✅ 통계 페이지 초기화 완료');
        
    } catch (error) {
        console.error('❌ 통계 페이지 초기화 오류:', error);
        
        // 에러 발생 시 사용자에게 알림
        const errorElement = document.createElement('div');
        errorElement.innerHTML = `
            <div style="padding: 1rem; background: #fee2e2; color: #dc2626; border-radius: 0.5rem; margin: 1rem;">
                ⚠️ 데이터 로드 중 오류가 발생했습니다: ${error.message}
            </div>
        `;
        document.querySelector('.container').prepend(errorElement);
        
    } finally {
        this.hideLoading();
    }
}

    // 현재 사용자 정보 가져오기 (간단한 세션 스토리지 사용)
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
// 데이터 로드
async loadAllData() {
    try {
        if (!firebase.firestore) {
            throw new Error('Firestore가 초기화되지 않았습니다');
        }
        
        const db = firebase.firestore();
        
        // 체크리스트 데이터 로드
        const checklistsSnapshot = await db.collection('checklists').get();
        this.data.checklists = checklistsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 디자이너 데이터 로드  
        const designersSnapshot = await db.collection('designers').get();
        this.data.designers = designersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 지점 데이터 로드
        const branchesSnapshot = await db.collection('branches').get();
        this.data.branches = branchesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('📊 Firebase 데이터 로드 완료:', {
            checklists: this.data.checklists.length,
            designers: this.data.designers.length,
            branches: this.data.branches.length
        });
        
        // 지점 필터 옵션 로드
        this.loadBranchFilterOptions();
        
        // 데이터 처리 및 표시
        this.processData();
        
    } catch (error) {
        console.error('❌ Firebase 데이터 로딩 오류:', error);
        // 에러 발생 시 빈 데이터로 초기화
        this.data.checklists = [];
        this.data.designers = [];
        this.data.branches = [];
        throw error;
    }
}

    // 샘플 데이터 생성 (실제로는 Firebase에서 로드)

    // 기간 설정 함수들
    setToday() {
        const today = new Date();
        this.setDateRange(today, today);
        this.updatePeriodButtons('today');
    }

    setThisWeek() {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        this.setDateRange(monday, sunday);
        this.updatePeriodButtons('week');
    }

    setThisMonth() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        this.setDateRange(firstDay, lastDay);
        this.updatePeriodButtons('month');
    }

    setThisQuarter() {
        const today = new Date();
        const quarter = Math.floor(today.getMonth() / 3);
        const firstMonth = quarter * 3;
        const firstDay = new Date(today.getFullYear(), firstMonth, 1);
        const lastDay = new Date(today.getFullYear(), firstMonth + 3, 0);
        this.setDateRange(firstDay, lastDay);
        this.updatePeriodButtons('quarter');
    }

    setDateRange(startDate, endDate) {
        this.currentPeriod.startDate = startDate;
        this.currentPeriod.endDate = endDate;
        
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        
        this.processData();
    }

    updatePeriodButtons(active) {
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        // 활성 버튼 표시는 클릭 이벤트에서 처리
    }

// 지점 필터 옵션 로드
loadBranchFilterOptions() {
    const select = document.getElementById('branchFilter');
    if (select) {
        // Firebase에서 로드한 지점 데이터는 객체 배열 (name 필드 사용)
        let branches = this.data.branches.map(branch => branch.name);
        
        if (this.currentUser && this.currentUser.role === 'leader') {
            branches = branches.filter(b => b === this.currentUser.branch);
        }
        
        select.innerHTML = '<option value="">전체 지점</option>' +
            branches.map(b => `<option value="${b}">${b}</option>`).join('');
    }
}
    // 데이터 처리 및 표시
    processData() {
        const filteredData = this.getFilteredData();
        
        this.updateSummaryCards(filteredData);
        this.updateBranchRankings(filteredData);
        this.updateDesignerRankings(filteredData);
        this.updateCharts(filteredData);
        this.updateLastUpdated();
    }

    // 필터링된 데이터 가져오기
    getFilteredData() {
        let filtered = this.data.checklists;
        
        // 날짜 필터
        if (this.currentPeriod.startDate && this.currentPeriod.endDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= this.currentPeriod.startDate && itemDate <= this.currentPeriod.endDate;
            });
        }
        
        // 지점 필터
        const branchFilter = document.getElementById('branchFilter').value;
        if (branchFilter) {
            filtered = filtered.filter(item => item.branch === branchFilter);
        }
        
        // 사용자 권한에 따른 필터링
        if (this.currentUser && this.currentUser.role === 'leader') {
            filtered = filtered.filter(item => item.branch === this.currentUser.branch);
        }
        
        return filtered;
    }

    // 요약 카드 업데이트
    updateSummaryCards(data) {
        const totals = data.reduce((acc, item) => {
            acc.naverReviews += item.naverReviews || 0;
            acc.naverPosts += item.naverPosts || 0;
            acc.naverExperience += item.naverExperience || 0;
            acc.instaReels += item.instaReels || 0;
            acc.instaPhotos += item.instaPhotos || 0;
            return acc;
        }, {
            naverReviews: 0,
            naverPosts: 0,
            naverExperience: 0,
            instaReels: 0,
            instaPhotos: 0
        });
        
        document.getElementById('totalReviews').textContent = totals.naverReviews;
        document.getElementById('totalPosts').textContent = totals.naverPosts;
        document.getElementById('totalExperience').textContent = totals.naverExperience;
        document.getElementById('totalReels').textContent = totals.instaReels;
        document.getElementById('totalPhotos').textContent = totals.instaPhotos;
    }

    // 지점별 순위 업데이트
// 지점별 순위 업데이트
updateBranchRankings(data) {
    const branchStats = {};
    
    data.forEach(item => {
        // Firebase에서 가져온 데이터의 branch 필드 사용
        const branchName = item.branch;
        if (!branchName) return;
        
        if (!branchStats[branchName]) {
            branchStats[branchName] = { total: 0, count: 0 };
        }
        
        const itemTotal = (item.naverReviews || 0) + (item.naverPosts || 0) + 
                        (item.naverExperience || 0) + (item.instaReels || 0) + (item.instaPhotos || 0);
        
        branchStats[branchName].total += itemTotal;
        branchStats[branchName].count += 1;
    });
    
    const rankings = Object.entries(branchStats)
        .map(([branch, stats]) => ({
            branch,
            total: stats.total,
            average: Math.round(stats.total / stats.count * 10) / 10 || 0
        }))
        .sort((a, b) => b.total - a.total);
    
    const tbody = document.getElementById('branchRankingTable');
    tbody.innerHTML = rankings.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.branch}</td>
            <td>${item.total}</td>
            <td>${item.average}</td>
        </tr>
    `).join('');
}
        const rankings = Object.entries(branchStats)
            .map(([branch, stats]) => ({
                branch,
                total: stats.total,
                average: Math.round(stats.total / stats.count * 10) / 10 || 0
            }))
            .sort((a, b) => b.total - a.total);
        
        const tbody = document.getElementById('branchRankingTable');
        tbody.innerHTML = rankings.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.branch}</td>
                <td>${item.total}</td>
                <td>${item.average}</td>
            </tr>
        `).join('');
    }

    // 디자이너별 순위 업데이트
// 디자이너별 순위 업데이트
updateDesignerRankings(data) {
    const designerStats = {};
    
    data.forEach(item => {
        // Firebase에서 가져온 데이터의 designer 필드 사용
        const designerName = item.designer;
        if (!designerName) return;
        
        if (!designerStats[designerName]) {
            designerStats[designerName] = {
                branch: item.branch,
                total: 0
            };
        }
        
        const itemTotal = (item.naverReviews || 0) + (item.naverPosts || 0) + 
                        (item.naverExperience || 0) + (item.instaReels || 0) + (item.instaPhotos || 0);
        
        designerStats[designerName].total += itemTotal;
    });
    
    const rankings = Object.entries(designerStats)
        .map(([designer, stats]) => ({
            designer,
            branch: stats.branch,
            total: stats.total
        }))
        .sort((a, b) => b.total - a.total);
    
    const tbody = document.getElementById('designerRankingTable');
    tbody.innerHTML = rankings.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.designer}</td>
            <td>${item.branch}</td>
            <td>${item.total}</td>
        </tr>
    `).join('');
}
        
        const rankings = Object.entries(designerStats)
            .map(([designer, stats]) => ({
                designer,
                branch: stats.branch,
                total: stats.total
            }))
            .sort((a, b) => b.total - a.total);
        
        const tbody = document.getElementById('designerRankingTable');
        tbody.innerHTML = rankings.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.designer}</td>
                <td>${item.branch}</td>
                <td>${item.total}</td>
            </tr>
        `).join('');
    }

    // 차트 업데이트
    updateCharts(data) {
        this.updateBranchChart(data);
        this.updateCategoryChart(data);
    }

    // 지점별 차트 업데이트
// 지점별 차트 업데이트
updateBranchChart(data) {
    const branchStats = {};
    
    data.forEach(item => {
        const branchName = item.branch;
        if (!branchName) return;
        
        if (!branchStats[branchName]) {
            branchStats[branchName] = 0;
        }
        branchStats[branchName] += (item.naverReviews || 0) + (item.naverPosts || 0) + 
                                  (item.naverExperience || 0) + (item.instaReels || 0) + (item.instaPhotos || 0);
    });
    
    const ctx = document.getElementById('branchChart').getContext('2d');
    
    if (this.charts.branchChart) {
        this.charts.branchChart.destroy();
    }
    
    this.charts.branchChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(branchStats),
            datasets: [{
                label: '총 활동량',
                data: Object.values(branchStats),
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
        
        this.charts.branchChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(branchStats),
                datasets: [{
                    label: '총 활동량',
                    data: Object.values(branchStats),
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // 카테고리별 차트 업데이트
    updateCategoryChart(data) {
        const categoryTotals = data.reduce((acc, item) => {
            acc.naverReviews += item.naverReviews || 0;
            acc.naverPosts += item.naverPosts || 0;
            acc.naverExperience += item.naverExperience || 0;
            acc.instaReels += item.instaReels || 0;
            acc.instaPhotos += item.instaPhotos || 0;
            return acc;
        }, {
            naverReviews: 0,
            naverPosts: 0,
            naverExperience: 0,
            instaReels: 0,
            instaPhotos: 0
        });
        
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        if (this.charts.categoryChart) {
            this.charts.categoryChart.destroy();
        }
        
        this.charts.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['네이버 리뷰', '블로그 포스팅', '체험단', '인스타 릴스', '인스타 사진'],
                datasets: [{
                    data: [
                        categoryTotals.naverReviews,
                        categoryTotals.naverPosts,
                        categoryTotals.naverExperience,
                        categoryTotals.instaReels,
                        categoryTotals.instaPhotos
                    ],
                    backgroundColor: [
                        'rgba(255, 206, 84, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 206, 84, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 기간 버튼 클릭 이벤트
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 날짜 변경 이벤트
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate && endDate) {
            startDate.addEventListener('change', () => this.handleDateChange());
            endDate.addEventListener('change', () => this.handleDateChange());
        }
    }

    // 날짜 변경 처리
    handleDateChange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate) {
            this.currentPeriod.startDate = new Date(startDate);
            this.currentPeriod.endDate = new Date(endDate);
            this.processData();
        }
    }

    // 마지막 업데이트 시간 표시
    updateLastUpdated() {
        const now = new Date();
        const element = document.getElementById('lastUpdated');
        if (element) {
            element.textContent = `마지막 업데이트: ${now.toLocaleString('ko-KR')}`;
        }
    }

    // 로딩 표시/숨김
    showLoading() {
        const loading = document.getElementById('loadingScreen');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loadingScreen');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    // Excel 내보내기
    exportToExcel() {
        const filteredData = this.getFilteredData();
        const branchStats = {};
        
        filteredData.forEach(item => {
            if (!branchStats[item.branch]) {
                branchStats[item.branch] = { total: 0, count: 0 };
            }
            
            const itemTotal = (item.naverReviews || 0) + (item.naverPosts || 0) + 
                            (item.naverExperience || 0) + (item.instaReels || 0) + (item.instaPhotos || 0);
            
            branchStats[item.branch].total += itemTotal;
            branchStats[item.branch].count += 1;
        });
        
        let csvContent = "순위,지점,총합,평균\n";
        
        const rankings = Object.entries(branchStats)
            .map(([branch, stats]) => ({
                branch,
                total: stats.total,
                average: Math.round(stats.total / stats.count * 10) / 10 || 0
            }))
            .sort((a, b) => b.total - a.total);
        
        rankings.forEach((item, index) => {
            csvContent += `${index + 1},${item.branch},${item.total},${item.average}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `GOHAIR_통계_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 전역 함수들
function setToday() {
    window.statisticsManager.setToday();
}

function setThisWeek() {
    window.statisticsManager.setThisWeek();
}

function setThisMonth() {
    window.statisticsManager.setThisMonth();
}

function setThisQuarter() {
    window.statisticsManager.setThisQuarter();
}

function applyFilters() {
    window.statisticsManager.processData();
}

function refreshData() {
    window.statisticsManager.loadAllData();
}

function exportToExcel() {
    window.statisticsManager.exportToExcel();
}

function importData() {
    alert('데이터 가져오기 기능은 개발 중입니다.');
}

function goToMainSystem() {
    window.location.href = '../index.html';
}

function goToPage(pageId) {
    window.location.href = `../index.html#${pageId}`;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.statisticsManager = new StatisticsManager();
    window.statisticsManager.initialize();
});

console.log('통계 페이지 스크립트 로딩 완료');
