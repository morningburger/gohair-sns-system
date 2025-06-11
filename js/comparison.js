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
        this.customStartDate = null;
        this.customEndDate = null;
        this.charts = {
            comparisonChart: null,
            categoryChart: null
        };
    }

    // 페이지 초기화
    async initialize() {
        try {
            console.log('🚀 ComparisonManager 초기화 시작');
            
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
            
            // 날짜 관련 초기화
            this.initializeDatePicker();
            
            console.log('✅ 비교 페이지 초기화 완료');
        } catch (error) {
            console.error('❌ 비교 페이지 초기화 오류:', error);
            this.showError('데이터 로드 중 오류가 발생했습니다: ' + error.message);
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
            console.log('🔄 Firebase 데이터 로딩 시작...');
            
            if (!firebase.firestore) {
                throw new Error('Firestore가 초기화되지 않았습니다');
            }
            
            const db = firebase.firestore();
            
            // 지점 데이터 로드
            console.log('📍 지점 데이터 로딩 중...');
            const branchesSnapshot = await db.collection('branches').get();
            this.data.branches = branchesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('✅ 지점 데이터 로드 완료:', this.data.branches.length, '개');
            
            // 디자이너 데이터 로드
            console.log('👥 디자이너 데이터 로딩 중...');
            const designersSnapshot = await db.collection('designers').get();
            this.data.designers = designersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('✅ 디자이너 데이터 로드 완료:', this.data.designers.length, '명');
            
            // 체크리스트 데이터 로드
            console.log('📋 체크리스트 데이터 로딩 중...');
            const checklistsSnapshot = await db.collection('checklists').get();
            this.data.checklists = checklistsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // 날짜 형식 통일 (Firestore timestamp를 문자열로 변환)
                    date: data.date ? (data.date.toDate ? data.date.toDate().toISOString().split('T')[0] : data.date) : null
                };
            });
            console.log('✅ 체크리스트 데이터 로드 완료:', this.data.checklists.length, '건');
            
            // 데이터 샘플 출력 (디버깅용)
            if (this.data.checklists.length > 0) {
                console.log('📋 체크리스트 샘플:', this.data.checklists[0]);
            }
            
            console.log('⚖️ Firebase 데이터 로드 완료:', {
                branches: this.data.branches.length,
                designers: this.data.designers.length,
                checklists: this.data.checklists.length
            });
            
        } catch (error) {
            console.error('❌ Firebase 데이터 로딩 오류:', error);
            
            // 오류 시 임시 데이터 사용 (개발용)
            console.log('🔄 임시 데이터로 대체합니다...');
            this.data.branches = [
                { id: '1', name: '송도1지점', location: '송도' },
                { id: '2', name: '검단테라스점', location: '검단' },
                { id: '3', name: '부평점', location: '부평' },
                { id: '4', name: '인천점', location: '인천' },
                { id: '5', name: '강남점', location: '강남' }
            ];
            
            // 임시 체크리스트 데이터 생성
            this.data.checklists = this.generateSampleChecklists();
            this.data.designers = [];
            
            console.log('🔄 임시 데이터로 진행합니다');
        }
    }

    // 샘플 체크리스트 데이터 생성 (Firebase 연결 실패 시)
    generateSampleChecklists() {
        const sampleData = [];
        const branches = ['송도1지점', '검단테라스점', '부평점', '인천점', '강남점'];
        const today = new Date();
        
        // 최근 30일간의 데이터 생성
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            branches.forEach(branch => {
                // 일부 날짜는 건너뛰어서 실제적인 데이터 패턴 생성
                if (Math.random() > 0.3) {
                    sampleData.push({
                        id: `sample_${branch}_${i}`,
                        branch: branch,
                        date: dateString,
                        naverReviews: Math.floor(Math.random() * 5),
                        naverPosts: Math.floor(Math.random() * 3),
                        naverExperience: Math.floor(Math.random() * 2),
                        instaReels: Math.floor(Math.random() * 4),
                        instaPhotos: Math.floor(Math.random() * 6),
                        designer: `디자이너${Math.floor(Math.random() * 3) + 1}`
                    });
                }
            });
        }
        
        console.log('📋 샘플 체크리스트 생성 완료:', sampleData.length, '건');
        return sampleData;
    }

    // 지점 체크박스 설정
    setupBranchCheckboxes() {
        const container = document.getElementById('branchCheckboxes');
        if (!container) return;

        container.innerHTML = this.data.branches.map(branch => `
            <label style="display: flex; align-items: center;">
                <input type="checkbox" value="${branch.name}" style="margin-right: 0.5rem;" onchange="window.comparisonManager.updateSelectAllState()">
                ${branch.name}
            </label>
        `).join('');
    }

    // 전체 선택 상태 업데이트
    updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('selectAllBranches');
        const branchCheckboxes = document.querySelectorAll('#branchCheckboxes input[type="checkbox"]');
        const checkedCount = document.querySelectorAll('#branchCheckboxes input[type="checkbox"]:checked').length;
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = checkedCount === branchCheckboxes.length;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < branchCheckboxes.length;
        }
    }

    // 날짜 선택기 초기화
    initializeDatePicker() {
        const today = new Date();
        this.customStartDate = new Date(today.getFullYear(), today.getMonth(), 1); // 이번 달 1일
        this.customEndDate = new Date(today); // 오늘
        
        // 날짜 입력 필드 초기화
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput && endDateInput) {
            startDateInput.value = this.customStartDate.toISOString().split('T')[0];
            endDateInput.value = this.customEndDate.toISOString().split('T')[0];
        }
    }

    // 기간 변경 처리
    handlePeriodChange() {
        const period = document.getElementById('comparisonPeriod').value;
        const dateInputGroup = document.getElementById('dateInputGroup');
        
        this.currentPeriod = period;
        
        if (period === 'custom') {
            dateInputGroup.style.display = 'flex';
        } else {
            dateInputGroup.style.display = 'none';
            this.updateDateRangeByPeriod(period);
        }
    }

    // 기간별 날짜 범위 업데이트
    updateDateRangeByPeriod(period) {
        const today = new Date();
        let startDate, endDate;
        
        switch(period) {
            case 'today':
                startDate = endDate = new Date(today);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay()); // 이번 주 일요일
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6); // 이번 주 토요일
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1);
                endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0);
                break;
            case 'all':
                startDate = new Date(2024, 0, 1); // 2024년 1월 1일
                endDate = new Date(today);
                break;
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today);
        }
        
        this.customStartDate = startDate;
        this.customEndDate = endDate;
        
        // 입력 필드 업데이트
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        
        if (startInput && endInput) {
            startInput.value = startDate.toISOString().split('T')[0];
            endInput.value = endDate.toISOString().split('T')[0];
        }
    }

    // 비교 업데이트
    updateComparison() {
        console.log('🔄 비교 업데이트 시작');
        
        this.selectedBranches = Array.from(document.querySelectorAll('#branchCheckboxes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        console.log('📍 선택된 지점들:', this.selectedBranches);
        
        if (this.selectedBranches.length === 0) {
            alert('비교할 지점을 선택해주세요.');
            return;
        }

        this.currentPeriod = document.getElementById('comparisonPeriod').value;
        this.currentCategory = document.getElementById('comparisonCategory').value;
        
        console.log('⚙️ 설정된 옵션:', {
            period: this.currentPeriod,
            category: this.currentCategory,
            startDate: this.customStartDate?.toISOString().split('T')[0],
            endDate: this.customEndDate?.toISOString().split('T')[0]
        });
        
        // 사용자 지정 기간인 경우 날짜 업데이트
        if (this.currentPeriod === 'custom') {
            const startInput = document.getElementById('startDate');
            const endInput = document.getElementById('endDate');
            
            if (startInput.value) {
                this.customStartDate = new Date(startInput.value);
            }
            if (endInput.value) {
                this.customEndDate = new Date(endInput.value);
            }
        }
        
        // 버튼 상태 변경
        const updateBtn = document.getElementById('updateBtn');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.innerHTML = '<span style="animation: spin 1s linear infinite; display: inline-block;">⏳</span> 분석 중...';
        }
        
        // 로딩 표시
        document.getElementById('comparisonResult').innerHTML = `
            <div class="text-center" style="padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem; animation: spin 2s linear infinite; display: inline-block;">⚖️</div>
                <p style="color: #6b7280;">비교 분석 중...</p>
                <div style="margin-top: 1rem;">
                    <div style="width: 200px; height: 4px; background: #e5e7eb; border-radius: 2px; margin: 0 auto; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); animation: slide 2s ease-in-out infinite;"></div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            </style>
        `;

        // 실제 데이터 분석 실행
        setTimeout(() => {
            try {
                console.log('📊 데이터 분석 시작...');
                this.displayComparison();
                
                // 버튼 복구
                if (updateBtn) {
                    updateBtn.disabled = false;
                    updateBtn.innerHTML = '🔄 비교 차트 업데이트';
                }
                console.log('✅ 비교 분석 완료');
            } catch (error) {
                console.error('❌ 비교 분석 오류:', error);
                
                // 에러 표시
                document.getElementById('comparisonResult').innerHTML = `
                    <div class="text-center" style="padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                        <p style="color: #dc2626;">분석 중 오류가 발생했습니다: ${error.message}</p>
                        <button onclick="window.comparisonManager.updateComparison()" class="btn" style="margin-top: 1rem;">다시 시도</button>
                    </div>
                `;
                
                // 버튼 복구
                if (updateBtn) {
                    updateBtn.disabled = false;
                    updateBtn.innerHTML = '🔄 비교 차트 업데이트';
                }
            }
        }, 800);
    }

    // 비교 결과 표시
    displayComparison() {
        const comparisonData = this.calculateComparisonData();
        
        const resultHTML = `
            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">📊 지점 비교 결과</h3>
                
                <div style="display: flex; flex-wrap: wrap; gap: 2rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid #3b82f6;">
                    <div><strong>📍 선택 지점:</strong> <span style="color: #3b82f6;">${this.selectedBranches.join(', ')}</span></div>
                    <div><strong>📅 분석 기간:</strong> <span style="color: #059669;">${this.getPeriodLabel()}</span></div>
                    <div><strong>🏷️ 분석 카테고리:</strong> <span style="color: #dc2626;">${this.getCategoryLabel()}</span></div>
                </div>
            </div>
            
            <!-- 순위 카드들 -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                ${comparisonData.branches.map((branch, index) => {
                    const isTop = index === 0;
                    const isBottom = index === comparisonData.branches.length - 1;
                    let cardStyle, rankIcon, rankText;
                    
                    if (isTop) {
                        cardStyle = 'background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; transform: scale(1.02); box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);';
                        rankIcon = '🏆';
                        rankText = '1위';
                    } else if (index === 1) {
                        cardStyle = 'background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%); color: #374151; transform: scale(1.01);';
                        rankIcon = '🥈';
                        rankText = '2위';
                    } else if (index === 2) {
                        cardStyle = 'background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: white;';
                        rankIcon = '🥉';
                        rankText = '3위';
                    } else {
                        cardStyle = 'background: white; border: 1px solid #e5e7eb;';
                        rankIcon = '📍';
                        rankText = `${index + 1}위`;
                    }
                    
                    return `
                        <div style="padding: 1.5rem; border-radius: 0.75rem; ${cardStyle} transition: all 0.3s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <h4 style="font-weight: bold; font-size: 1.1rem;">${branch.name}</h4>
                                <div style="text-align: center;">
                                    <div style="font-size: 1.5rem;">${rankIcon}</div>
                                    <div style="font-size: 0.75rem; font-weight: bold;">${rankText}</div>
                                </div>
                            </div>
                            
                            <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; text-align: center;">${branch.total}</div>
                            <div style="text-align: center; font-size: 0.875rem; opacity: 0.9; margin-bottom: 1rem;">총 활동량</div>
                            
                            <div style="font-size: 0.875rem; line-height: 1.6; opacity: 0.9;">
                                ⭐ 리뷰: <strong>${branch.reviews}</strong><br>
                                📝 포스팅: <strong>${branch.posts}</strong><br>
                                🎯 체험단: <strong>${branch.experience}</strong><br>
                                🎬 릴스: <strong>${branch.reels}</strong><br>
                                📷 사진: <strong>${branch.photos}</strong>
                            </div>
                            
                            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.3); text-align: center;">
                                <div style="font-size: 0.875rem; opacity: 0.9;">
                                    일평균: <strong>${branch.dailyAverage}</strong>건
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <!-- 차트 영역 -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="font-weight: bold; margin-bottom: 1rem; color: #374151;">📈 지점별 상세 비교</h4>
                    <div style="position: relative; height: 300px;">
                        <canvas id="comparisonChart"></canvas>
                    </div>
                </div>
                
                <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="font-weight: bold; margin-bottom: 1rem; color: #374151;">📊 카테고리별 분포</h4>
                    <div style="position: relative; height: 300px;">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- 카테고리별 1위 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;">
                    <h4 style="font-weight: bold; margin-bottom: 1rem; color: #374151;">🏆 카테고리별 1위</h4>
                    <div style="display: grid; gap: 0.75rem;">
                        ${Object.entries(comparisonData.categoryWinners).map(([category, winner]) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem;">
                                <span style="font-weight: 600;">${this.getCategoryIcon(category)} ${this.getCategoryName(category)}</span>
                                <span style="color: #3b82f6; font-weight: bold;">${winner.branch} (${winner.value})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;">
                    <h4 style="font-weight: bold; margin-bottom: 1rem; color: #374151;">💡 분석 인사이트</h4>
                    <div style="color: #6b7280; line-height: 1.6; font-size: 0.9rem;">
                        ${this.generateInsights(comparisonData)}
                    </div>
                </div>
            </div>
            
            <!-- 내보내기 버튼 -->
            <div style="text-align: center; margin-top: 2rem;">
                <button onclick="window.comparisonManager.exportComparison()" class="btn" style="background: #059669; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: bold;">
                    📊 결과 내보내기 (CSV)
                </button>
            </div>
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
            
            console.log(`📊 ${branchName} 필터링된 체크리스트:`, filteredChecklists.length, '건');
            
            // 실제 Firebase 데이터 사용
            const stats = filteredChecklists.reduce((acc, c) => {
                // 카테고리 필터링 적용
                if (this.currentCategory === 'all' || this.currentCategory === 'reviews') {
                    acc.reviews += parseInt(c.naverReviews) || 0;
                }
                if (this.currentCategory === 'all' || this.currentCategory === 'posts') {
                    acc.posts += parseInt(c.naverPosts) || 0;
                }
                if (this.currentCategory === 'all' || this.currentCategory === 'experience') {
                    acc.experience += parseInt(c.naverExperience) || 0;
                }
                if (this.currentCategory === 'all' || this.currentCategory === 'reels') {
                    acc.reels += parseInt(c.instaReels) || 0;
                }
                if (this.currentCategory === 'all' || this.currentCategory === 'photos') {
                    acc.photos += parseInt(c.instaPhotos) || 0;
                }
                return acc;
            }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });

            // 데이터가 없는 경우 샘플 데이터 생성 (개발/테스트용)
            if (this.data.checklists.length === 0) {
                console.log('⚠️ 체크리스트 데이터가 없어 샘플 데이터를 생성합니다.');
                const sampleStats = {
                    reviews: Math.floor(Math.random() * 30) + 5,
                    posts: Math.floor(Math.random() * 20) + 3,
                    experience: Math.floor(Math.random() * 15) + 2,
                    reels: Math.floor(Math.random() * 25) + 4,
                    photos: Math.floor(Math.random() * 40) + 10
                };
                Object.assign(stats, sampleStats);
            }

            const total = stats.reviews + stats.posts + stats.experience + stats.reels + stats.photos;
            const days = this.getDaysInPeriod();
            const dailyAverage = days > 0 ? Math.round((total / days) * 10) / 10 : 0;

            console.log(`📈 ${branchName} 통계:`, stats, `총합: ${total}, 일평균: ${dailyAverage}`);

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
        console.log(`🔍 ${branchName} 체크리스트 필터링 시작`);
        console.log(`📊 전체 체크리스트 수:`, this.data.checklists.length);
        
        // 지점명으로 필터링
        let checklists = this.data.checklists.filter(c => {
            const branchMatch = c.branch === branchName;
            if (!branchMatch && c.branch) {
                // 디버깅: 매칭되지 않는 지점명 출력
                console.log(`❌ 지점명 불일치: "${c.branch}" !== "${branchName}"`);
            }
            return branchMatch;
        });
        
        console.log(`📍 ${branchName} 지점 체크리스트:`, checklists.length, '건');
        
        // 기간 필터링
        const startDate = this.customStartDate;
        const endDate = this.customEndDate;

        if (startDate && endDate) {
            console.log(`📅 기간 필터링: ${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`);
            
            const filteredByDate = checklists.filter(c => {
                if (!c.date) {
                    console.log('⚠️ 날짜 정보가 없는 체크리스트:', c);
                    return false;
                }
                
                const checklistDate = new Date(c.date);
                const isInRange = checklistDate >= startDate && checklistDate <= endDate;
                
                if (!isInRange) {
                    console.log(`❌ 기간 외: ${c.date} (${checklistDate.toDateString()})`);
                }
                
                return isInRange;
            });
            
            console.log(`📅 기간 필터링 후:`, filteredByDate.length, '건');
            return filteredByDate;
        }

        console.log(`📋 최종 필터링 결과:`, checklists.length, '건');
        return checklists;
    }

    // 기간의 일수 계산
    getDaysInPeriod() {
        if (this.customStartDate && this.customEndDate) {
            const timeDiff = this.customEndDate.getTime() - this.customStartDate.getTime();
            return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        }
        
        switch(this.currentPeriod) {
            case 'today': return 1;
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
                    x: { 
                        stacked: true,
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: { 
                        stacked: true, 
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
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
                    ],
                    borderWidth: 2,
                    borderColor: 'white'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed}건 (${percentage}%)`;
                            }
                        }
                    }
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
            
            insights.push(`• <strong>${top.name}</strong>이 총 <strong>${top.total}건</strong>으로 1위를 차지했습니다.`);
            
            if (branches.length > 1) {
                insights.push(`• 최고 성과 지점과 최하위 지점 간 활동량 차이는 <strong>${gap}건</strong>입니다.`);
            }
            
            if (top.dailyAverage > 0) {
                insights.push(`• ${top.name}의 일평균 활동량은 <strong>${top.dailyAverage}건</strong>으로 가장 높습니다.`);
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
            insights.push(`• <strong>${dominantBranches[0]}</strong>이 ${maxWins}개 카테고리에서 1위를 차지하며 전체적으로 우수한 성과를 보입니다.`);
        }

        // 카테고리별 최고 성과 분석
        const topCategory = Object.entries(data.branches.reduce((acc, branch) => {
            acc.reviews += branch.reviews;
            acc.posts += branch.posts;
            acc.experience += branch.experience;
            acc.reels += branch.reels;
            acc.photos += branch.photos;
            return acc;
        }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 }))
        .sort(([,a], [,b]) => b - a)[0];

        if (topCategory) {
            insights.push(`• 전체적으로 <strong>${this.getCategoryName(topCategory[0])}</strong> 활동이 가장 활발합니다. (${topCategory[1]}건)`);
        }

        if (insights.length === 0) {
            insights.push('• 선택된 지점들이 고른 성과를 보이고 있습니다.');
        }

        return insights.map(insight => `<div style="margin-bottom: 0.5rem;">${insight}</div>`).join('');
    }

    // 유틸리티 함수들
    getPeriodLabel() {
        const labels = {
            today: '오늘',
            week: '이번 주',
            month: '이번 달',
            quarter: '이번 분기',
            all: '전체',
            custom: '사용자 지정'
        };
        
        if (this.currentPeriod === 'custom' && this.customStartDate && this.customEndDate) {
            const start = this.customStartDate.toLocaleDateString('ko-KR');
            const end = this.customEndDate.toLocaleDateString('ko-KR');
            return `${start} ~ ${end}`;
        }
        
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
        
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const branchCheckboxes = document.querySelectorAll('#branchCheckboxes input[type="checkbox"]');
                branchCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
        }

        // 기간 선택 변경
        const periodSelect = document.getElementById('comparisonPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                this.handlePeriodChange();
            });
        }

        // 날짜 입력 변경
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) {
            startDateInput.addEventListener('change', (e) => {
                this.customStartDate = new Date(e.target.value);
            });
        }
        
        if (endDateInput) {
            endDateInput.addEventListener('change', (e) => {
                this.customEndDate = new Date(e.target.value);
            });
        }
    }

    // 에러 표시
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.innerHTML = `
            <div style="padding: 1rem; background: #fee2e2; color: #dc2626; border-radius: 0.5rem; margin: 1rem;">
                ⚠️ ${message}
            </div>
        `;
        const container = document.querySelector('.container');
        if (container) {
            container.prepend(errorElement);
            
            // 5초 후 에러 메시지 제거
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 5000);
        }
    }

    // 비교 결과 내보내기
    exportComparison() {
        if (this.selectedBranches.length === 0) {
            alert('비교할 지점을 먼저 선택해주세요.');
            return;
        }

        const comparisonData = this.calculateComparisonData();
        
        // BOM 추가하여 한글 깨짐 방지
        let csvContent = "\ufeff순위,지점명,네이버리뷰,블로그포스팅,체험단,인스타릴스,인스타사진,총활동량,일평균활동량\n";
        
        comparisonData.branches.forEach((branch, index) => {
            csvContent += `${index + 1},${branch.name},${branch.reviews},${branch.posts},${branch.experience},${branch.reels},${branch.photos},${branch.total},${branch.dailyAverage}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `GOHAIR_지점비교_${this.getPeriodLabel().replace(/~/g, '-').replace(/\s/g, '')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 성공 메시지 표시
        const successMsg = document.createElement('div');
        successMsg.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 1rem; border-radius: 0.5rem; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ✅ CSV 파일이 다운로드되었습니다!
            </div>
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.parentNode.removeChild(successMsg);
            }
        }, 3000);
    }
}

// 전역 함수들
function updateComparison() {
    window.comparisonManager?.updateComparison();
}

function exportComparison() {
    window.comparisonManager?.exportComparison();
}

function handlePeriodChange() {
    window.comparisonManager?.handlePeriodChange();
}

function toggleCalendar() {
    const calendar = document.getElementById('calendarContainer');
    const isVisible = calendar.style.display === 'block';
    
    if (isVisible) {
        closeCalendar();
    } else {
        calendar.style.display = 'block';
        generateCalendar();
    }
}

function closeCalendar() {
    document.getElementById('calendarContainer').style.display = 'none';
}

function selectQuickRange(period) {
    // 활성 버튼 표시
    document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // 기간 업데이트
    document.getElementById('comparisonPeriod').value = period;
    window.comparisonManager?.handlePeriodChange();
    generateCalendar();
}

function generateCalendar() {
    if (!window.comparisonManager) return;
    
    const grid = document.getElementById('calendarGrid');
    const monthSpan = document.getElementById('currentMonth');
    
    if (!grid || !monthSpan) return;
    
    const currentDate = window.currentCalendarDate || new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthSpan.textContent = `${year}년 ${month + 1}월`;
    
    // 요일 헤더
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    let html = weekdays.map(day => `<div style="font-weight: bold; padding: 0.5rem; color: #6b7280;">${day}</div>`).join('');
    
    // 첫 번째 날의 요일
    const firstDay = new Date(year, month, 1).getDay();
    
    // 이전 달 마지막 날들
    const prevMonth = new Date(year, month, 0);
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonth.getDate() - i;
        html += `<button class="calendar-day other-month" onclick="selectDate(${year}, ${month - 1}, ${day})">${day}</button>`;
    }
    
    // 현재 달
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = (window.selectedStartDate && date.toDateString() === window.selectedStartDate.toDateString()) ||
                         (window.selectedEndDate && date.toDateString() === window.selectedEndDate.toDateString());
        
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        
        html += `<button class="${classes}" onclick="selectDate(${year}, ${month}, ${day})">${day}</button>`;
    }
    
    // 다음 달 첫 날들
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    
    for (let day = 1; day <= remainingCells; day++) {
        html += `<button class="calendar-day other-month" onclick="selectDate(${year}, ${month + 1}, ${day})">${day}</button>`;
    }
    
    grid.innerHTML = html;
}

function selectDate(year, month, day) {
    const date = new Date(year, month, day);
    
    if (!window.isSelectingRange) {
        window.selectedStartDate = date;
        window.selectedEndDate = null;
        window.isSelectingRange = true;
    } else {
        if (date < window.selectedStartDate) {
            window.selectedEndDate = window.selectedStartDate;
            window.selectedStartDate = date;
        } else {
            window.selectedEndDate = date;
        }
        window.isSelectingRange = false;
    }
    
    generateCalendar();
}

function previousMonth() {
    if (!window.currentCalendarDate) {
        window.currentCalendarDate = new Date();
    }
    window.currentCalendarDate.setMonth(window.currentCalendarDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    if (!window.currentCalendarDate) {
        window.currentCalendarDate = new Date();
    }
    window.currentCalendarDate.setMonth(window.currentCalendarDate.getMonth() + 1);
    generateCalendar();
}

function applyDateRange() {
    if (window.selectedStartDate && window.selectedEndDate) {
        document.getElementById('startDate').value = window.selectedStartDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = window.selectedEndDate.toISOString().split('T')[0];
        document.getElementById('comparisonPeriod').value = 'custom';
        
        // ComparisonManager 인스턴스 업데이트
        if (window.comparisonManager) {
            window.comparisonManager.customStartDate = window.selectedStartDate;
            window.comparisonManager.customEndDate = window.selectedEndDate;
            window.comparisonManager.handlePeriodChange();
        }
    }
    closeCalendar();
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

// 전역 변수 초기화
window.currentCalendarDate = new Date();
window.selectedStartDate = null;
window.selectedEndDate = null;
window.isSelectingRange = false;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.comparisonManager = new ComparisonManager();
    window.comparisonManager.initialize();
});

console.log('비교 페이지 스크립트 로딩 완료');