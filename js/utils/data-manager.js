// Firebase 데이터 관리 클래스 (CDN 호환)
class FirebaseDataManager {
    constructor() {
        this.collections = {
            users: 'users',
            branches: 'branches',
            designers: 'designers',
            checklists: 'checklists'
        };
        this.initializeDefaultData();
    }

    async initializeDefaultData() {
        try {
            // 기본 관리자 계정 확인 및 생성
            const adminDoc = await window.db.collection(this.collections.users).doc('admin@gohair.com').get();
            
            if (!adminDoc.exists) {
                await this.createDefaultData();
            }
        } catch (error) {
            console.error('기본 데이터 초기화 오류:', error);
        }
    }

    async createDefaultData() {
        const defaultUsers = {
            'admin@gohair.com': { 
                password: 'GoHair2024!', 
                role: '전체관리자', // 역할명 통일
                name: '전체관리자',
                email: 'admin@gohair.com',
                phone: '010-0000-0000',
                status: 'active',
                createdAt: '2024-01-01',
                branch: null,
                branchCode: null
            },
            'songdo@gohair.com': { 
                password: 'Songdo123!', 
                role: '지점관리자', // 역할명 통일
                branch: '송도1지점',
                branchCode: 'SD01',
                name: '송도관리자',
                email: 'songdo@gohair.com',
                phone: '010-1111-1111',
                status: 'active',
                createdAt: '2024-01-01'
            },
            'geomdan@gohair.com': { 
                password: 'Geomdan123!', 
                role: '지점관리자', // 역할명 통일
                branch: '검단테라스점',
                branchCode: 'GD01', 
                name: '검단관리자',
                email: 'geomdan@gohair.com',
                phone: '010-2222-2222',
                status: 'active',
                createdAt: '2024-01-01'
            },
            'bupyeong@gohair.com': { 
                password: 'Bupyeong123!', 
                role: '지점관리자', // 역할명 통일
                branch: '부평점',
                branchCode: 'BP01',
                name: '부평관리자',
                email: 'bupyeong@gohair.com', 
                phone: '010-3333-3333',
                status: 'active',
                createdAt: '2024-01-01'
            }
        };

        const defaultBranches = [
            { id: 1, name: '송도1지점', code: 'SD01', address: '인천시 연수구 송도동', createdAt: '2024-01-01' },
            { id: 2, name: '검단테라스점', code: 'GD01', address: '인천시 서구 검단동', createdAt: '2024-01-01' },
            { id: 3, name: '부평점', code: 'BP01', address: '인천시 부평구 부평동', createdAt: '2024-01-01' }
        ];

        const defaultDesigners = [
            { id: 1, name: '김디자이너', branch: '송도1지점', position: '디자이너', phone: '010-1234-5678', createdAt: '2024-01-15' },
            { id: 2, name: '이실장', branch: '검단테라스점', position: '실장', phone: '010-2345-6789', createdAt: '2024-01-10' },
            { id: 3, name: '박팀장', branch: '부평점', position: '팀장', phone: '010-3456-7890', createdAt: '2024-01-20' }
        ];

        try {
            // 사용자 데이터 생성
            for (const [email, userData] of Object.entries(defaultUsers)) {
                await window.db.collection(this.collections.users).doc(email).set(userData);
            }

            // 지점 데이터 생성
            for (const branch of defaultBranches) {
                await window.db.collection(this.collections.branches).add(branch);
            }

            // 디자이너 데이터 생성
            for (const designer of defaultDesigners) {
                await window.db.collection(this.collections.designers).add(designer);
            }

            console.log('기본 데이터 생성 완료');
        } catch (error) {
            console.error('기본 데이터 생성 오류:', error);
        }
    }

    // 사용자 관련 메서드
    async getUser(email) {
        try {
            const userDoc = await window.db.collection(this.collections.users).doc(email).get();
            return userDoc.exists ? userDoc.data() : null;
        } catch (error) {
            console.error('사용자 조회 오류:', error);
            return null;
        }
    }

    async addUser(email, userData) {
        try {
            await window.db.collection(this.collections.users).doc(email).set(userData);
            return userData;
        } catch (error) {
            console.error('사용자 추가 오류:', error);
            throw error;
        }
    }

    // 모든 사용자 조회 (users.html에서 사용)
    async getUsers() {
        try {
            const querySnapshot = await window.db.collection(this.collections.users).get();
            return querySnapshot.docs.map(doc => ({ 
                docId: doc.id, 
                email: doc.id, // 문서 ID가 이메일
                ...doc.data() 
            }));
        } catch (error) {
            console.error('사용자 목록 조회 오류:', error);
            return [];
        }
    }

    // 사용자 수정
    async updateUser(email, userData) {
        try {
            await window.db.collection(this.collections.users).doc(email).update(userData);
            return userData;
        } catch (error) {
            console.error('사용자 수정 오류:', error);
            throw error;
        }
    }

    // 사용자 삭제
    async deleteUser(email) {
        try {
            await window.db.collection(this.collections.users).doc(email).delete();
        } catch (error) {
            console.error('사용자 삭제 오류:', error);
            throw error;
        }
    }

    // 지점 관련 메서드
    async getBranches() {
        try {
            const querySnapshot = await window.db.collection(this.collections.branches).get();
            return querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('지점 조회 오류:', error);
            return [];
        }
    }

    async addBranch(branchData) {
        try {
            const docRef = await window.db.collection(this.collections.branches).add({
                ...branchData, 
                createdAt: new Date().toISOString().split('T')[0]
            });
            return { docId: docRef.id, ...branchData };
        } catch (error) {
            console.error('지점 추가 오류:', error);
            throw error;
        }
    }

    async updateBranch(docId, branchData) {
        try {
            await window.db.collection(this.collections.branches).doc(docId).update(branchData);
            return branchData;
        } catch (error) {
            console.error('지점 수정 오류:', error);
            throw error;
        }
    }

    async deleteBranch(docId) {
        try {
            await window.db.collection(this.collections.branches).doc(docId).delete();
        } catch (error) {
            console.error('지점 삭제 오류:', error);
            throw error;
        }
    }

    // 디자이너 관련 메서드
    async getDesigners() {
        try {
            const querySnapshot = await window.db.collection(this.collections.designers).get();
            return querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('디자이너 조회 오류:', error);
            return [];
        }
    }

    async addDesigner(designerData) {
        try {
            const docRef = await window.db.collection(this.collections.designers).add({
                ...designerData, 
                createdAt: new Date().toISOString().split('T')[0]
            });
            return { docId: docRef.id, ...designerData };
        } catch (error) {
            console.error('디자이너 추가 오류:', error);
            throw error;
        }
    }

    async updateDesigner(docId, designerData) {
        try {
            await window.db.collection(this.collections.designers).doc(docId).update(designerData);
            return designerData;
        } catch (error) {
            console.error('디자이너 수정 오류:', error);
            throw error;
        }
    }

    async deleteDesigner(docId) {
        try {
            await window.db.collection(this.collections.designers).doc(docId).delete();
        } catch (error) {
            console.error('디자이너 삭제 오류:', error);
            throw error;
        }
    }

// 수정된 getChecklists() 함수
async getChecklists() {
    try {
        const querySnapshot = await window.db.collection(this.collections.checklists).get();
        return querySnapshot.docs
            .map(doc => ({ docId: doc.id, ...doc.data() }))
            .filter(item => item.deleted !== true);
    } catch (error) {
        console.error('체크리스트 조회 오류:', error);
        return [];
    }
}

    async addChecklist(checklistData) {
        try {
            const docRef = await window.db.collection(this.collections.checklists).add(checklistData);
            return { docId: docRef.id, ...checklistData };
        } catch (error) {
            console.error('체크리스트 추가 오류:', error);
            throw error;
        }
    }
async updateChecklist(docId, checklistData) {
    try {
        await window.db.collection(this.collections.checklists).doc(docId).update(checklistData);
        return checklistData;
    } catch (error) {
        console.error('체크리스트 수정 오류:', error);
        throw error;
    }
}

async deleteChecklist(docId) {
    try {
        await window.db.collection(this.collections.checklists).doc(docId).update({
            deleted: true,
            deletedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('체크리스트 삭제 오류:', error);
        throw error;
    }
}
    // 실시간 데이터 동기화 (현재는 미사용이지만 향후 확장용)
    onBranchesChange(callback) {
        return window.db.collection(this.collections.branches).onSnapshot((snapshot) => {
            const branches = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            callback(branches);
        });
    }

    onDesignersChange(callback) {
        return window.db.collection(this.collections.designers).onSnapshot((snapshot) => {
            const designers = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            callback(designers);
        });
    }

// 실시간 데이터 동기화 - 삭제된 데이터 필터링 추가
onChecklistsChange(callback) {
    return window.db.collection(this.collections.checklists).onSnapshot((snapshot) => {
        // 모든 데이터를 가져와서 삭제된 것 제외
        const allChecklists = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        const activeChecklists = allChecklists.filter(item => item.deleted !== true);
        
        console.log(`🔄 실시간 체크리스트 업데이트: 전체 ${allChecklists.length}건, 활성 ${activeChecklists.length}건`);
        
        callback(activeChecklists);
    });
}

    onUsersChange(callback) {
        return window.db.collection(this.collections.users).onSnapshot((snapshot) => {
            const users = snapshot.docs.map(doc => ({ 
                docId: doc.id, 
                email: doc.id,
                ...doc.data() 
            }));
            callback(users);
        });
    }
}

// 전역으로 노출
window.FirebaseDataManager = FirebaseDataManager;

console.log('데이터 관리자 모듈 로딩 완료');
