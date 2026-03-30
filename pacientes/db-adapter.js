// =====================================================
// EQUILIBRIUM NEURO - DATABASE ADAPTER
// Adaptador que funciona com localStorage e Firebase
// =====================================================

class DatabaseAdapter {
    constructor() {
        this.useFirebase = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            this.useFirebase = true;
            console.log('🔥 Usando Firebase Firestore');
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
            });
        } else {
            this.useFirebase = false;
            console.log('💾 Usando localStorage');
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        }
    }

    getCurrentUser() {
        if (this.useFirebase && firebase.auth().currentUser) {
            return firebase.auth().currentUser;
        }
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            return JSON.parse(savedUser);
        }
        const defaultUser = {
            uid: 'local-user-' + Date.now(),
            email: 'usuario@equilibrium.com',
            displayName: 'Usuário Local'
        };
        localStorage.setItem('currentUser', JSON.stringify(defaultUser));
        return defaultUser;
    }

    async getPatients(filters = {}) {
        if (this.useFirebase) {
            return await this._getPatients_Firebase(filters);
        } else {
            return this._getPatients_LocalStorage(filters);
        }
    }

    async getPatient(patientId) {
        if (this.useFirebase) {
            return await this._getPatient_Firebase(patientId);
        } else {
            return this._getPatient_LocalStorage(patientId);
        }
    }

    async createPatient(patientData) {
        if (this.useFirebase) {
            return await this._createPatient_Firebase(patientData);
        } else {
            return this._createPatient_LocalStorage(patientData);
        }
    }

    async updatePatient(patientId, patientData) {
        if (this.useFirebase) {
            return await this._updatePatient_Firebase(patientId, patientData);
        } else {
            return this._updatePatient_LocalStorage(patientId, patientData);
        }
    }

    async deletePatient(patientId) {
        if (this.useFirebase) {
            return await this._deletePatient_Firebase(patientId);
        } else {
            return this._deletePatient_LocalStorage(patientId);
        }
    }

    _getPatients_LocalStorage(filters = {}) {
        const patientsKey = 'equilibrium_patients';
        const patientsData = localStorage.getItem(patientsKey);
        let patients = patientsData ? JSON.parse(patientsData) : [];
        const user = this.getCurrentUser();
        patients = patients.filter(p => p.userId === user.uid);
        if (filters.status && filters.status !== 'all') {
            patients = patients.filter(p => p.status === filters.status);
        }
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            patients = patients.filter(p => 
                (p.fullName && p.fullName.toLowerCase().includes(searchTerm)) ||
                (p.cpf && p.cpf.includes(searchTerm)) ||
                (p.phone && p.phone.includes(searchTerm)) ||
                (p.mobile && p.mobile.includes(searchTerm))
            );
        }
        return patients;
    }

    _getPatient_LocalStorage(patientId) {
        const patients = this._getPatients_LocalStorage();
        return patients.find(p => p.id === patientId);
    }

    _createPatient_LocalStorage(patientData) {
        const patientsKey = 'equilibrium_patients';
        const patientsData = localStorage.getItem(patientsKey);
        const patients = patientsData ? JSON.parse(patientsData) : [];
        const user = this.getCurrentUser();
        const newPatient = {
            id: 'patient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: user.uid,
            ...patientData,
            status: patientData.status || 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        patients.push(newPatient);
        localStorage.setItem(patientsKey, JSON.stringify(patients));
        return newPatient.id;
    }

    _updatePatient_LocalStorage(patientId, patientData) {
        const patientsKey = 'equilibrium_patients';
        const patientsData = localStorage.getItem(patientsKey);
        const patients = patientsData ? JSON.parse(patientsData) : [];
        const index = patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
            patients[index] = {
                ...patients[index],
                ...patientData,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(patientsKey, JSON.stringify(patients));
            return true;
        }
        return false;
    }

    _deletePatient_LocalStorage(patientId) {
        const patientsKey = 'equilibrium_patients';
        const patientsData = localStorage.getItem(patientsKey);
        const patients = patientsData ? JSON.parse(patientsData) : [];
        const index = patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
            patients[index].status = 'inactive';
            patients[index].updatedAt = new Date().toISOString();
            localStorage.setItem(patientsKey, JSON.stringify(patients));
            return true;
        }
        return false;
    }

    async _getPatients_Firebase(filters = {}) {
        const db = firebase.firestore();
        const user = firebase.auth().currentUser;
        let query = db.collection('patients').where('userId', '==', user.uid);
        if (filters.status && filters.status !== 'all') {
            query = query.where('status', '==', filters.status);
        }
        query = query.orderBy('createdAt', 'desc');
        const snapshot = await query.get();
        let patients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            patients = patients.filter(p => 
                (p.fullName && p.fullName.toLowerCase().includes(searchTerm)) ||
                (p.cpf && p.cpf.includes(searchTerm)) ||
                (p.phone && p.phone.includes(searchTerm)) ||
                (p.mobile && p.mobile.includes(searchTerm))
            );
        }
        return patients;
    }

    async _getPatient_Firebase(patientId) {
        const db = firebase.firestore();
        const doc = await db.collection('patients').doc(patientId).get();
        if (!doc.exists) {
            throw new Error('Paciente não encontrado');
        }
        return {
            id: doc.id,
            ...doc.data()
        };
    }

    async _createPatient_Firebase(patientData) {
        const db = firebase.firestore();
        const user = firebase.auth().currentUser;
        const patient = {
            userId: user.uid,
            ...patientData,
            status: patientData.status || 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection('patients').add(patient);
        return docRef.id;
    }

    async _updatePatient_Firebase(patientId, patientData) {
        const db = firebase.firestore();
        await db.collection('patients').doc(patientId).update({
            ...patientData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    }

    async _deletePatient_Firebase(patientId) {
        const db = firebase.firestore();
        await db.collection('patients').doc(patientId).update({
            status: 'inactive',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    }

    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (parseInt(cpf.charAt(9)) !== digit) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (parseInt(cpf.charAt(10)) !== digit) return false;
        return true;
    }
}

window.dbAdapter = new DatabaseAdapter();
