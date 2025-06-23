// 통계 분석 페이지 전용 로직

class StatisticsManager {
constructor() {
    this.data = {
        checklists: [],
        designers: [],
        branches: []
    };
    this.charts = {
        branchChart: null,
        categoryChart: null
    };
    
    // 🔥 기존 차트 정리 (재초기화 방지)
    this.destroyExistingCharts();
    
    this.currentPeriod = {
        startDate: null,
        endDate: null
    };
    this.currentUser = null;
}

// 🔥 기존 차트 정리 메서드 추가
destroyExistingCharts() {
    try {
        const branchCtx = document.getElementById('branchChart');
        const categoryCtx = document.getElementById('categoryChart');
        
        if (branchCtx) Chart.getChart(branchCtx)?.destroy();
        if (categoryCtx) Chart.getChart(categoryCtx)?.destroy();
        
    } catch (error) {
        console.warn('기존 차트 정리 중 오류:', error);
    }
}

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
        
        // 데이터 로드 (기간 설정은 여기서 함께 처리)
        await this.loadAllData();
        
        // 기본 기간 설정 (데이터 로드 후)
        this.setThisMonth();
        
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

    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

updateUserDisplay() {
    const userElement = document.getElementById('currentUser');
    if (userElement && this.currentUser) {
        if (this.currentUser.role === '지점관리자') {
            userElement.textContent = `${this.currentUser.name} (지점관리자 - ${this.currentUser.branch})`;
            userElement.style.color = '#3b82f6';
        } else if (this.currentUser.role === '전체관리자') {
            userElement.textContent = `${this.currentUser.name} (전체관리자)`;
            userElement.style.color = '#059669';
        } else {
            userElement.textContent = this.currentUser.name || 'Firebase 연결됨';
            userElement.style.color = '#10b981';
        }
        userElement.style.fontWeight = '500';
    } else if (userElement) {
        userElement.textContent = 'Firebase 연결됨';
        userElement.style.color = '#10b981';
        userElement.style.fontWeight = '500';
    }
}

    // 데이터 로드
    async loadAllData() {
        try {
            if (!firebase.firestore) {
                throw new Error('Firestore가 초기화되지 않았습니다');
            }
            
            const db = firebase.firestore();
            
            // 체크리스트 데이터 로드
            const checklistsSnapshot = await db.collection('checklists').get();
this.data.checklists = [];
checklistsSnapshot.forEach(doc => {
    const data = doc.data();
    this.data.checklists.push({
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
            
            
        } catch (error) {
            console.error('❌ Firebase 데이터 로딩 오류:', error);
            // 에러 발생 시 빈 데이터로 초기화
            this.data.checklists = [];
            this.data.designers = [];
            this.data.branches = [];
            
            // 빈 데이터로도 화면 초기화
            this.loadBranchFilterOptions();
            this.processData();
        }
    }

    // 기간 설정 함수들
setToday() {
    const today = new Date();
    this.setDateRange(today, today);
    this.updatePeriodButtons('setToday()');
}

setThisWeek() {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.setDateRange(monday, sunday);
    this.updatePeriodButtons('setThisWeek()');
}

setThisMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.setDateRange(firstDay, lastDay);
    this.updatePeriodButtons('setThisMonth()');
}

setThisQuarter() {
    const today = new Date();
    const quarter = Math.floor(today.getMonth() / 3);
    const firstMonth = quarter * 3;
    const firstDay = new Date(today.getFullYear(), firstMonth, 1);
    const lastDay = new Date(today.getFullYear(), firstMonth + 3, 0);
    this.setDateRange(firstDay, lastDay);
    this.updatePeriodButtons('setThisQuarter()');
}

    setDateRange(startDate, endDate) {
        this.currentPeriod.startDate = startDate;
        this.currentPeriod.endDate = endDate;
        
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        
        if (startInput) startInput.value = startDate.toISOString().split('T')[0];
        if (endInput) endInput.value = endDate.toISOString().split('T')[0];
        
        this.processData();
    }

updatePeriodButtons(active) {
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[onclick="${active}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// 지점 필터 옵션 로드
loadBranchFilterOptions() {
    const select = document.getElementById('branchFilter');
    if (select) {
        console.log('🏢 지점 필터 옵션 로딩 중... 데이터:', this.data.branches);
        
        // Firebase에서 로드한 지점 데이터와 체크리스트에서 지점명 추출
        let branches = [];
        
        // 1. 지점 컬렉션에서 지점명 추출
        if (this.data.branches && this.data.branches.length > 0) {
            const branchNames = this.data.branches.map(branch => branch.name).filter(name => name);
            branches = [...branches, ...branchNames];
        }
        
        // 2. 체크리스트 데이터에서도 지점명 추출 (실제 사용 중인 지점들)
        if (this.data.checklists && this.data.checklists.length > 0) {
            const checklistBranches = this.data.checklists.map(item => item.branch).filter(branch => branch);
            branches = [...branches, ...checklistBranches];
        }
        
        // 중복 제거 및 정렬
        branches = [...new Set(branches)].sort();
        
        console.log('🏢 추출된 지점 목록:', branches);
        
        // 사용자 권한에 따른 필터링
        if (this.currentUser && this.currentUser.role === '지점관리자') {
            branches = branches.filter(b => b === this.currentUser.branch);
        }
        
        if (branches.length === 0) {
            if (this.currentUser && this.currentUser.role === '지점관리자') {
                select.innerHTML = `<option value="${this.currentUser.branch}">${this.currentUser.branch}</option>`;
            } else {
                select.innerHTML = '<option value="">지점 데이터 없음</option>';
            }
            console.warn('⚠️ 지점 데이터가 없습니다');
        } else {
            if (this.currentUser && this.currentUser.role === '지점관리자') {
                // 지점관리자는 "전체 지점" 옵션 없이 본인 지점만
                select.innerHTML = branches.map(b => `<option value="${b}">${b}</option>`).join('');
            } else {
                // 전체관리자는 "전체 지점" 옵션 포함
                select.innerHTML = '<option value="">전체 지점</option>' +
                    branches.map(b => `<option value="${b}">${b}</option>`).join('');
            }
            console.log(`✅ 지점 옵션 ${branches.length}개 로딩 완료:`, branches);
        }
    }
}

    // 데이터 처리 및 표시
    processData() {
        const filteredData = this.getFilteredData();
        
        this.updateSummaryCards(filteredData);
        this.updateBranchRankings(filteredData);
        this.updateDesignerRankings(filteredData);
        this.updateBranchChart(filteredData);
        this.updateCategoryChart(filteredData);
        this.updateLastUpdated();
    }

    // 필터링된 데이터 가져오기
getFilteredData() {
    let filtered = this.data.checklists;
    
// 🔥 1단계: 기본 데이터 검증만 수행 (과도한 필터링 제거)
filtered = filtered.filter(item => {
    // 기본적인 데이터 유효성만 검사
    return item.designer && item.branch && item.date;
});

console.log(`🔍 기본 검증 후: ${filtered.length}개 체크리스트`);
    
    // 사용자 권한에 따른 필터링
    if (this.currentUser && this.currentUser.role === '지점관리자') {
        filtered = filtered.filter(item => item.branch === this.currentUser.branch);
    }        
    
    // 날짜 필터
    if (this.currentPeriod.startDate && this.currentPeriod.endDate) {
        filtered = filtered.filter(item => {
            if (!item.date) return false;
            const itemDate = new Date(item.date);
            const startDate = new Date(this.currentPeriod.startDate);
            const endDate = new Date(this.currentPeriod.endDate);
            
            // 시간 부분 제거하고 날짜만 비교
            itemDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            
            return itemDate >= startDate && itemDate <= endDate;
        });
    }
    
    // 지점 필터
    const branchFilter = document.getElementById('branchFilter');
    if (branchFilter && branchFilter.value) {
        filtered = filtered.filter(item => item.branch === branchFilter.value);
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
        
        const totalReviewsEl = document.getElementById('totalReviews');
        const totalPostsEl = document.getElementById('totalPosts');
        const totalExperienceEl = document.getElementById('totalExperience');
        const totalReelsEl = document.getElementById('totalReels');
        const totalPhotosEl = document.getElementById('totalPhotos');
        
        if (totalReviewsEl) totalReviewsEl.textContent = totals.naverReviews;
        if (totalPostsEl) totalPostsEl.textContent = totals.naverPosts;
        if (totalExperienceEl) totalExperienceEl.textContent = totals.naverExperience;
        if (totalReelsEl) totalReelsEl.textContent = totals.instaReels;
        if (totalPhotosEl) totalPhotosEl.textContent = totals.instaPhotos;
    }

// 지점별 순위 업데이트
updateBranchRankings(data) {
    const branchStats = {};
    const currentBranchNames = this.data.branches.map(b => b.name);
    
    data.forEach(item => {
        const branchName = item.branch;
        // 🔥 현재 존재하는 지점만 포함
        if (!branchName || !currentBranchNames.includes(branchName)) return;
        
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
        if (tbody) {
            if (rankings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6b7280;">데이터가 없습니다</td></tr>';
            } else {
                tbody.innerHTML = rankings.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.branch}</td>
                        <td>${item.total}</td>
                        <td>${item.average}</td>
                    </tr>
                `).join('');
            }
        }
    }

// 디자이너별 순위 업데이트
updateDesignerRankings(data) {
    const designerStats = {};
    const currentDesignerNames = this.data.designers.map(d => d.name);
    
    data.forEach(item => {
        const designerName = item.designer;
        // 🔥 현재 존재하는 디자이너만 포함
        if (!designerName || !currentDesignerNames.includes(designerName)) return;
        
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
        if (tbody) {
            if (rankings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6b7280;">데이터가 없습니다</td></tr>';
            } else {
                tbody.innerHTML = rankings.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.designer}</td>
                        <td>${item.branch}</td>
                        <td>${item.total}</td>
                    </tr>
                `).join('');
            }
        }
    }

// 지점별 차트 업데이트
updateBranchChart(data) {
    const branchStats = {};
    const currentBranchNames = this.data.branches.map(b => b.name);
    
    data.forEach(item => {
        const branchName = item.branch;
        // 🔥 현재 존재하는 지점만 포함
        if (!branchName || !currentBranchNames.includes(branchName)) return;
        
        if (!branchStats[branchName]) {
            branchStats[branchName] = 0;
        }
        branchStats[branchName] += (item.naverReviews || 0) + (item.naverPosts || 0) + 
                                  (item.naverExperience || 0) + (item.instaReels || 0) + (item.instaPhotos || 0);
    });
    
    const ctx = document.getElementById('branchChart');
    if (!ctx) return;
    
// 강화된 차트 파괴
const ctx = document.getElementById('branchChart');
if (!ctx) return;

// Chart.js 전역 차트 인스턴스 확인 및 파괴
try {
    // 1. 기존 차트 인스턴스 파괴
    if (this.charts.branchChart) {
        this.charts.branchChart.destroy();
        this.charts.branchChart = null;
    }
    
    // 2. Chart.js 전역 레지스트리에서 해당 캔버스 차트 찾아서 파괴
    Chart.getChart(ctx)?.destroy();
    
    // 3. 캔버스 컨텍스트 초기화
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    
} catch (error) {
    console.warn('차트 파괴 중 오류:', error);
    this.charts.branchChart = null;
}
        
        const labels = Object.keys(branchStats);
        const values = Object.values(branchStats);
        
        if (labels.length === 0) {
            // 데이터가 없을 때는 빈 차트
            labels.push('데이터 없음');
            values.push(0);
        }
        
        this.charts.branchChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '총 활동량',
                    data: values,
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
        
const ctx = document.getElementById('categoryChart');
if (!ctx) return;

const ctx = document.getElementById('categoryChart');
if (!ctx) return;

// 강화된 차트 파괴
try {
    // 1. 기존 차트 인스턴스 파괴
    if (this.charts.categoryChart) {
        this.charts.categoryChart.destroy();
        this.charts.categoryChart = null;
    }
    
    // 2. Chart.js 전역 레지스트리에서 해당 캔버스 차트 찾아서 파괴
    Chart.getChart(ctx)?.destroy();
    
    // 3. 캔버스 컨텍스트 초기화
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    
} catch (error) {
    console.warn('카테고리 차트 파괴 중 오류:', error);
    this.charts.categoryChart = null;
}
        
        const total = categoryTotals.naverReviews + categoryTotals.naverPosts + 
                     categoryTotals.naverExperience + categoryTotals.instaReels + categoryTotals.instaPhotos;
        
        if (total === 0) {
            // 데이터가 없을 때는 기본 차트
            this.charts.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['데이터 없음'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['rgba(200, 200, 200, 0.5)'],
                        borderColor: ['rgba(200, 200, 200, 1)'],
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
        } else {
            this.charts.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['⭐ 네이버 리뷰', '📝 블로그 포스팅', '🎯 체험단', '🎬 인스타 릴스', '📷 인스타 사진'],
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
        // 지점 필터 변경 이벤트
const branchFilter = document.getElementById('branchFilter');
if (branchFilter) {
    branchFilter.addEventListener('change', () => this.processData());
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
    if (window.statisticsManager) {
        window.statisticsManager.setToday();
    }
}

function setThisWeek() {
    if (window.statisticsManager) {
        window.statisticsManager.setThisWeek();
    }
}

function setThisMonth() {
    if (window.statisticsManager) {
        window.statisticsManager.setThisMonth();
    }
}

function setThisQuarter() {
    if (window.statisticsManager) {
        window.statisticsManager.setThisQuarter();
    }
}

function applyFilters() {
    if (window.statisticsManager) {
        window.statisticsManager.processData();
    }
}

function refreshData() {
    if (window.statisticsManager) {
        window.statisticsManager.loadAllData().then(() => {
            window.statisticsManager.processData();
        });
    }
}

function exportToExcel() {
    if (window.statisticsManager) {
        window.statisticsManager.exportToExcel();
    }
}

function importData() {
    alert('데이터 가져오기 기능은 개발 중입니다.');
}

function goToMainSystem() {
    window.location.href = '../index.html';
}

function goToPage(pageId) {
    const pages = {
        'designers': 'designers.html',
        'branches': 'branches.html',
        'history': 'history.html',
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
    window.statisticsManager = new StatisticsManager();
    window.statisticsManager.initialize();
});

console.log('통계 페이지 스크립트 로딩 완료');
