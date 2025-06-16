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
        this.isDataLoaded = false;
        this.db = null;
        this.initPromise = null;
    }

    // 페이지 초기화
    async initialize() {
        // 중복 초기화 방지
        if (this.initPromise) {
            return this.initPromise;
        }
        
        this.initPromise = this._doInitialize();
        return this.initPromise;
    }
    
    async _doInitialize() {
        try {
            console.log('🚀 ComparisonManager 초기화 시작');
            
            // Firebase 연결 대기
            await this.waitForFirebase();
            
            // Firebase 연결 확인 및 초기화
            await this.initializeFirebase();
            
            // 사용자 정보 확인
            this.currentUser = this.getCurrentUser();
            this.updateUserDisplay();
            
            // 실제 Firebase 데이터 로드
            await this.loadRealFirebaseData();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 지점 체크박스 생성
            this.setupBranchCheckboxes();
            
            // 날짜 관련 초기화
            this.initializeDatePicker();
            
            this.isDataLoaded = true;
            
            console.log('✅ 비교 페이지 초기화 완료');
            
            // 초기화 완료 UI 업데이트
            this.updateInitializationComplete();
            
        } catch (error) {
            console.error('❌ 비교 페이지 초기화 오류:', error);
            this.showError('데이터 로드 중 오류가 발생했습니다: ' + error.message);
            this.showInitializationError(error);
        }
    }

    // Firebase 로드 대기
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5초 대기
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                    console.log('✅ Firebase 로드 완료 확인');
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    reject(new Error('Firebase 로드 타임아웃'));
                    return;
                }
                
                console.log(`⏳ Firebase 로드 대기 중... (${attempts}/${maxAttempts})`);
                setTimeout(checkFirebase, 100);
            };
            
            checkFirebase();
        });
    }

    // Firebase 초기화
    async initializeFirebase() {
        try {
            console.log('🔥 Firebase 연결 확인 중...');
            
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK가 로드되지 않았습니다');
            }
            
            // Firebase 앱이 이미 초기화되었는지 확인
            if (firebase.apps.length === 0) {
                throw new Error('Firebase 앱이 초기화되지 않았습니다. firebase.js를 확인하세요.');
            }
            
            // Firestore 인스턴스 가져오기
            this.db = firebase.firestore();
            
            if (!this.db) {
                throw new Error('Firestore 인스턴스를 가져올 수 없습니다');
            }
            
            // 연결 테스트
            await this.testFirestoreConnection();
            
            console.log('✅ Firebase 연결 성공');
            
        } catch (error) {
            console.error('❌ Firebase 초기화 실패:', error);
            throw new Error(`Firebase 연결 실패: ${error.message}`);
        }
    }
    
    // Firestore 연결 테스트
    async testFirestoreConnection() {
        try {
            console.log('🔍 Firestore 연결 테스트...');
            const testDoc = await this.db.collection('_test').limit(1).get();
            console.log('✅ Firestore 연결 테스트 성공');
        } catch (error) {
            console.log('⚠️ Firestore 연결 테스트 실패 (정상적일 수 있음):', error.message);
            // 연결 테스트 실패해도 계속 진행 (권한 문제일 수 있음)
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
            if (this.currentUser) {
                userElement.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
                userElement.className = 'firebase-status firebase-connected';
            } else {
                userElement.textContent = '🔥 Firebase 연결됨';
                userElement.className = 'firebase-status firebase-connected';
            }
        }
    }

    // 실제 Firebase 데이터 로드 (임의 값 제거)
    async loadRealFirebaseData() {
        try {
            console.log('🔄 실제 Firebase 데이터 로딩 시작...');
            
            if (!this.db) {
                throw new Error('Firestore 인스턴스가 없습니다');
            }
            
            // 지점 데이터 로드 (실제 Firebase에서만)
            console.log('📍 지점 데이터 로딩 중...');
            const branchesSnapshot = await this.db.collection('branches').get();
            this.data.branches = branchesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('✅ 지점 데이터 로드 완료:', this.data.branches.length, '개');
            
            if (this.data.branches.length > 0) {
                console.log('📍 로드된 지점들:', this.data.branches.map(b => b.name || b.branchName || '이름없음'));
            }
            
            // 디자이너 데이터 로드
            console.log('👥 디자이너 데이터 로딩 중...');
            const designersSnapshot = await this.db.collection('designers').get();
            this.data.designers = designersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('✅ 디자이너 데이터 로드 완료:', this.data.designers.length, '명');
            
            // 체크리스트 데이터 로드 (실제 Firebase 데이터만)
            console.log('📋 체크리스트 데이터 로딩 중...');
            const checklistsSnapshot = await this.db.collection('checklists').get();
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
            
            // 실제 데이터 샘플 출력
            if (this.data.checklists.length > 0) {
                console.log('📋 체크리스트 샘플 (최신 3건):');
                this.data.checklists.slice(0, 3).forEach((item, index) => {
                    console.log(`${index + 1}.`, {
                        id: item.id,
                        branch: item.branch || item.branchName || item.selectedBranch,
                        date: item.date,
                        reviews: item.naverReviews,
                        posts: item.naverPosts,
                        experience: item.naverExperience,
                        reels: item.instaReels,
                        photos: item.instaPhotos
                    });
                });
            }
            
            // 지점별 데이터 분포 확인
            if (this.data.checklists.length > 0) {
                const branchDistribution = this.data.checklists.reduce((acc, item) => {
                    const branchName = item.branch || item.branchName || item.selectedBranch || '미지정';
                    acc[branchName] = (acc[branchName] || 0) + 1;
                    return acc;
                }, {});
                console.log('📊 지점별 체크리스트 분포:', branchDistribution);
            }
            
            console.log('⚖️ 실제 Firebase 데이터 로드 완료:', {
                branches: this.data.branches.length,
                designers: this.data.designers.length,
                checklists: this.data.checklists.length
            });
            
        } catch (error) {
            console.error('❌ Firebase 데이터 로딩 오류:', error);
            throw new Error(`Firebase 데이터 로드 실패: ${error.message}`);
        }
    }

    // 지점 체크박스 설정 (실제 Firebase 데이터만 사용)
    setupBranchCheckboxes() {
        const container = document.getElementById('branchCheckboxes');
        if (!container) return;

        if (this.data.branches.length === 0) {
            container.innerHTML = `
                <div style="padding: 1rem; text-align: center; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; color: #dc2626;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                    <p><strong>지점 데이터가 없습니다</strong></p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">Firebase에 지점을 먼저 등록해주세요.</p>
                    <button onclick="goToPage('branches')" class="btn" style="margin-top: 0.5rem; font-size: 0.875rem;">🏢 지점 관리로 이동</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.branches.map(branch => {
            const branchName = branch.name || branch.branchName || `지점 ${branch.id}`;
            return `
                <label style="display: flex; align-items: center; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; cursor: pointer;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                    <input type="checkbox" value="${branchName}" style="margin-right: 0.5rem;" onchange="window.comparisonManager.updateSelectAllState()">
                    <span>${branchName}</span>
                </label>
            `;
        }).join('');
        
        console.log('✅ 지점 체크박스 설정 완료:', this.data.branches.length, '개');
    }

    // 초기화 완료 UI 업데이트
    updateInitializationComplete() {
        const resultContainer = document.getElementById('comparisonResult');
        if (resultContainer) {
            if (this.data.branches.length === 0) {
                resultContainer.innerHTML = `
                    <div class="text-center" style="padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                        <h3 style="color: #374151; margin-bottom: 1rem;">지점 데이터가 없습니다</h3>
                        <p style="color: #6b7280; margin-bottom: 1rem;">Firebase에 지점 정보를 먼저 등록해주세요.</p>
                        <button onclick="goToPage('branches')" class="btn" style="margin-top: 1rem;">🏢 지점 관리로 이동</button>
                    </div>
                `;
            } else if (this.data.checklists.length === 0) {
                resultContainer.innerHTML = `
                    <div class="text-center" style="padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                        <h3 style="color: #374151; margin-bottom: 1rem;">체크리스트 데이터가 없습니다</h3>
                        <p style="color: #6b7280; margin-bottom: 1rem;">체크리스트를 먼저 입력해주세요.</p>
                        <button onclick="goToPage('checklist')" class="btn" style="margin-top: 1rem;">📋 체크리스트 입력하기</button>
                    </div>
                `;
            } else {
                resultContainer.innerHTML = `
                    <div class="text-center" style="padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">⚖️</div>
                        <h3 style="color: #374151; margin-bottom: 1rem;">지점 비교 준비 완료</h3>
                        <p style="color: #6b7280; margin-bottom: 1rem;">
                            <strong>${this.data.branches.length}개 지점</strong>과 <strong>${this.data.checklists.length}건</strong>의 체크리스트 데이터가 준비되었습니다.
                        </p>
                        <p style="color: #6b7280; font-size: 0.875rem;">
                            지점을 선택하고 "비교 차트 업데이트" 버튼을 눌러주세요.
                        </p>
                    </div>
                `;
            }
        }
    }

    // 초기화 오류 표시
    showInitializationError(error) {
        const resultContainer = document.getElementById('comparisonResult');
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <h3 style="color: #dc2626; margin-bottom: 1rem;">초기화 실패</h3>
                    <p style="color: #6b7280; margin-bottom: 1rem;">${error.message}</p>
                    <div style="background: #fef2f2; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; text-align: left;">
                        <p style="font-size: 0.875rem; color: #374151;">
                            <strong>해결 방법:</strong><br>
                            1. 페이지를 새로고침해보세요<br>
                            2. Firebase 설정을 확인해주세요<br>
                            3. 브라우저 콘솔에서 자세한 오류를 확인해주세요
                        </p>
                    </div>
                    <button onclick="location.reload()" class="btn" style="margin-top: 1rem;">🔄 페이지 새로고침</button>
                </div>
            `;
        }
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

    // 비교 업데이트 (실제 데이터만 사용)
    updateComparison() {
        console.log('🔄 비교 업데이트 시작');
        
        if (!this.isDataLoaded) {
            console.log('⚠️ 데이터가 아직 로드되지 않았습니다');
            this.showError('데이터가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        if (this.data.branches.length === 0) {
            this.showError('지점 데이터가 없습니다. Firebase에 지점을 먼저 등록해주세요.');
            return;
        }
        
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
                <p style="color: #6b7280;">실제 Firebase 데이터 분석 중...</p>
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
                console.log('📊 실제 Firebase 데이터 분석 시작...');
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
        const comparisonData = this.calculateRealComparisonData();
        
        if (comparisonData.totalRecords === 0) {
            document.getElementById('comparisonResult').innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                    <h3 style="color: #374151; margin-bottom: 1rem;">분석할 데이터가 없습니다</h3>
                    <p style="color: #6b7280; margin-bottom: 1rem;">선택한 기간과 지점에 해당하는 체크리스트 데이터가 없습니다.</p>
                    <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
                        <p style="color: #374151; font-size: 0.875rem;">
                            💡 <strong>해결 방법:</strong><br>
                            • 다른 기간을 선택해보세요<br>
                            • 체크리스트 입력 페이지에서 데이터를 먼저 입력해주세요<br>
                            • 지점명이 정확한지 확인해주세요
                        </p>
                    </div>
                    <button onclick="goToPage('checklist')" class="btn" style="margin-top: 1rem;">📋 체크리스트 입력하기</button>
                </div>
            `;
            return;
        }
        
        const resultHTML = `
            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">📊 지점 비교 결과</h3>
                
                <div style="display: flex; flex-wrap: wrap; gap: 2rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid #3b82f6;">
                    <div><strong>📍 선택 지점:</strong> <span style="color: #3b82f6;">${this.selectedBranches.join(', ')}</span></div>
                    <div><strong>📅 분석 기간:</strong> <span style="color: #059669;">${this.getPeriodLabel()}</span></div>
                    <div><strong>🏷️ 분석 카테고리:</strong> <span style="color: #dc2626;">${this.getCategoryLabel()}</span></div>
                    <div><strong>📋 분석된 데이터:</strong> <span style="color: #7c3aed; font-weight: bold;">${comparisonData.totalRecords}건 (실제 Firebase 데이터)</span></div>
                </div>
            </div>
            
            <!-- 순위 카드들 -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                ${comparisonData.branches.map((branch, index) => {
                    const isTop = index === 0;
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
                                    일평균: <strong>${branch.dailyAverage}</strong>건 | 레코드: <strong>${branch.recordCount}</strong>건
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
            
            <!-- 내보내기 버튼 -->
            <div style="text-align: center; margin-top: 2rem;">
                <button onclick="window.comparisonManager.exportComparison()" class="btn" style="background: #059669; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: bold;">
                    📊 결과 내보내기 (CSV)
                </button>
            </div>
        `;

        document.getElementById('comparisonResult').innerHTML = resultHTML;
        
        // 차트 그리기 (중복 방지)
        setTimeout(() => {
            this.drawCharts(comparisonData);
        }, 100);
    }

    // 실제 Firebase 데이터만 사용한 비교 데이터 계산
    calculateRealComparisonData() {
        console.log('📊 실제 Firebase 데이터로만 비교 분석 시작');
        console.log('📋 전체 체크리스트 수:', this.data.checklists.length);
        
        let totalFilteredRecords = 0;
        
        const branchData = this.selectedBranches.map(branchName => {
            const filteredChecklists = this.getFilteredChecklists(branchName);
            totalFilteredRecords += filteredChecklists.length;
            
            console.log(`📊 ${branchName} 필터링된 체크리스트:`, filteredChecklists.length, '건');
            
            // 실제 Firebase 데이터만 집계 (절대 임의 값 사용 안함)
            const stats = filteredChecklists.reduce((acc, c) => {
                // 카테고리 필터링 적용
                if (this.currentCategory === 'all' || this.currentCategory === 'reels') {
                    acc.reels += parseInt(c.instaReels) || 0;
                }
                if (this.currentCategory === 'all' || this.currentCategory === 'photos') {
                    acc.photos += parseInt(c.instaPhotos) || 0;
                }
                return acc;
            }, { reviews: 0, posts: 0, experience: 0, reels: 0, photos: 0 });

            const total = stats.reviews + stats.posts + stats.experience + stats.reels + stats.photos;
            const days = this.getDaysInPeriod();
            const dailyAverage = days > 0 ? Math.round((total / days) * 10) / 10 : 0;

            console.log(`📈 ${branchName} 실제 통계:`, stats, `총합: ${total}, 일평균: ${dailyAverage}, 레코드수: ${filteredChecklists.length}`);

            return {
                name: branchName,
                ...stats,
                total,
                dailyAverage,
                recordCount: filteredChecklists.length
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

        console.log('📊 최종 실제 비교 데이터:', { 
            총선택지점: this.selectedBranches.length,
            분석된레코드: totalFilteredRecords,
            상위지점: branchData[0]?.name,
            상위지점총합: branchData[0]?.total
        });

        return {
            branches: branchData,
            categoryWinners,
            totalSelected: this.selectedBranches.length,
            totalRecords: totalFilteredRecords
        };
    }

    // 필터링된 체크리스트 가져오기 (실제 Firebase 데이터)
    getFilteredChecklists(branchName) {
        console.log(`🔍 ${branchName} 체크리스트 필터링 시작`);
        
        // 지점명으로 필터링 (다양한 필드명 지원)
        let checklists = this.data.checklists.filter(c => {
            const branchMatch = c.branch === branchName || 
                               c.branchName === branchName ||
                               c.selectedBranch === branchName;
            
            if (!branchMatch && (c.branch || c.branchName || c.selectedBranch)) {
                console.log(`❌ 지점명 불일치: "${c.branch || c.branchName || c.selectedBranch}" !== "${branchName}"`);
            }
            return branchMatch;
        });
        
        console.log(`📍 ${branchName} 지점별 필터링 후:`, checklists.length, '건');
        
        // 기간 필터링
        const startDate = this.customStartDate;
        const endDate = this.customEndDate;

        if (startDate && endDate) {
            console.log(`📅 기간 필터링: ${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`);
            
            const filteredByDate = checklists.filter(c => {
                if (!c.date) {
                    console.log('⚠️ 날짜 정보가 없는 체크리스트:', c.id);
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

    // 차트 그리기 (중복 완전 방지)
    drawCharts(data) {
        // 기존 차트 완전 제거
        if (this.charts.comparisonChart && typeof this.charts.comparisonChart.destroy === 'function') {
            this.charts.comparisonChart.destroy();
            this.charts.comparisonChart = null;
        }
        if (this.charts.categoryChart && typeof this.charts.categoryChart.destroy === 'function') {
            this.charts.categoryChart.destroy();
            this.charts.categoryChart = null;
        }
        
        // 캔버스 요소 재생성
        this.recreateChartCanvases();
        
        // 새 차트 생성
        this.drawComparisonChart(data);
        this.drawCategoryChart(data);
    }

    // 캔버스 요소 재생성 (차트 중복 방지)
    recreateChartCanvases() {
        // 비교 차트 캔버스 재생성
        const comparisonContainer = document.querySelector('#comparisonChart')?.parentNode;
        if (comparisonContainer) {
            const oldComparisonCanvas = document.getElementById('comparisonChart');
            if (oldComparisonCanvas) {
                oldComparisonCanvas.remove();
            }
            const newComparisonCanvas = document.createElement('canvas');
            newComparisonCanvas.id = 'comparisonChart';
            comparisonContainer.appendChild(newComparisonCanvas);
        }

        // 카테고리 차트 캔버스 재생성
        const categoryContainer = document.querySelector('#categoryChart')?.parentNode;
        if (categoryContainer) {
            const oldCategoryCanvas = document.getElementById('categoryChart');
            if (oldCategoryCanvas) {
                oldCategoryCanvas.remove();
            }
            const newCategoryCanvas = document.createElement('canvas');
            newCategoryCanvas.id = 'categoryChart';
            categoryContainer.appendChild(newCategoryCanvas);
        }
    }

    // 비교 차트 그리기
    drawComparisonChart(data) {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) {
            console.warn('⚠️ comparisonChart 캔버스를 찾을 수 없습니다');
            return;
        }

        try {
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
            console.log('✅ 비교 차트 생성 완료');
        } catch (error) {
            console.error('❌ 비교 차트 생성 실패:', error);
        }
    }

    // 카테고리 차트 그리기
    drawCategoryChart(data) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) {
            console.warn('⚠️ categoryChart 캔버스를 찾을 수 없습니다');
            return;
        }

        try {
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
                                    const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                                    return `${context.label}: ${context.parsed}건 (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
            console.log('✅ 카테고리 차트 생성 완료');
        } catch (error) {
            console.error('❌ 카테고리 차트 생성 실패:', error);
        }
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

        const comparisonData = this.calculateRealComparisonData();
        
        // BOM 추가하여 한글 깨짐 방지
        let csvContent = "\ufeff순위,지점명,네이버리뷰,블로그포스팅,체험단,인스타릴스,인스타사진,총활동량,일평균활동량,분석기간,분석레코드수\n";
        
        comparisonData.branches.forEach((branch, index) => {
            csvContent += `${index + 1},${branch.name},${branch.reviews},${branch.posts},${branch.experience},${branch.reels},${branch.photos},${branch.total},${branch.dailyAverage},${this.getPeriodLabel()},${comparisonData.totalRecords}\n`;
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

// 전역 변수 초기화
window.currentCalendarDate = new Date();
window.selectedStartDate = null;
window.selectedEndDate = null;
window.isSelectingRange = false;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 지점 비교 페이지 초기화 시작');
    
    // ComparisonManager 생성 및 초기화
    if (!window.comparisonManager) {
        window.comparisonManager = new ComparisonManager();
        window.comparisonManager.initialize().catch(error => {
            console.error('❌ ComparisonManager 초기화 실패:', error);
        });
    }
});
console.log('✅ 비교 페이지 스크립트 로딩 완료');
