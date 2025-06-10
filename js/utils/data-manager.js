// Firebase 데이터 관리 클래스
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
            const adminDoc = await window.firestoreFunctions.getDoc(
                window.firestoreFunctions.doc(window.db, this.collections.users, 'admin@gohair.com')
            );
            
            if (!adminDoc.exists()) {
                await this.createDefaultData();
            }
        } catch (error) {
            console.error('기본 데이터 초기화 오류:', error);
        }
    }

    async createDefaultData() {
        const defaultUsers = {
            'admin@gohair.com': { password: 'GoHair2024!', role: 'admin', name: '관리자' },
            'songdo@gohair.com': { password: 'Songdo123!', role: 'leader', branch: '송도1지점', name: '송도리더' },
            'geomdan@gohair.com': { password: 'Geomdan123!', role: 'leader', branch: '검단테라스점', name: '검단리더' },
            'bupyeong@gohair.com': { password: 'Bupyeong123!', role: 'leader', branch: '부평점', name: '부평리더' }
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
                await window.firestoreFunctions.setDoc(
                    window.firestoreFunctions.doc(window.db, this.collections.users, email),
                    userData
                );
            }

            // 지점 데이터 생성
            for (const branch of defaultBranches) {
                await window.firestoreFunctions.addDoc(
                    window.firestoreFunctions.collection(window.db, this.collections.branches),
                    branch
                );
            }

            // 디자이너 데이터 생성
            for (const designer of defaultDesigners) {
                await window.firestoreFunctions.addDoc(
                    window.firestoreFunctions.collection(window.db, this.collections.designers),
                    designer
                );
            }

            console.log('기본 데이터 생성 완료');
        } catch (error) {
            console.error('기본 데이터 생성 오류:', error);
        }
    }

    // 사용자 관련 메서드
    async getUser(email) {
        try {
            const userDoc = await window.firestoreFunctions.getDoc(
                window.firestoreFunctions.doc(window.db, this.collections.users, email)
            );
            return userDoc.exists() ? userDoc.data() : null;
        } catch (error) {
            console.error('사용자 조회 오류:', error);
            return null;
        }
    }

    async addUser(email, userData) {
        try {
            await window.firestoreFunctions.setDoc(
                window.firestoreFunctions.doc(window.db, this.collections.users, email),
                userData
            );
            return userData;
        } catch (error) {
            console.error('사용자 추가 오류:', error);
            throw error;
        }
    }

    // 지점 관련 메서드
    async getBranches() {
        try {
            const querySnapshot = await window.firestoreFunctions.getDocs(
                window.firestoreFunctions.collection(window.db, this.collections.branches)
            );
            return querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('지점 조회 오류:', error);
            return [];
        }
    }

    async addBranch(branchData) {
        try {
            const docRef = await window.firestoreFunctions.addDoc(
                window.firestoreFunctions.collection(window.db, this.collections.branches),
                { ...branchData, createdAt: new Date().toISOString().split('T')[0] }
            );
            return { docId: docRef.id, ...branchData };
        } catch (error) {
            console.error('지점 추가 오류:', error);
            throw error;
        }
    }

    async updateBranch(docId, branchData) {
        try {
            await window.firestoreFunctions.updateDoc(
                window.firestoreFunctions.doc(window.db, this.collections.branches, docId),
                branchData
            );
            return branchData;
        } catch (error) {
            console.error('지점 수정 오류:', error);
            throw error;
        }
    }

    async deleteBranch(docId) {
        try {
            await window.firestoreFunctions.deleteDoc(
                window.firestoreFunctions.doc(window.db, this.collections.branches, docId)
            );
        } catch (error) {
            console.error('지점 삭제 오류:', error);
            throw error;
        }
    }

    // 디자이너 관련 메서드
    async getDesigners() {
        try {
            const querySnapshot = await window.firestoreFunctions.getDocs(
                window.firestoreFunctions.collection(window.db, this.collections.designers)
            );
            return querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('디자이너 조회 오류:', error);
            return [];
        }
    }

    async addDesigner(designerData) {
        try {
            const docRef = await window.firestoreFunctions.addDoc(
                window.firestoreFunctions.collection(window.db, this.collections.designers),
                { ...designerData, createdAt: new Date().toISOString().split('T')[0] }
            );
            return { docId: docRef.id, ...designerData };
        } catch (error) {
            console.error('디자이너 추가 오류:', error);
            throw error;
        }
    }

    async updateDesigner(docId, designerData) {
        try {
            await window.firestoreFunctions.updateDoc(
                window.firestoreFunctions.doc(window.db, this.collections.designers, docId),
                designerData
            );
            return designerData;
        } catch (error) {
            console.error('디자이너 수정 오류:', error);
            throw error;
        }
    }

    async deleteDesigner(docId) {
        try {
            await window.firestoreFunctions.deleteDoc(
                window.firestoreFunctions.doc(window.db, this.collections.designers, docId)
            );
        } catch (error) {
            console.error('디자이너 삭제 오류:', error);
            throw error;
        }
    }

    // 체크리스트 관련 메서드
    async getChecklists() {
        try {
            const querySnapshot = await window.firestoreFunctions.getDocs(
                window.firestoreFunctions.collection(window.db, this.collections.checklists)
            );
            return querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('체크리스트 조회 오류:', error);
            return [];
        }
    }

    async addChecklist(checklistData) {
        try {
            const docRef = await window.firestoreFunctions.addDoc(
                window.firestoreFunctions.collection(window.db, this.collections.checklists),
                checklistData
            );
            return { docId: docRef.id, ...checklistData };
        } catch (error) {
            console.error('체크리스트 추가 오류:', error);
            throw error;
        }
    }

    // 실시간 데이터 동기화
    onBranchesChange(callback) {
        return window.firestoreFunctions.onSnapshot(
            window.firestoreFunctions.collection(window.db, this.collections.branches),
            (snapshot) => {
                const branches = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
                callback(branches);
            }
        );
    }

    onDesignersChange(callback) {
        return window.firestoreFunctions.onSnapshot(
            window.firestoreFunctions.collection(window.db, this.collections.designers),
            (snapshot) => {
                const designers = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
                callback(designers);
            }
        );
    }

    onChecklistsChange(callback) {
        return window.firestoreFunctions.onSnapshot(
            window.firestoreFunctions.collection(window.db, this.collections.checklists),
            (snapshot) => {
                const checklists = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
                callback(checklists);
            }
        );
    }
}

// 전역으로 노출
window.FirebaseDataManager = FirebaseDataManager;

console.log('데이터 관리자 모듈 로딩 완료');