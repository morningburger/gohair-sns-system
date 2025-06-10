// UI 유틸리티 함수들

// 알림 표시 함수
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        ${type === 'success' ? 'background-color: #10b981;' : 
          type === 'error' ? 'background-color: #ef4444;' : 'background-color: #6366f1;'}
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 기간 필터링 함수
function filterDataByPeriod(data, period, startDate, endDate) {
    const now = new Date();
    let filterDate;

    switch(period) {
        case 'today':
            filterDate = now.toISOString().split('T')[0];
            return data.filter(d => d.date === filterDate);
        case 'week':
            filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return data.filter(d => new Date(d.date) >= filterDate);
        case 'month':
            filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
            return data.filter(d => new Date(d.date) >= filterDate);
        case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            filterDate = new Date(now.getFullYear(), quarter * 3, 1);
            return data.filter(d => new Date(d.date) >= filterDate);
        case 'custom':
            if (startDate && endDate) {
                return data.filter(d => d.date >= startDate && d.date <= endDate);
            }
            return data;
        case 'all':
        default:
            return data;
    }
}

// 모달 관리 함수들
const ModalManager = {
    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
};

// 디자이너 모달 관리
function showAddDesigner() {
    if (window.loadBranchOptions) {
        window.loadBranchOptions();
    }
    ModalManager.show('addDesignerModal');
}

function hideAddDesigner() {
    ModalManager.hide('addDesignerModal');
    ModalManager.resetForm('addDesignerForm');
}

function showEditDesigner(designer) {
    if (window.loadBranchOptions) {
        window.loadBranchOptions();
    }
    
    document.getElementById('editDesignerId').value = designer.docId;
    document.getElementById('editDesignerName').value = designer.name;
    document.getElementById('editDesignerBranch').value = designer.branch;
    document.getElementById('editDesignerPosition').value = designer.position;
    document.getElementById('editDesignerPhone').value = designer.phone;
    
    ModalManager.show('editDesignerModal');
}

function hideEditDesigner() {
    ModalManager.hide('editDesignerModal');
    ModalManager.resetForm('editDesignerForm');
}

// 지점 모달 관리
function showAddBranch() {
    ModalManager.show('addBranchModal');
}

function hideAddBranch() {
    ModalManager.hide('addBranchModal');
    ModalManager.resetForm('addBranchForm');
}

function showEditBranch(branch) {
    document.getElementById('editBranchId').value = branch.docId;
    document.getElementById('editBranchName').value = branch.name;
    document.getElementById('editBranchCode').value = branch.code;
    document.getElementById('editBranchAddress').value = branch.address;
    
    ModalManager.show('editBranchModal');
}

function hideEditBranch() {
    ModalManager.hide('editBranchModal');
    ModalManager.resetForm('editBranchForm');
}

// 편집/삭제 함수들
function editBranch(docId) {
    const branch = window.cachedData.branches.find(b => b.docId === docId);
    if (branch) {
        showEditBranch(branch);
    }
}

function editDesigner(docId) {
    const designer = window.cachedData.designers.find(d => d.docId === docId);
    if (designer) {
        showEditDesigner(designer);
    }
}

async function deleteDesigner(docId) {
    if (confirm('정말로 이 디자이너를 삭제하시겠습니까?')) {
        try {
            await window.dataManager.deleteDesigner(docId);
            showNotification('디자이너가 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('디자이너 삭제 오류:', error);
            showNotification('디자이너 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

async function deleteBranch(docId) {
    const branch = window.cachedData.branches.find(b => b.docId === docId);
    if (confirm(`정말로 "${branch.name}" 지점을 삭제하시겠습니까?\n관련된 모든 디자이너와 체크리스트도 함께 삭제됩니다.`)) {
        try {
            await window.dataManager.deleteBranch(docId);
            showNotification('지점이 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('지점 삭제 오류:', error);
            showNotification('지점 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 데이터 내보내기/가져오기
function exportData() {
    const data = {
        branches: window.cachedData.branches,
        designers: window.cachedData.designers,
        checklists: window.cachedData.checklists
    };
    
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gohair_firebase_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('데이터가 성공적으로 내보내기 되었습니다.', 'success');
}

function importData() {
    document.getElementById('fileInput').click();
}

// 파일 입력 이벤트 설정
function setupFileImport() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        // Firebase 가져오기 로직 구현 예정
                        showNotification('데이터 가져오기 기능은 추후 업데이트 예정입니다.', 'info');
                    } catch (error) {
                        showNotification('데이터 가져오기에 실패했습니다.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
}

// 날짜 관련 유틸리티
const DateUtils = {
    today() {
        return new Date().toISOString().split('T')[0];
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('ko-KR');
    },

    getWeekStart(date = new Date()) {
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        return monday.toISOString().split('T')[0];
    },

    getMonthStart(date = new Date()) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    }
};

// 전역으로 노출
window.showNotification = showNotification;
window.filterDataByPeriod = filterDataByPeriod;
window.ModalManager = ModalManager;
window.showAddDesigner = showAddDesigner;
window.hideAddDesigner = hideAddDesigner;
window.showEditDesigner = showEditDesigner;
window.hideEditDesigner = hideEditDesigner;
window.showAddBranch = showAddBranch;
window.hideAddBranch = hideAddBranch;
window.showEditBranch = showEditBranch;
window.hideEditBranch = hideEditBranch;
window.editBranch = editBranch;
window.editDesigner = editDesigner;
window.deleteDesigner = deleteDesigner;
window.deleteBranch = deleteBranch;
window.exportData = exportData;
window.importData = importData;
window.setupFileImport = setupFileImport;
window.DateUtils = DateUtils;

console.log('UI 유틸리티 모듈 로딩 완료');