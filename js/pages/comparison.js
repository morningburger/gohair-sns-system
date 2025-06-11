// 지점 비교 분석 페이지 전용 로직

class ComparisonManager {
    constructor() {
        this.data = {
            branches: [],
            designers: [],
            checklists: []
        };
        this.currentUser = null;
        this.selectedBranches = [];
        this.currentPeriod = 'month';
        this.currentCategory = 'all';
        this.charts = {
            comparisonChart: null,
            categoryChart: null
        };
    }

    // 페이지 초기화
// 페이지 초기화
async initialize() {
    try {
        // Firebase 연결 확인
        if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
            throw new Error('Firebase가 초기화되지 않았습니다');
        }
        
        // 사용자 정보 확인
        this.currentUser = this.getCurrentUser();
        this.updateUserDisplay();
        
        // 데이터 로드
        await this.loadAllData();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 지점 체크박스 생성
        this.setupBranchCheckboxes();
        
        console.log('✅ 비교 페이지 초기화 완료');
    } catch (error) {
        console.error('❌ 비교 페이지 초기화 오류:', error);
        
        const errorElement = document.createElement('div');
        errorElement.innerHTML = `
            <div style="padding: 1rem; background: #fee2e2; color: #dc2626; border-radius: 0.5rem; margin: 1rem;">
                ⚠️ 데이터 로드 중 오류가 발생했습니다: ${error.message}
            </div>
        `;
        document.querySelector('.container').prepend(errorElement);
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
// 데이터 로드
async loadAllData() {
    try {
        if (!firebase.firestore) {
            throw new Error('Firestore가 초기화되지 않았습니다');
        }
        
        const db = firebase.firestore();
        
        // 지점 데이터 로드
        const branchesSnapshot = await db.collection('branches').get();
        this.data.branches = branchesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 디자이너 데이터 로드
        const designersSnapshot = await db.collection('designers').get();
        this.data.designers = designersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 체크리스트 데이터 로드
        const checklistsSnapshot = await db.collection('checklists').get();
        this.data.checklists = checklistsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('⚖️ Firebase 데이터 로드 완료:', {
            branches: this.data.branches.length,
            designers: this.data.designers.length,
            checklists: this.data.checklists.length
        });
        
    } catch (error) {
        console.error('❌ Firebase 데이터 로딩 오류:', error);
        this.data.branches = [];
        this.data.designers = [];
        this.data.checklists = [];
        throw error;
    }
}



    // 지점 체크박스 설정
// 지점 체크박스 설정
setupBranchCheckboxes() {
    const container = document.getElementById('branchCheckboxes');
    if (!container) return;

    container.innerHTML = this.data.branches.map(branch => `
        <label style="display: flex; align-items: center;">
            <input type="checkbox" value="${branch.name}" style="margin-right: 0.5rem;">
            ${branch.name}
        </label>
    `).join('');
}

    // 비교 업데이트
    updateComparison() {
        this.selectedBranches = Array.from(document.querySelectorAll('#branchCheckboxes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        if (this.selectedBranches.length === 0) {
            document.getElementById('comparisonResult').innerHTML = `
                

                    
⚖️

                    
비교할 지점을 선택해주세요.


                

            `;
            return;
        }

        this.currentPeriod = document.getElementById('comparisonPeriod').value;
        this.currentCategory = document.getElementById('comparisonCategory').value;
        
        // 로딩 표시
        document.getElementById('comparisonResult').innerHTML = `
            

                
⏳

                
비교 분석 중...


            

        `;

        // 약간의 지연 후 결과 표시
        setTimeout(() => {
            this.displayComparison();
        }, 800);
    }

    // 비교 결과 표시
    displayComparison() {
        const comparisonData = this.calculateComparisonData();
        
        const resultHTML = `
            

                
                

                    
📊 비교 분석 결과

                    
📍 선택 지점: ${this.selectedBranches.join(', ')}
📅 분석 기간: ${this.getPeriodLabel()}
🏷️ 분석 카테고리: ${this.getCategoryLabel()}

                


                
                

                    ${comparisonData.branches.map((branch, index) => {
                        const isTop = index === 0;
                        const cardStyle = isTop ? 
                            'background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; transform: scale(1.02);' : 
                            'background: white; border: 1px solid #e5e7eb;';
                        
                        return `
                            

                                

                                        
${branch.name}

                                        ${isTop ? '
🏆 1위
' : ''}
                                    

                                        
${branch.total}

                                        
총 활동량

                                    

                                
                                
⭐ 리뷰: ${branch.reviews}
📝 포스팅: ${branch.posts}
🎯 체험단: ${branch.experience}
🎬 릴스: ${branch.reels}
📷 사진: ${branch.photos}

                                
                                

                                    

                                        평균 일일 활동량: ${branch.dailyAverage}
                                    

                                

                            

                        `;
                    }).join('')}
                


                
                

                    
📈 지점별 상세 비교

                    

                        
                    

                


                
                

                        
🏆 카테고리별 1위

                        

                            ${Object.entries(comparisonData.categoryWinners).map(([category, winner]) => `
                                
${this.getCategoryIcon(category)} ${this.getCategoryName(category)}
${winner.branch} (${winner.value})

                            `).join('')}
                        

                    

                        
📊 카테고리별 분포

                        

                            
                        

                    


                
                

                    
💡 분석 인사이트

                    

                        ${this.generateInsights(comparisonData)}
                    

                

            

        `;

        document.getElementById('comparisonResult').innerHTML = resultHTML;
        
        // 차트 그리기
        setTimeout(() => {
            this.drawCharts(comparisonData);
        }, 100);
    }

    // 비교 데이터 계산
    calculateComparisonData() {
        const branchData = this.selectedBranches.map(branchName => {
            const filteredChecklists = this.getFilteredChecklists(branchName);
            
            const stats = filteredChecklists.reduce((acc, c) => {
                acc.reviews += c.naverReviews || 0;
                acc.posts += c.naverPosts || 0;
                acc.experience += c.naverExperience || 0;
                acc.reels += c.instaReels || 0;
                acc.photos += c.instaPhotos || 0;
                return acc;
            }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });

            const total = stats.reviews + stats.posts + stats.experience + stats.reels + stats.photos;
            const days = this.getDaysInPeriod();
            const dailyAverage = days > 0 ? Math.round((total / days) * 10) / 10 : 0;

            return {
                name: branchName,
                ...stats,
                total,
                dailyAverage
            };
        });

        // 총 활동량으로 정렬
        branchData.sort((a, b) => b.total - a.total);

        // 카테고리별 1위 계산
        const categoryWinners = {
            reviews: branchData.reduce((prev, current) => prev.reviews > current.reviews ? prev : current),
            posts: branchData.reduce((prev, current) => prev.posts > current.posts ? prev : current),
            experience: branchData.reduce((prev, current) => prev.experience > current.experience ? prev : current),
            reels: branchData.reduce((prev, current) => prev.reels > current.reels ? prev : current),
            photos: branchData.reduce((prev, current) => prev.photos > current.photos ? prev : current)
        };

        Object.keys(categoryWinners).forEach(key => {
            categoryWinners[key] = {
                branch: categoryWinners[key].name,
                value: categoryWinners[key][key]
            };
        });

        return {
            branches: branchData,
            categoryWinners,
            totalSelected: this.selectedBranches.length
        };
    }

    // 필터링된 체크리스트 가져오기
    getFilteredChecklists(branchName) {
        let checklists = this.data.checklists.filter(c => c.branch === branchName);
        
        // 기간 필터링
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
            default:
                return checklists;
        }

        return checklists.filter(c => new Date(c.date) >= filterDate);
    }

    // 기간의 일수 계산
    getDaysInPeriod() {
        switch(this.currentPeriod) {
            case 'week': return 7;
            case 'month': 
                const now = new Date();
                return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            case 'quarter': return 90;
            default: return 30;
        }
    }

    // 차트 그리기
    drawCharts(data) {
        this.drawComparisonChart(data);
        this.drawCategoryChart(data);
    }

    // 비교 차트 그리기
    drawComparisonChart(data) {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;

        if (this.charts.comparisonChart) {
            this.charts.comparisonChart.destroy();
        }

        this.charts.comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.branches.map(b => b.name),
                datasets: [
                    {
                        label: '⭐ 네이버 리뷰',
                        data: data.branches.map(b => b.reviews),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    },
                    {
                        label: '📝 블로그 포스팅',
                        data: data.branches.map(b => b.posts),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    },
                    {
                        label: '🎯 체험단',
                        data: data.branches.map(b => b.experience),
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    },
                    {
                        label: '🎬 인스타 릴스',
                        data: data.branches.map(b => b.reels),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    },
                    {
                        label: '📷 인스타 사진',
                        data: data.branches.map(b => b.photos),
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    // 카테고리 차트 그리기
    drawCategoryChart(data) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        if (this.charts.categoryChart) {
            this.charts.categoryChart.destroy();
        }

        const totalStats = data.branches.reduce((acc, branch) => {
            acc.reviews += branch.reviews;
            acc.posts += branch.posts;
            acc.experience += branch.experience;
            acc.reels += branch.reels;
            acc.photos += branch.photos;
            return acc;
        }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });

        this.charts.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['⭐ 네이버 리뷰', '📝 블로그 포스팅', '🎯 체험단', '🎬 인스타 릴스', '📷 인스타 사진'],
                datasets: [{
                    data: [totalStats.reviews, totalStats.posts, totalStats.experience, totalStats.reels, totalStats.photos],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ]
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

    // 인사이트 생성
    generateInsights(data) {
        const insights = [];
        const branches = data.branches;
        
        if (branches.length >= 2) {
            const top = branches[0];
            const bottom = branches[branches.length - 1];
            const gap = top.total - bottom.total;
            
            insights.push(`• 최고 성과 지점인 "${top.name}"와 최하위 "${bottom.name}" 간 활동량 차이는 ${gap}건입니다.`);
            
            if (top.dailyAverage > 0) {
                insights.push(`• "${top.name}"의 일평균 활동량은 ${top.dailyAverage}건으로 가장 높습니다.`);
            }
        }

        // 카테고리별 분석
        const winners = data.categoryWinners;
        const dominantBranch = Object.values(winners).reduce((acc, curr) => {
            acc[curr.branch] = (acc[curr.branch] || 0) + 1;
            return acc;
        }, {});

        const maxWins = Math.max(...Object.values(dominantBranch));
        const dominantBranches = Object.entries(dominantBranch)
            .filter(([_, wins]) => wins === maxWins)
            .map(([branch, _]) => branch);

        if (dominantBranches.length === 1 && maxWins >= 3) {
            insights.push(`• "${dominantBranches[0]}"이 ${maxWins}개 카테고리에서 1위를 차지하며 전체적으로 우수한 성과를 보입니다.`);
        }

        if (insights.length === 0) {
            insights.push('• 선택된 지점들이 고른 성과를 보이고 있습니다.');
        }

        return insights.map(insight => `
${insight}
`).join('');
    }

    // 유틸리티 함수들
    getPeriodLabel() {
        const labels = {
            week: '최근 1주일',
            month: '이번 달',
            quarter: '이번 분기'
        };
        return labels[this.currentPeriod] || '이번 달';
    }

    getCategoryLabel() {
        const labels = {
            all: '전체',
            reviews: '네이버 리뷰',
            posts: '블로그 포스팅',
            experience: '체험단',
            reels: '인스타 릴스',
            photos: '인스타 사진'
        };
        return labels[this.currentCategory] || '전체';
    }

    getCategoryIcon(category) {
        const icons = {
            reviews: '⭐',
            posts: '📝',
            experience: '🎯',
            reels: '🎬',
            photos: '📷'
        };
        return icons[category] || '📊';
    }

    getCategoryName(category) {
        const names = {
            reviews: '네이버 리뷰',
            posts: '블로그 포스팅',
            experience: '체험단',
            reels: '인스타 릴스',
            photos: '인스타 사진'
        };
        return names[category] || category;
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 전체 선택 체크박스
        const selectAllCheckbox = document.getElementById('selectAllBranches');
        const branchCheckboxes = document.querySelectorAll('#branchCheckboxes input[type="checkbox"]');
        
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                branchCheckboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
            });
        }
        
        // 개별 체크박스 변경 시 전체 선택 상태 업데이트
        branchCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const checkedCount = document.querySelectorAll('#branchCheckboxes input[type="checkbox"]:checked').length;
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = checkedCount === branchCheckboxes.length;
                }
            });
        });
    }

    // 비교 결과 내보내기
    exportComparison() {
        if (this.selectedBranches.length === 0) {
            alert('비교할 지점을 먼저 선택해주세요.');
            return;
        }

        const comparisonData = this.calculateComparisonData();
        
        let csvContent = "순위,지점명,네이버리뷰,블로그포스팅,체험단,인스타릴스,인스타사진,총활동량,일평균활동량\n";
        
        comparisonData.branches.forEach((branch, index) => {
            csvContent += `${index + 1},${branch.name},${branch.reviews},${branch.posts},${branch.experience},${branch.reels},${branch.photos},${branch.total},${branch.dailyAverage}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `GOHAIR_지점비교_${this.getPeriodLabel()}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 전역 함수들
function updateComparison() {
    window.comparisonManager?.updateComparison();
}

function exportComparison() {
    window.comparisonManager?.exportComparison();
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
        'statistics': 'statistics.html'
    };
    
    if (pages[pageId]) {
        window.location.href = pages[pageId];
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.comparisonManager = new ComparisonManager();
    window.comparisonManager.initialize();
});

console.log('비교 페이지 스크립트 로딩 완료');
