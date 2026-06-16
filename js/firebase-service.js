// Firebase Firestore & Auth Service (Compat mode for file:/// support)
// Configures Firestore collections, auth events, progress syncing and admin approvals.

let db = null;
let auth = null;
let useFallback = true;

// -------------------------------------------------------------
// 1. DYNAMIC SVG INITIALS AVATAR GENERATOR
// -------------------------------------------------------------
const getInitialsAvatar = (name) => {
    return (name || "?").trim().charAt(0).toUpperCase();
};

// Initialize Firebase using compat globals
try {
    if (window.firebase && window.isConfigured && window.isConfigured()) {
        window.firebase.initializeApp(window.APP_CONFIG.firebase);
        db = window.firebase.firestore();
        auth = window.firebase.auth();
        useFallback = false;
        console.log("Firebase initialized successfully using compat libraries.");
    } else {
        console.warn("Firebase credentials not configured or script missing. Falling back to local mock storage.");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
    console.warn("Falling back to local mock storage.");
}

// --- UNIQUE DEVICE ID & CONCURRENT SESSION PREVENTION ---
let deviceSessionListener = null;

const getOrCreateDeviceId = () => {
    let devId = localStorage.getItem('mca_device_id');
    if (!devId) {
        devId = 'device-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('mca_device_id', devId);
    }
    return devId;
};

const startDeviceSessionCheck = (uid) => {
    if (deviceSessionListener) return;
    const localDevId = getOrCreateDeviceId();
    
    if (!useFallback && db) {
        deviceSessionListener = db.collection("users").doc(uid).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.currentDeviceId && data.currentDeviceId !== localDevId) {
                    const overlay = document.createElement('div');
                    overlay.className = "fixed inset-0 bg-[#021541]/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4";
                    overlay.innerHTML = `
                        <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                            <span class="material-symbols-outlined text-error text-6xl mb-4">gpp_maybe</span>
                            <h2 class="text-2xl font-bold text-primary mb-2">Session Terminated</h2>
                            <p class="text-sm text-on-surface-variant mb-6">Your account was logged in from another device. For security reasons, this session has been terminated.</p>
                            <button id="concurrent-logout-btn" class="bg-primary hover:bg-[#1a2b56] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-all block w-full">Return to Home</button>
                        </div>
                    `;
                    document.body.appendChild(overlay);
                    document.getElementById('concurrent-logout-btn').addEventListener('click', () => {
                        window.FirebaseService.logout().then(() => window.location.href = "index.html");
                    });
                }
            }
        }, err => {
            console.error("Device session listener error:", err);
        });
    } else {
        // Fallback mock check
        deviceSessionListener = setInterval(() => {
            const users = JSON.parse(localStorage.getItem('mca_users') || '[]');
            const user = users.find(u => u.uid === uid);
            if (user && user.currentDeviceId && user.currentDeviceId !== localDevId) {
                const overlay = document.createElement('div');
                overlay.className = "fixed inset-0 bg-[#021541]/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4";
                overlay.innerHTML = `
                    <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                        <span class="material-symbols-outlined text-error text-6xl mb-4">gpp_maybe</span>
                        <h2 class="text-2xl font-bold text-primary mb-2">Session Terminated</h2>
                        <p class="text-sm text-on-surface-variant mb-6">Your account was logged in from another device. For security reasons, this session has been terminated.</p>
                        <button id="concurrent-logout-btn-mock" class="bg-primary hover:bg-[#1a2b56] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-all block w-full">Return to Home</button>
                    </div>
                `;
                document.body.appendChild(overlay);
                document.getElementById('concurrent-logout-btn-mock').addEventListener('click', () => {
                    window.FirebaseService.logout().then(() => window.location.href = "index.html");
                });
                clearInterval(deviceSessionListener);
            }
        }, 3000);
    }
};

// -------------------------------------------------------------
// 2. LOCAL STORAGE MOCK SEED & FALLBACK HELPERS
// -------------------------------------------------------------
const getLocalData = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const saveLocalData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Bump this version string whenever seed data roles/structure change.
// Any mismatch with the stored version wipes and re-seeds all mock data.
const SEED_VERSION = "v2.1-roles";

const clearAndReseed = () => {
    const stored = localStorage.getItem('mca_seed_version');
    if (stored !== SEED_VERSION) {
        console.log(`[Seed] Version mismatch (${stored} → ${SEED_VERSION}). Clearing mock data.`);
        const keysToReset = [
            'mca_admin', 'mca_users', 'mca_courses', 'mca_modules',
            'mca_topics', 'mca_lessons', 'mca_payments', 'mca_mocktests',
            'mca_enrollments', 'mca_activities', 'mca_notifications',
            'mca_progress', 'mca_mock_attempts'
        ];
        keysToReset.forEach(k => localStorage.removeItem(k));
        // Clear current session so stale roles are not reused
        localStorage.removeItem('mca_current_user');
        localStorage.setItem('mca_seed_version', SEED_VERSION);
    }
};

const seedMockData = () => {
    // ----------------------------------------------------------
    // Seed admin list — determines who gets 'admin' role on login
    // ----------------------------------------------------------
    if (getLocalData('mca_admin').length === 0) {
        saveLocalData('mca_admin', [
            { email: "admin@gmail.com", name: "Sourav Shaji" }
        ]);
    }

    // Seed initial users
    if (getLocalData('mca_users').length === 0) {
        saveLocalData('mca_users', [
            {
                uid: "admin-1",
                name: "Sourav Shaji",
                email: "admin@gmail.com",
                role: "admin",
                profileImage: getInitialsAvatar("Sourav Shaji"),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
            },
            {
                uid: "student-1",
                name: "MCA Ace Student",
                email: "admin@mcaace.com",
                role: "student",
                profileImage: getInitialsAvatar("MCA Ace Student"),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
            }
        ]);
    }
    
    // Seed initial courses
    if (getLocalData('mca_courses').length === 0) {
        saveLocalData('mca_courses', [
            {
                id: "course-nimcet",
                title: "NIMCET Complete Mastery 2025",
                slug: "nimcet-mastery",
                description: "The most comprehensive guide to cracking India's top MCA entrance exam. Includes live classes, 500+ mock tests, and personal mentoring.",
                thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuALEXXXyISFGFvWY4LYQ1SR0f0gOi5QEAwsF0jldhvdJjfDP3WyUk59MI9enbNc0LgvUAs_Rz736Vq1dc2mBRDj499nGvpbwmL3AEvzPPVPtH0upBva9o5wPN4dYf-j62VG1sQeuhBFQzyTvqM0XAV1-wmxgDoEThz1rXaIhN2lcGVodFwMzBmkA3j2NiEMfdxQ_x_ORdD94kTlPeMsAVQn6trDrzPE6k9-YxuvKMDXwEQ3zPTq3oI-CQwO0y9ioFQj3lNphSxaSf18",
                bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuALEXXXyISFGFvWY4LYQ1SR0f0gOi5QEAwsF0jldhvdJjfDP3WyUk59MI9enbNc0LgvUAs_Rz736Vq1dc2mBRDj499nGvpbwmL3AEvzPPVPtH0upBva9o5wPN4dYf-j62VG1sQeuhBFQzyTvqM0XAV1-wmxgDoEThz1rXaIhN2lcGVodFwMzBmkA3j2NiEMfdxQ_x_ORdD94kTlPeMsAVQn6trDrzPE6k9-YxuvKMDXwEQ3zPTq3oI-CQwO0y9ioFQj3lNphSxaSf18",
                price: 8999,
                discountPrice: 4999,
                category: "MCA Entrance",
                tags: ["NIMCET", "Math", "Logic"],
                isPublished: true,
                isDeleted: false,
                totalModules: 3,
                totalLessons: 6,
                createdAt: new Date().toISOString()
            },
            {
                id: "course-placement",
                title: "Placement Preparation Program",
                slug: "placement-prep",
                description: "A comprehensive 6-month career track designed to help MCA students crack placements at Tier-1 tech companies. Covers DSA, System Design, and Aptitude.",
                thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPB_Wuu4-i7gEvTQtlPHVYD5pu8Bd_0U7CxDziHl8QqXOFF9-R0axU19EITsUZEhl5YvWRycWg3Wi2samP0H6k0rRH5Ljob4GL50x8w7dQnIXaHLfdiFXwICoDSk8Evff8hb4f-LIFpZOyT8_dpQypNLnmaxpW4hupPd-auS2ypi6ubiHz-yURMYxBzVG23xfdSMEYbusD4IdQM7TkmyfcP4I6dF8KZiJVD6-mkJK82NRGHjDggxpBbI2LYYVTBAhZXgm7OLndxLBt",
                bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPB_Wuu4-i7gEvTQtlPHVYD5pu8Bd_0U7CxDziHl8QqXOFF9-R0axU19EITsUZEhl5YvWRycWg3Wi2samP0H6k0rRH5Ljob4GL50x8w7dQnIXaHLfdiFXwICoDSk8Evff8hb4f-LIFpZOyT8_dpQypNLnmaxpW4hupPd-auS2ypi6ubiHz-yURMYxBzVG23xfdSMEYbusD4IdQM7TkmyfcP4I6dF8KZiJVD6-mkJK82NRGHjDggxpBbI2LYYVTBAhZXgm7OLndxLBt",
                price: 12499,
                discountPrice: 7499,
                category: "Placement Preparation",
                tags: ["DSA", "System Design", "Aptitude"],
                isPublished: true,
                isDeleted: false,
                totalModules: 3,
                totalLessons: 6,
                createdAt: new Date().toISOString()
            }
        ]);
    }
    
    // Seed curriculum: Modules, Topics, Lessons
    if (getLocalData('mca_modules').length === 0) {
        saveLocalData('mca_modules', [
            { id: "mod-1", courseId: "course-placement", title: "Mathematics & Logic Foundations", order: 1 },
            { id: "mod-2", courseId: "course-placement", title: "Advanced Data Structures", order: 2 },
            { id: "mod-3", courseId: "course-placement", title: "Dynamic Programming", order: 3 },
            { id: "mod-nimcet-1", courseId: "course-nimcet", title: "Trigonometry & Algebra", order: 1 }
        ]);
        
        saveLocalData('mca_topics', [
            { id: "top-1", courseId: "course-placement", moduleId: "mod-1", title: "Permutations & Combinations Basics", order: 1 },
            { id: "top-2", courseId: "course-placement", moduleId: "mod-2", title: "Binary Trees & AVL Trees", order: 1 },
            { id: "top-3", courseId: "course-placement", moduleId: "mod-3", title: "DP Patterns", order: 1 }
        ]);
        
        saveLocalData('mca_lessons', [
            {
                id: "les-1",
                courseId: "course-placement",
                moduleId: "mod-1",
                topicId: "top-1",
                title: "Introduction to P&C Formulae",
                description: "Fundamental counting principles, permutations versus combinations details.",
                youtubeVideoId: "L-M1zD2E1j0", // Sample video ID
                youtubeUrl: "https://www.youtube.com/watch?v=L-M1zD2E1j0",
                durationSeconds: 900,
                isFreePreview: true,
                resources: ["https://res.cloudinary.com/demo/image/upload/sample_pdf.pdf"],
                order: 1
            },
            {
                id: "les-2",
                courseId: "course-placement",
                moduleId: "mod-2",
                topicId: "top-2",
                title: "AVL Trees Balancing Rotations",
                description: "Learn LL, RR, LR, RL tree rotations dynamically.",
                youtubeVideoId: "FNeL18KsWPc",
                youtubeUrl: "https://www.youtube.com/watch?v=FNeL18KsWPc",
                durationSeconds: 1200,
                isFreePreview: false,
                resources: [],
                order: 1
            }
        ]);
    }
    
    // Seed sample payment request
    if (getLocalData('mca_payments').length === 0) {
        saveLocalData('mca_payments', [
            {
                id: "req-1",
                userId: "student-1",
                courseId: "course-nimcet",
                name: "Aman Kumar",
                email: "aman@student.com",
                utrNumber: "409283741029",
                course: "NIMCET Complete Mastery 2025",
                amount: 4999,
                screenshotUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHETEPhulgoDshbuHG_rQTApWdOwQeBq9xR9rvLHDMeF9TXTk4VehAewZao3mxVVDwAW6mgsaXdMbnJU_YkCq24TKaSwoQAfbVYU0xSOXIRwsQTC8LOxz8e-R9HmibXFhsxDhgeQwlVllZTtB0b4TPI_Ge7T7M-uJE9aH2yZKRjqTNC0pxFUI0D730Ej7YZWpCPjKzy8-IbKqvQdbTRgorFDJ24tAjNrgDqmG51Lpv2ITdjCUUD59ToznVExqBze68zKjQuncXsRmO",
                status: "pending",
                submittedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            }
        ]);
    }

    // Seed initial mocktests
    if (getLocalData('mca_mocktests').length === 0) {
        saveLocalData('mca_mocktests', [
            {
                id: "test-nimcet-1",
                title: "NIMCET Complete Mastery - Mock Test 1",
                courseId: "course-nimcet",
                durationMinutes: 60,
                marksCorrect: 4,
                marksWrong: -1,
                questions: [
                    {
                        questionText: "If A and B are two sets such that n(A) = 17, n(B) = 23, and n(A U B) = 38, find n(A ∩ B).",
                        options: ["2", "4", "6", "8"],
                        correctAnswer: "A"
                    },
                    {
                        questionText: "What is the sum of integers from 1 to 100?",
                        options: ["5000", "5050", "5100", "4950"],
                        correctAnswer: "B"
                    },
                    {
                        questionText: "In 8085 microprocessor, how many address lines are multiplexed with data lines?",
                        options: ["16", "4", "8", "12"],
                        correctAnswer: "C"
                    },
                    {
                        questionText: "Calculate the probability of drawing a red face card from a standard deck of 52 playing cards.",
                        options: ["6/13", "1/26", "3/13", "3/26"],
                        correctAnswer: "D"
                    }
                ]
            },
            {
                id: "test-placement-1",
                title: "Placement Program - Practice Mock 1",
                courseId: "course-placement",
                durationMinutes: 45,
                marksCorrect: 4,
                marksWrong: -1,
                questions: [
                    {
                        questionText: "What is the average time complexity of searching an element in a Balanced Binary Search Tree?",
                        options: ["O(N)", "O(1)", "O(log N)", "O(N log N)"],
                        correctAnswer: "C"
                    },
                    {
                        questionText: "Which scheduling algorithm is non-preemptive?",
                        options: ["Round Robin", "First-Come, First-Served (FCFS)", "Shortest Remaining Time First (SRTF)", "Priority Preemptive"],
                        correctAnswer: "B"
                    },
                    {
                        questionText: "What does the pointer declaration int *ptr[10]; represent?",
                        options: ["Pointer to an array of 10 integers", "Array of 10 pointers to integers", "Array of 10 integers", "Pointer to a function"],
                        correctAnswer: "B"
                    }
                ]
            }
        ]);
    }
};

if (useFallback) {
    clearAndReseed();  // wipe stale data if seed version changed
    seedMockData();
}

// -------------------------------------------------------------
// 3. CORE SERVICE IMPLEMENTATIONS
// -------------------------------------------------------------
const FirebaseService = {
    // Initials helper exposed for components
    getInitialsAvatarUrl(name) {
        return getInitialsAvatar(name);
    },

    // --- AUTHENTICATION SERVICES ---
    async loginEmail(email, password) {
        if (!useFallback && auth) {
            // Firebase Auth verifies the password
            const userCred = await auth.signInWithEmailAndPassword(email, password);
            const devId = getOrCreateDeviceId();
            const uid = userCred.user.uid;

            // ── Step 1: Check 'admin' collection ────────────────────────
            // Admins are stored in their own collection. If the email is found
            // there, the user is an admin regardless of the 'users' collection.
            const adminSnap = await db.collection("admin")
                .where("email", "==", email).get();
            const isAdmin = !adminSnap.empty;
            const targetRole = isAdmin ? 'admin' : 'student';

            // ── Step 2: Upsert into 'users' collection ───────────────────
            // Every authenticated user gets a document in 'users' for profile
            // data (name, profileImage, etc.). We derive name from admin doc
            // when available so the display name is always populated.
            let userData;
            const userDoc = await db.collection("users").doc(uid).get();

            if (!userDoc.exists) {
                // First login — create the users document
                const adminDocData = isAdmin ? adminSnap.docs[0].data() : null;
                const name = adminDocData?.name || email.split('@')[0];
                userData = {
                    uid,
                    name,
                    email,
                    role: targetRole,
                    profileImage: getInitialsAvatar(name),
                    isActive: true,
                    currentDeviceId: devId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection("users").doc(uid).set(userData);
            } else {
                // Returning user — sync role from authoritative collection
                userData = userDoc.data();
                const updates = {
                    role: targetRole,          // always sync from admin/users source
                    currentDeviceId: devId,
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection("users").doc(uid).update(updates);
                userData = { ...userData, ...updates, uid };
            }

            const fullUser = { uid, ...userData, role: targetRole };
            localStorage.setItem('mca_current_user', JSON.stringify(fullUser));
            await this.logActivity(uid, email, "login",
                `${targetRole} logged in from ${isAdmin ? 'admin' : 'users'} collection`);
            return fullUser;

        } else {
            // ── MOCK LOGIN (local storage fallback) ─────────────────────
            const adminList = getLocalData('mca_admin');
            const usersList = getLocalData('mca_users');

            // Check admin list first — mirrors the Firestore 'admin' collection
            const adminRecord = adminList.find(
                a => a.email.toLowerCase() === email.toLowerCase()
            );
            const isAdmin = !!adminRecord;
            const targetRole = isAdmin ? 'admin' : 'student';

            const devId = getOrCreateDeviceId();
            let foundUser = usersList.find(
                u => u.email.toLowerCase() === email.toLowerCase()
            );

            if (!foundUser) {
                // Auto-create from admin record data or email prefix
                const name = adminRecord?.name || email.split('@')[0];
                foundUser = {
                    uid: "mock-user-" + Math.random().toString(36).substr(2, 9),
                    name,
                    email,
                    role: targetRole,
                    profileImage: getInitialsAvatar(name),
                    isActive: true,
                    currentDeviceId: devId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                usersList.push(foundUser);
            } else {
                // Always sync role from the authoritative list on each login
                foundUser.role = targetRole;
                foundUser.currentDeviceId = devId;
                foundUser.updatedAt = new Date().toISOString();
            }
            foundUser.lastLoginAt = new Date().toISOString();
            saveLocalData('mca_users', usersList);
            localStorage.setItem('mca_current_user', JSON.stringify(foundUser));
            await this.logActivity(foundUser.uid, email, "login",
                `${targetRole} logged in from ${isAdmin ? 'admin' : 'users'} collection`);
            return foundUser;
        }
    },

    async getUserByEmail(email) {
        if (!useFallback && db) {
            const snap = await db.collection("users").where("email", "==", email).limit(1).get();
            let found = null;
            if (!snap.empty) {
                const doc = snap.docs[0];
                found = { id: doc.id, uid: doc.id, ...doc.data() };
            }
            return found;
        } else {
            const users = getLocalData('mca_users');
            return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        }
    },

    async getAllUsers() {
        if (!useFallback && db) {
            const snap = await db.collection("users").get();
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, uid: doc.id, ...doc.data() }));
            return list;
        } else {
            return getLocalData('mca_users');
        }
    },

    // --- HIGH-SCALE ADMIN STUDENT MANAGEMENT ---
    
    async searchStudentsPaginated(filters, lastVisible = null, limitCount = 20) {
        if (!useFallback && db) {
            // Course-based search requires a join simulation
            if (filters.searchType === "course" && filters.courseId) {
                let eQuery = db.collection("enrollments").where("courseId", "==", filters.courseId);
                // Simple pagination on enrollments
                eQuery = eQuery.limit(limitCount);
                if (lastVisible) eQuery = eQuery.startAfter(lastVisible);
                
                const eSnap = await eQuery.get();
                const userIds = [];
                eSnap.forEach(doc => userIds.push(doc.data().userId));
                
                if (userIds.length === 0) return { students: [], lastVisible: null, hasMore: false };
                
                const uSnap = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), "in", userIds).get();
                const students = [];
                uSnap.forEach(doc => students.push({ id: doc.id, uid: doc.id, ...doc.data() }));
                
                // Maintain order of enrollments
                const orderedStudents = userIds.map(uid => students.find(s => s.uid === uid)).filter(Boolean);
                
                return {
                    students: orderedStudents,
                    lastVisible: eSnap.docs.length > 0 ? eSnap.docs[eSnap.docs.length - 1] : null,
                    hasMore: eSnap.docs.length === limitCount
                };
            }
            
            // Standard Single-Axis searches
            let query = db.collection("users");
            
            if (filters.searchType === "email" && filters.queryStr) {
                query = query.where("email", "==", filters.queryStr.toLowerCase());
            } else if (filters.searchType === "name" && filters.queryStr) {
                // Case sensitive prefix search (standard Firestore limitation)
                query = query.orderBy("name")
                             .startAt(filters.queryStr)
                             .endAt(filters.queryStr + '\uf8ff');
            } else {
                // Default: Recent students
                query = query.orderBy("createdAt", "desc");
            }
            
            query = query.limit(limitCount);
            if (lastVisible) {
                query = query.startAfter(lastVisible);
            }
            
            const snap = await query.get();
            const students = [];
            snap.forEach(doc => students.push({ id: doc.id, uid: doc.id, ...doc.data() }));
            
            return {
                students: students,
                lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
                hasMore: snap.docs.length === limitCount
            };
        } else {
            // FALLBACK Logic
            const users = getLocalData('mca_users').filter(u => u.role !== 'admin');
            let filtered = users;
            
            if (filters.searchType === "email" && filters.queryStr) {
                filtered = users.filter(u => u.email.toLowerCase() === filters.queryStr.toLowerCase());
            } else if (filters.searchType === "name" && filters.queryStr) {
                filtered = users.filter(u => u.name.toLowerCase().startsWith(filters.queryStr.toLowerCase()));
            } else if (filters.searchType === "course" && filters.courseId) {
                const enrollments = getLocalData('mca_enrollments');
                const uids = enrollments.filter(e => e.courseId === filters.courseId).map(e => e.userId);
                filtered = users.filter(u => uids.includes(u.uid));
            }
            
            filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            
            let startIndex = 0;
            if (lastVisible) {
                startIndex = filtered.findIndex(u => u.uid === lastVisible) + 1;
            }
            
            const paged = filtered.slice(startIndex, startIndex + limitCount);
            
            return {
                students: paged,
                lastVisible: paged.length > 0 ? paged[paged.length - 1].uid : null,
                hasMore: startIndex + limitCount < filtered.length
            };
        }
    },

    async deleteStudentAndAssociatedData(userId) {
        if (!useFallback && db) {
            // Helper function to delete in batches of 500
            const deleteQueryBatch = async (query) => {
                const snapshot = await query.get();
                if (snapshot.size === 0) return 0;
                
                const batch = db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                
                // Recurse if there might be more (since we can only fetch so many at once)
                // But for now, a single pass is usually enough if user records < 500 per collection
                return snapshot.size;
            };

            // 1. Delete Enrollments
            await deleteQueryBatch(db.collection("enrollments").where("userId", "==", userId));
            // 2. Delete Lesson Progress
            await deleteQueryBatch(db.collection("lessonProgress").where("userId", "==", userId));
            // 3. Delete Mock Attempts
            await deleteQueryBatch(db.collection("mockAttempts").where("userId", "==", userId));
            // 4. Delete Payment Requests
            await deleteQueryBatch(db.collection("paymentRequests").where("userId", "==", userId));
            // 5. Delete User Document
            await db.collection("users").doc(userId).delete();
            
        } else {
            // Fallback deletion
            const users = getLocalData('mca_users').filter(u => u.uid !== userId);
            saveLocalData('mca_users', users);
            
            const enrollments = getLocalData('mca_enrollments').filter(e => e.userId !== userId);
            saveLocalData('mca_enrollments', enrollments);
            
            const lp = getLocalData('mca_lessonprogress').filter(p => p.userId !== userId);
            saveLocalData('mca_lessonprogress', lp);
            
            const ma = getLocalData('mca_mockattempts').filter(a => a.userId !== userId);
            saveLocalData('mca_mockattempts', ma);
            
            const pr = getLocalData('mca_payments').filter(p => p.userId !== userId);
            saveLocalData('mca_payments', pr);
        }
        
        await this.logActivity("admin", "admin@gmail.com", "user_deleted", `Completely wiped user ${userId} and all associated data.`);
        return { success: true };
    },

    async getUsersByIds(userIds) {
        if (!userIds || userIds.length === 0) return [];
        if (!useFallback && db) {
            try {
                const snap = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), 'in', userIds).get();
                const list = [];
                snap.forEach(doc => list.push({ id: doc.id, uid: doc.id, ...doc.data() }));
                return list;
            } catch (e) {
                console.error("Failed to fetch user batch:", e);
                return [];
            }
        } else {
            const users = getLocalData('mca_users');
            return users.filter(u => userIds.includes(u.uid));
        }
    },

    async signupEmail(name, email, password) {
        if (!useFallback && auth && db) {
            const userCred = await auth.createUserWithEmailAndPassword(email, password);
            const initialImg = getInitialsAvatar(name);
            const devId = getOrCreateDeviceId();

            // Role determined by Firestore 'admin' collection
            const adminQuery = await db.collection("admin").where("email", "==", email).get();
            const isAdminUser = !adminQuery.empty;
            const targetRole = isAdminUser ? 'admin' : 'student';

            const userData = {
                uid: userCred.user.uid,
                name,
                email,
                role: targetRole,
                profileImage: initialImg,
                isActive: true,
                currentDeviceId: devId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection("users").doc(userCred.user.uid).set(userData);
            localStorage.setItem('mca_current_user', JSON.stringify(userData));
            await this.logActivity(userData.uid, userData.email, "signup", `User registered standard account`);
            return userData;
        } else {
            // ── MOCK SIGNUP ───────────────────────────────────────────
            const adminList = getLocalData('mca_admin');
            const isAdminUser = adminList.some(a => a.email.toLowerCase() === email.toLowerCase());
            const targetRole = isAdminUser ? 'admin' : 'student';

            const users = getLocalData('mca_users');
            if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                throw new Error("Email address already registered");
            }

            const newUid = "mock-user-" + Math.random().toString(36).substr(2, 9);
            const initialImg = getInitialsAvatar(name);
            const devId = getOrCreateDeviceId();
            const newUser = {
                uid: newUid,
                name,
                email,
                role: targetRole,
                profileImage: initialImg,
                isActive: true,
                currentDeviceId: devId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
            };
            users.push(newUser);
            saveLocalData('mca_users', users);
            localStorage.setItem('mca_current_user', JSON.stringify(newUser));
            await this.logActivity(newUser.uid, newUser.email, "signup", `User registered standard account`);
            return newUser;
        }
    },

    async loginGoogle() {
        if (!useFallback && auth && db) {
            const provider = new firebase.auth.GoogleAuthProvider();
            const userCred = await auth.signInWithPopup(provider);
            const user = userCred.user;
            const devId = getOrCreateDeviceId();
            
            // Check if user's email exists in the 'admin' collection
            const adminQuery = await db.collection("admin").where("email", "==", user.email).get();
            const isAdminUser = !adminQuery.empty;
            const targetRole = isAdminUser ? 'admin' : 'student';
            
            const userDoc = await db.collection("users").doc(user.uid).get();
            let userData = {};
            
            if (!userDoc.exists) {
                // Initial Google Signup - use Google Photo URL
                userData = {
                    uid: user.uid,
                    name: user.displayName || "Google User",
                    email: user.email,
                    role: targetRole,
                    profileImage: user.photoURL || getInitialsAvatar(user.displayName || "Google User"),
                    isActive: true,
                    currentDeviceId: devId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection("users").doc(user.uid).set(userData);
                user.isNewUser = true;
            } else {
                userData = userDoc.data();
                const updates = {
                    currentDeviceId: devId,
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                if (userData.role !== targetRole) {
                    updates.role = targetRole;
                    userData.role = targetRole;
                }
                await db.collection("users").doc(user.uid).update(updates);
                userData.currentDeviceId = devId;
            }
            
            const fullUser = { uid: user.uid, ...userData };
            localStorage.setItem('mca_current_user', JSON.stringify(fullUser));
            await this.logActivity(fullUser.uid, fullUser.email, "login_google", `User logged in via Google Auth`);
            return fullUser;
        } else {
            // Mock Google Login
            const name = "Google Demo Student";
            const email = "google@student.com";
            
            const adminList = getLocalData('mca_admin');
            const isAdminUser = adminList.some(a => a.email === email) || email === "admin@mcaace.com";
            const targetRole = isAdminUser ? 'admin' : 'student';
            
            const devId = getOrCreateDeviceId();
            const initialImg = getInitialsAvatar(name);
            const users = getLocalData('mca_users');
            
            let foundUser = users.find(u => u.email === email);
            if (!foundUser) {
                foundUser = {
                    uid: "mock-google-id",
                    name,
                    email,
                    role: targetRole,
                    profileImage: initialImg,
                    isActive: true,
                    currentDeviceId: devId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastLoginAt: new Date().toISOString()
                };
                users.push(foundUser);
                saveLocalData('mca_users', users);
            } else {
                foundUser.role = targetRole;
                foundUser.currentDeviceId = devId;
                foundUser.lastLoginAt = new Date().toISOString();
                saveLocalData('mca_users', users);
            }
            localStorage.setItem('mca_current_user', JSON.stringify(foundUser));
            await this.logActivity(foundUser.uid, foundUser.email, "login_google", `User logged in via Google Auth`);
            return foundUser;
        }
    },

    async updateUserMobile(mobileNumber) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error("No user logged in.");
        
        if (!useFallback && db) {
            await db.collection("users").doc(currentUser.uid).update({
                mobile: mobileNumber,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const users = getLocalData('mca_users');
            const idx = users.findIndex(u => u.uid === currentUser.uid);
            if (idx !== -1) {
                users[idx].mobile = mobileNumber;
                users[idx].updatedAt = new Date().toISOString();
                saveLocalData('mca_users', users);
            }
        }
        
        // Update local session
        currentUser.mobile = mobileNumber;
        localStorage.setItem('mca_current_user', JSON.stringify(currentUser));
        return currentUser;
    },


    async logout() {
        if (deviceSessionListener) {
            if (!useFallback) {
                deviceSessionListener(); // Unsubscribe
            } else {
                clearInterval(deviceSessionListener);
            }
            deviceSessionListener = null;
        }
        if (!useFallback && auth) {
            await auth.signOut();
        }
        localStorage.removeItem('mca_current_user');
    },

    getCurrentUser() {
        try {
            const userJson = localStorage.getItem('mca_current_user');
            if (!userJson) return null;
            const user = JSON.parse(userJson);
            if (user && user.uid) {
                startDeviceSessionCheck(user.uid);
            }
            return user;
        } catch (e) {
            return null;
        }
    },

    // --- MOCK TEST SERVICES ---
    async getMockTests(courseId) {
        if (!useFallback && db) {
            let query = db.collection("mocktests");
            if (courseId) {
                query = query.where("courseId", "==", courseId);
            }
            const snap = await query.get();
            const tests = [];
            snap.forEach(doc => {
                tests.push({ id: doc.id, ...doc.data() });
            });
            return tests;
        } else {
            const tests = getLocalData('mca_mocktests');
            if (courseId) {
                return tests.filter(t => t.courseId === courseId);
            }
            return tests;
        }
    },

    async saveMockTest(testId, testData) {
        if (!useFallback && db) {
            if (testId) {
                await db.collection("mocktests").doc(testId).set(testData, { merge: true });
                return { id: testId, ...testData };
            } else {
                const docRef = await db.collection("mocktests").add(testData);
                return { id: docRef.id, ...testData };
            }
        } else {
            const tests = getLocalData('mca_mocktests');
            if (testId) {
                const idx = tests.findIndex(t => t.id === testId);
                if (idx !== -1) {
                    tests[idx] = { ...tests[idx], ...testData };
                } else {
                    tests.push({ id: testId, ...testData });
                }
            } else {
                testId = "mocktest-" + Math.random().toString(36).substr(2, 9);
                tests.push({ id: testId, ...testData });
            }
            saveLocalData('mca_mocktests', tests);
            return { id: testId, ...testData };
        }
    },

    async deleteMockTest(testId) {
        if (!useFallback && db) {
            await db.collection("mocktests").doc(testId).delete();
            return { success: true };
        } else {
            const tests = getLocalData('mca_mocktests');
            const filtered = tests.filter(t => t.id !== testId);
            saveLocalData('mca_mocktests', filtered);
            return { success: true };
        }
    },

    async saveMockAttempt(attemptData) {
        if (!useFallback && db) {
            const attemptRef = db.collection("mockAttempts").doc();
            const userRef = db.collection("users").doc(attemptData.userId);

            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                // Set the new mock attempt
                transaction.set(attemptRef, {
                    ...attemptData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Update user profile metrics for Leaderboard
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const currentHighest = userData.highestMockPercent || 0;
                    const newPercent = attemptData.percent || 0;
                    
                    const updatePayload = {
                        totalMockExamsTaken: firebase.firestore.FieldValue.increment(1),
                        takenMockTestIds: firebase.firestore.FieldValue.arrayUnion(attemptData.testId)
                    };
                    
                    if (newPercent > currentHighest) {
                        updatePayload.highestMockPercent = newPercent;
                    }
                    
                    transaction.update(userRef, updatePayload);
                }
            });

            await this.logActivity(attemptData.userId, attemptData.email || "student", "mocktest_attempt", `Completed mock test attempt with score ${attemptData.score || 0}/${attemptData.totalMarks || 0}`);
            return { id: attemptRef.id, ...attemptData };
        } else {
            const attempts = getLocalData('mca_mock_attempts');
            const attemptId = "attempt-" + Math.random().toString(36).substr(2, 9);
            const newAttempt = {
                id: attemptId,
                ...attemptData,
                createdAt: new Date().toISOString()
            };
            attempts.push(newAttempt);
            saveLocalData('mca_mock_attempts', attempts);
            
            // Also update local user object for Leaderboard fallback
            const users = getLocalData('mca_users');
            const userIdx = users.findIndex(u => u.uid === attemptData.userId);
            if (userIdx !== -1) {
                const u = users[userIdx];
                u.totalMockExamsTaken = (u.totalMockExamsTaken || 0) + 1;
                if ((attemptData.percent || 0) > (u.highestMockPercent || 0)) {
                    u.highestMockPercent = attemptData.percent || 0;
                }
                if (!u.takenMockTestIds) u.takenMockTestIds = [];
                if (!u.takenMockTestIds.includes(attemptData.testId)) {
                    u.takenMockTestIds.push(attemptData.testId);
                }
                saveLocalData('mca_users', users);
                
                // Update current user if it's the logged in user
                const currUser = getLocalData('mca_current_user');
                if (currUser && currUser.uid === attemptData.userId) {
                    currUser.totalMockExamsTaken = u.totalMockExamsTaken;
                    currUser.highestMockPercent = u.highestMockPercent;
                    currUser.takenMockTestIds = u.takenMockTestIds;
                    saveLocalData('mca_current_user', currUser);
                }
            }

            await this.logActivity(attemptData.userId, attemptData.email || "student", "mocktest_attempt", `Completed mock test attempt with score ${attemptData.score || 0}/${attemptData.totalMarks || 0}`);
            return newAttempt;
        }
    },

    async getAvailableMockTestCount(courseIds) {
        if (!courseIds || courseIds.length === 0) return 0;
        
        if (!useFallback && db) {
            try {
                // Perform a highly efficient count query without downloading documents
                const snapshot = await db.collection("mocktests").where("courseId", "in", courseIds).count().get();
                return snapshot.data().count;
            } catch (e) {
                console.error("Error fetching mock test count:", e);
                return 0;
            }
        } else {
            const tests = getLocalData('mca_mocktests');
            const filtered = tests.filter(t => courseIds.includes(t.courseId));
            return filtered.length;
        }
    },

    async getMockAttempts(userId) {
        if (!useFallback && db) {
            const snap = await db.collection("mockAttempts").where("userId", "==", userId).get();
            const attempts = [];
            snap.forEach(doc => {
                attempts.push({ id: doc.id, ...doc.data() });
            });
            return attempts;
        } else {
            const attempts = getLocalData('mca_mock_attempts');
            return attempts.filter(a => a.userId === userId);
        }
    },

    async forgotPassword(email) {
        if (!useFallback && auth) {
            await auth.sendPasswordResetEmail(email);
        } else {
            console.log(`Mock reset password instructions sent to: ${email}`);
        }
    },

    // --- CURRICULUM MANAGEMENT ---
    async getCourses() {
        const currentUser = this.getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';
        const cacheKey = 'mca_cache_courses';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached && !isAdmin) {
            const parsed = JSON.parse(cached);
            if (Date.now() - (parsed.timestamp || 0) < 30 * 60 * 1000) {
                return parsed.data;
            }
        }

        if (!useFallback && db) {
            const q = await db.collection("courses").where("isDeleted", "!=", true).get();
            const list = [];
            q.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: list }));
            return list;
        } else {
            const list = getLocalData('mca_courses').filter(c => !c.isDeleted);
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: list }));
            return list;
        }
    },
    async saveCourse(courseData) {
        if (!useFallback && db) {
            const ref = db.collection("courses").doc(courseData.id || undefined);
            const docId = courseData.id || ref.id;
            const payload = {
                ...courseData,
                isDeleted: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (!courseData.id) {
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection("courses").doc(docId).set(payload);
            } else {
                await db.collection("courses").doc(docId).update(payload);
            }
            return { success: true, id: docId };
        } else {
            const list = getLocalData('mca_courses');
            const docId = courseData.id || "course-" + Math.random().toString(36).substr(2, 9);
            const payload = { id: docId, ...courseData, isDeleted: false };
            const idx = list.findIndex(c => c.id === docId);
            if (idx !== -1) {
                list[idx] = payload;
            } else {
                list.push(payload);
            }
            saveLocalData('mca_courses', list);
            return { success: true, id: docId };
        }
    },

    async deleteCourse(courseId) {
        if (!useFallback && db) {
            await db.collection("courses").doc(courseId).update({
                isDeleted: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const list = getLocalData('mca_courses');
            const idx = list.findIndex(c => c.id === courseId);
            if (idx !== -1) {
                list[idx].isDeleted = true;
                saveLocalData('mca_courses', list);
            }
        }
        return { success: true };
    },


    async getSyllabus(courseId) {
        const currentUser = this.getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';
        const cacheKey = `mca_cache_syllabus_${courseId}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached && !isAdmin) {
            const parsed = JSON.parse(cached);
            if (Date.now() - (parsed.timestamp || 0) < 30 * 60 * 1000) {
                return parsed.data;
            }
        }

        if (!useFallback && db) {
            const modulesSnap = await db.collection("modules").where("courseId", "==", courseId).where("isDeleted", "==", false).get();
            const topicsSnap = await db.collection("topics").where("courseId", "==", courseId).where("isDeleted", "==", false).get();
            const lessonsSnap = await db.collection("lessons").where("courseId", "==", courseId).where("isDeleted", "==", false).get();
            
            let modules = [];
            modulesSnap.forEach(d => modules.push({ id: d.id, ...d.data() }));
            modules.sort((a,b) => a.order - b.order);
            
            let topics = [];
            topicsSnap.forEach(d => topics.push({ id: d.id, ...d.data() }));
            topics.sort((a,b) => a.order - b.order);

            let lessons = [];
            lessonsSnap.forEach(d => lessons.push({ id: d.id, ...d.data() }));
            lessons.sort((a,b) => a.order - b.order);
            
            // Assemble nested tree
            modules = modules.map(mod => {
                const modTopics = topics.filter(t => t.moduleId === mod.id).map(top => {
                    const topLessons = lessons.filter(l => l.topicId === top.id);
                    return { ...top, lessons: topLessons };
                });
                return { ...mod, topics: modTopics };
            });

            const result = { modules, topics, lessons };
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: result }));
            return result;
        } else {
            let modules = getLocalData('mca_modules').filter(m => m.courseId === courseId && !m.isDeleted);
            modules.sort((a,b) => a.order - b.order);
            
            let topics = getLocalData('mca_topics').filter(t => t.courseId === courseId && !t.isDeleted);
            topics.sort((a,b) => a.order - b.order);
            
            let lessons = getLocalData('mca_lessons').filter(l => l.courseId === courseId && !l.isDeleted);
            lessons.sort((a,b) => a.order - b.order);
            
            // Assemble nested tree
            modules = modules.map(mod => {
                const modTopics = topics.filter(t => t.moduleId === mod.id).map(top => {
                    const topLessons = lessons.filter(l => l.topicId === top.id);
                    return { ...top, lessons: topLessons };
                });
                return { ...mod, topics: modTopics };
            });

            const result = { modules, topics, lessons };
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: result }));
            return result;
        }
    },

    async saveModule(arg1, arg2, arg3, arg4) {
        let id, courseId, title, order;
        if (typeof arg3 === 'object') {
            courseId = arg1;
            id = arg2;
            title = arg3.title;
            order = arg3.order;
        } else {
            id = arg1;
            courseId = arg2;
            title = arg3;
            order = arg4;
        }

        if (!useFallback && db) {
            const ref = db.collection("modules").doc(id || undefined);
            const docId = id || ref.id;
            const payload = {
                courseId,
                title,
                order: parseInt(order, 10),
                isDeleted: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (!id) {
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection("modules").doc(docId).set(payload);
            } else {
                await db.collection("modules").doc(docId).update(payload);
            }
            return { success: true, id: docId };
        } else {
            const list = getLocalData('mca_modules');
            const docId = id || "mod-" + Math.random().toString(36).substr(2, 9);
            const payload = { id: docId, courseId, title, order: parseInt(order, 10), isDeleted: false };
            const idx = list.findIndex(m => m.id === docId);
            if (idx !== -1) {
                list[idx] = payload;
            } else {
                list.push(payload);
            }
            saveLocalData('mca_modules', list);
            return { success: true, id: docId };
        }
    },

    async deleteModule(courseIdOrId, id) {
        const docId = id || courseIdOrId;
        if (!useFallback && db) {
            const batch = db.batch();
            
            // Delete Module
            const modRef = db.collection("modules").doc(docId);
            batch.update(modRef, {
                isDeleted: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Cascade delete Topics
            const topicsSnap = await db.collection("topics").where("moduleId", "==", docId).get();
            topicsSnap.forEach(doc => {
                batch.update(doc.ref, {
                    isDeleted: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            // Cascade delete Lessons
            const lessonsSnap = await db.collection("lessons").where("moduleId", "==", docId).get();
            lessonsSnap.forEach(doc => {
                batch.update(doc.ref, {
                    isDeleted: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
        } else {
            const listM = getLocalData('mca_modules');
            const idx = listM.findIndex(m => m.id === docId);
            if (idx !== -1) {
                listM[idx].isDeleted = true;
                saveLocalData('mca_modules', listM);
            }
            
            const listT = getLocalData('mca_topics');
            let tChanged = false;
            listT.forEach(t => { if (t.moduleId === docId) { t.isDeleted = true; tChanged = true; } });
            if (tChanged) saveLocalData('mca_topics', listT);
            
            const listL = getLocalData('mca_lessons');
            let lChanged = false;
            listL.forEach(l => { if (l.moduleId === docId) { l.isDeleted = true; lChanged = true; } });
            if (lChanged) saveLocalData('mca_lessons', listL);
        }
        return { success: true };
    },

    async saveTopic(topicData) {
        if (!useFallback && db) {
            const ref = db.collection("topics").doc(topicData.id || undefined);
            const docId = topicData.id || ref.id;
            const payload = {
                courseId: topicData.courseId,
                moduleId: topicData.moduleId,
                title: topicData.title,
                order: parseInt(topicData.order, 10),
                isDeleted: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (!topicData.id) {
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection("topics").doc(docId).set(payload);
            } else {
                await db.collection("topics").doc(docId).update(payload);
            }
            return { success: true, id: docId };
        } else {
            const list = getLocalData('mca_topics');
            const docId = topicData.id || "top-" + Math.random().toString(36).substr(2, 9);
            const payload = { id: docId, ...topicData, order: parseInt(topicData.order, 10), isDeleted: false };
            const idx = list.findIndex(t => t.id === docId);
            if (idx !== -1) {
                list[idx] = payload;
            } else {
                list.push(payload);
            }
            saveLocalData('mca_topics', list);
            return { success: true, id: docId };
        }
    },

    async deleteTopic(topicId) {
        if (!useFallback && db) {
            const batch = db.batch();
            
            // Delete Topic
            const topRef = db.collection("topics").doc(topicId);
            batch.update(topRef, {
                isDeleted: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Cascade delete Lessons
            const lessonsSnap = await db.collection("lessons").where("topicId", "==", topicId).get();
            lessonsSnap.forEach(doc => {
                batch.update(doc.ref, {
                    isDeleted: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
        } else {
            const listT = getLocalData('mca_topics');
            const idx = listT.findIndex(t => t.id === topicId);
            if (idx !== -1) {
                listT[idx].isDeleted = true;
                saveLocalData('mca_topics', listT);
            }
            
            const listL = getLocalData('mca_lessons');
            let lChanged = false;
            listL.forEach(l => { if (l.topicId === topicId) { l.isDeleted = true; lChanged = true; } });
            if (lChanged) saveLocalData('mca_lessons', listL);
        }
        return { success: true };
    },

    async saveLesson(arg1, arg2, arg3, arg4) {
        let id, courseId, moduleId, topicId, title, description, youtubeVideoId, durationSeconds, isFreePreview, resources, order;
        
        if (typeof arg4 === 'object') {
            courseId = arg1;
            moduleId = arg2;
            id = arg3;
            topicId = arg4.topicId;
            title = arg4.title;
            description = arg4.description;
            youtubeVideoId = arg4.youtubeId || arg4.youtubeVideoId;
            durationSeconds = arg4.durationSeconds;
            isFreePreview = arg4.isPreview || arg4.isFreePreview;
            resources = arg4.resources || (arg4.pdfLink ? [arg4.pdfLink] : []);
            order = arg4.order;
        } else {
            id = arg1;
            courseId = arg2;
            moduleId = arg3;
            title = arg4;
            description = arguments[4];
            youtubeVideoId = arguments[5];
            durationSeconds = arguments[6];
            isFreePreview = arguments[7];
            resources = arguments[8];
            order = arguments[9];
        }

        const parsedOrder = parseInt(order || 1, 10);
        const parsedDuration = parseInt(durationSeconds || 600, 10);
        
        const extractVideoId = (input) => {
            if (!input) return '';
            const trimmed = input.trim();
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = trimmed.match(regExp);
            if (match && match[2].length === 11) {
                return match[2];
            }
            return trimmed;
        };
        youtubeVideoId = extractVideoId(youtubeVideoId);

        if (!useFallback && db) {
            const ref = db.collection("lessons").doc(id || undefined);
            const docId = id || ref.id;
            const payload = {
                courseId,
                moduleId,
                topicId: topicId || "default-topic",
                title,
                description,
                youtubeVideoId,
                youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
                durationSeconds: parsedDuration,
                isFreePreview: !!isFreePreview,
                resources: resources || [],
                order: parsedOrder,
                isDeleted: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (!id) {
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection("lessons").doc(docId).set(payload);
            } else {
                await db.collection("lessons").doc(docId).update(payload);
            }
            return { success: true, id: docId };
        } else {
            const list = getLocalData('mca_lessons');
            const docId = id || "les-" + Math.random().toString(36).substr(2, 9);
            const payload = {
                id: docId,
                courseId,
                moduleId,
                topicId: topicId || "default-topic",
                title,
                description,
                youtubeVideoId,
                youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
                durationSeconds: parsedDuration,
                isFreePreview: !!isFreePreview,
                resources: resources || [],
                order: parsedOrder,
                isDeleted: false
            };
            const idx = list.findIndex(l => l.id === docId);
            if (idx !== -1) {
                list[idx] = payload;
            } else {
                list.push(payload);
            }
            saveLocalData('mca_lessons', list);
            return { success: true, id: docId };
        }
    },

    async deleteLesson(courseIdOrId, id) {
        const docId = id || courseIdOrId;
        if (!useFallback && db) {
            await db.collection("lessons").doc(docId).update({
                isDeleted: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const list = getLocalData('mca_lessons');
            const idx = list.findIndex(l => l.id === docId);
            if (idx !== -1) {
                list[idx].isDeleted = true;
                saveLocalData('mca_lessons', list);
            }
        }
        return { success: true };
    },


    // --- LOCAL-FIRST PROGRESS TRACKING ---
    async getLastWatchedProgress(userId) {
        // Since we aggressively cache progress locally, we should check local progress first 
        // to find the absolute latest scrubbing position across all cached courses.
        const allKeys = Object.keys(localStorage);
        let latestProgress = null;
        
        for (const key of allKeys) {
            if (key.startsWith(`mca_cache_progress_${userId}_`)) {
                const courseProgressList = JSON.parse(localStorage.getItem(key));
                for (const p of courseProgressList) {
                    if (!latestProgress || new Date(p.lastWatchedAt).getTime() > new Date(latestProgress.lastWatchedAt).getTime()) {
                        latestProgress = p;
                    }
                }
            }
        }
        
        // If we found local progress, it's our source of truth for "last watched"
        if (latestProgress) return latestProgress;

        // Fallback to Firestore if no local cache exists
        if (!useFallback && db) {
            const snap = await db.collection("lessonProgress")
                .where("userId", "==", userId)
                .orderBy("lastWatchedAt", "desc")
                .limit(1)
                .get();
            if (!snap.empty) {
                return snap.docs[0].data();
            }
            return null;
        } else {
            const list = getLocalData('mca_progress');
            const userProgress = list.filter(p => p.userId === userId);
            if (userProgress.length === 0) return null;
            userProgress.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());
            return userProgress[0];
        }
    },

    async saveProgress(userId, courseId, lessonId, watchSeconds, durationSeconds, isCompletedStatus = false) {
        const completionPercent = Math.min(Math.round((watchSeconds / durationSeconds) * 100), 100);
        const isCompleted = isCompletedStatus || completionPercent >= 90;
        
        const docId = `${userId}_${lessonId}`;
        const cacheKey = `mca_cache_progress_${userId}_${courseId}`;
        
        // 1. Update local cache immediately
        let localProgress = [];
        const cached = localStorage.getItem(cacheKey);
        if (cached) localProgress = JSON.parse(cached);
        
        const payload = {
            id: docId,
            userId,
            courseId,
            lessonId,
            watchSeconds,
            completionPercent,
            isCompleted,
            lastPositionSeconds: watchSeconds,
            lastWatchedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const existingIdx = localProgress.findIndex(p => p.id === docId);
        if (existingIdx !== -1) {
            payload.createdAt = localProgress[existingIdx].createdAt;
            localProgress[existingIdx] = payload;
        } else {
            payload.createdAt = new Date().toISOString();
            localProgress.push(payload);
        }
        localStorage.setItem(cacheKey, JSON.stringify(localProgress));
        
        // If not completing, we skip Firestore write to save quota.
        // We rely on local cache for scrubbing.
        if (!isCompletedStatus) {
            return { success: true, localOnly: true, data: payload };
        }
        
        // --- ONLY IF COMPLETED: Write to Firestore ---
        if (!useFallback && db) {
            const progressRef = db.collection("lessonProgress").doc(docId);
            try {
                // Ensure payload has timestamp objects for Firestore where applicable
                const fsPayload = {
                    ...payload,
                    lastWatchedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                if (existingIdx === -1) fsPayload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                
                await progressRef.set(fsPayload, { merge: true });
                return { success: true, data: payload };
            } catch (e) {
                console.error("Firestore write failed", e);
                return { success: false, error: e };
            }
        } else {
            // Mock mode
            const progressList = getLocalData('mca_progress');
            const pIdx = progressList.findIndex(p => p.id === docId);
            if (pIdx !== -1) {
                progressList[pIdx] = payload;
            } else {
                progressList.push(payload);
            }
            saveLocalData('mca_progress', progressList);
            return { success: true, data: payload };
        }
    },

    async markLessonCompleted(userId, courseId, lessonId) {
        return this.saveProgress(userId, courseId, lessonId, 1, 1, true);
    },

    async getLessonProgress(userId, courseId) {
        const cacheKey = `mca_cache_progress_${userId}_${courseId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
        
        let list = [];
        if (!useFallback && db) {
            try {
                // Requires composite index: userId + courseId
                const q = await db.collection("lessonProgress")
                    .where("userId", "==", userId)
                    .where("courseId", "==", courseId)
                    .get();
                q.forEach(d => list.push({ id: d.id, ...d.data() }));
            } catch (err) {
                console.warn("[getLessonProgress] Composite index missing. Falling back to single-field query + memory filter.", err);
                // Safe fallback: Query by userId only (single field index built-in)
                const qFallback = await db.collection("lessonProgress")
                    .where("userId", "==", userId)
                    .get();
                qFallback.forEach(d => {
                    const data = d.data();
                    if (data.courseId === courseId) {
                        list.push({ id: d.id, ...data });
                    }
                });
            }
        } else {
            list = getLocalData('mca_progress').filter(p => p.userId === userId && p.courseId === courseId);
        }
        
        localStorage.setItem(cacheKey, JSON.stringify(list));
        return list;
    },

    // --- MANUAL UPI PAYMENTS GATEWAY ---
    //
    // Parameters:
    //   name          {string}  — Student full name
    //   email         {string}  — Student email
    //   utr           {string}  — 12-digit UTR / reference number
    //   course        {string}  — Course title (display name)
    //   courseId      {string?} — Optional Firestore courseId; derived from title if omitted
    //   amount        {number}  — Amount paid
    //   screenshotUrl {string}  — Cloudinary secure_url (or base64 fallback)
    //
    async savePayment({ name, email, utr, course, courseId: passedCourseId, amount, screenshotUrl }) {
        const currentUser = this.getCurrentUser();
        const userId = currentUser ? currentUser.uid : 'guest-user';

        // Resolve courseId: use passed value, or match by title, or fallback
        let courseId = passedCourseId || null;
        if (!courseId) {
            const allCourses = await this.getCourses();
            const matched = allCourses.find(
                c => c.title?.toLowerCase().includes(course?.toLowerCase() || '')
            );
            courseId = matched?.id;
        }
        
        // STRICT GUARD: Prevent ghost enrollments from being created.
        if (!courseId || courseId === 'course-unknown') {
            console.error(`[savePayment] CRITICAL: Could not map payment to a valid course ID for title: ${course}`);
            throw new Error("Invalid course selection. Please return to the homepage and try enrolling again.");
        }

        const now = new Date().toISOString();
        let expectedAmount = parseFloat(amount);
        let reportedAmount = parseFloat(amount);

        if (!useFallback && db) {
            try {
                // Secure server-side pricing lookup to prevent price injection
                const courseDoc = await db.collection("courses").doc(courseId).get();
                if (courseDoc.exists) {
                    const cData = courseDoc.data();
                    expectedAmount = cData.discountPrice || cData.price || expectedAmount;
                }
                
                const docRef = await db.collection('paymentRequests').add({
                    userId,
                    courseId,
                    name,
                    email,
                    course,
                    amount:       expectedAmount,
                    reportedAmount: reportedAmount,
                    utrNumber:    utr,
                    screenshotUrl,
                    status:       'pending',
                    reviewedBy:   null,
                    reviewedAt:   null,
                    submittedAt:  firebase.firestore.FieldValue.serverTimestamp(),
                    createdAt:    firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt:    firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('[savePayment] ✓ Firestore paymentRequest created:', docRef.id);
                await this.logActivity(userId, email, 'payment_submit',
                    `Payment request submitted for "${course}" (UTR: ${utr})`);
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error('[savePayment] Firestore error:', error);
                throw error;
            }
        } else {
            // ── MOCK FALLBACK (localStorage) ─────────────────────────
            const payments = getLocalData('mca_payments');
            const newPayment = {
                id:           'payment-' + Math.random().toString(36).substr(2, 9),
                userId,
                courseId,
                name,
                email,
                utrNumber:    utr,
                course,
                amount:       parseFloat(amount),
                screenshotUrl,
                status:       'pending',
                reviewedBy:   null,
                reviewedAt:   null,
                submittedAt:  now,
                createdAt:    now,
                updatedAt:    now
            };
            payments.unshift(newPayment);
            saveLocalData('mca_payments', payments);
            console.log('[savePayment] ✓ Mock payment saved:', newPayment.id);
            await this.logActivity(userId, email, 'payment_submit',
                `Payment request submitted for "${course}" (UTR: ${utr})`);
            return { success: true, id: newPayment.id };
        }
    },

    async getLatestPaymentRequest(userId) {
        if (!useFallback && db) {
            const snap = await db.collection("paymentRequests")
                .where("userId", "==", userId)
                .orderBy("submittedAt", "desc")
                .limit(1)
                .get();
            if (snap.empty) return null;
            const doc = snap.docs[0];
            return { id: doc.id, ...doc.data() };
        } else {
            const payments = getLocalData('mca_payments').filter(p => p.userId === userId);
            if (payments.length === 0) return null;
            payments.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            return payments[0];
        }
    },



    // --- PAGINATED FETCH FOR ADMIN PANEL ---
    async fetchPendingPayments(lastVisible = null, limitCount = 10) {
        if (!useFallback && db) {
            let query = db.collection("paymentRequests")
                .where("status", "==", "pending")
                .orderBy("submittedAt", "desc")
                .limit(limitCount);
                
            if (lastVisible) {
                query = query.startAfter(lastVisible);
            }
                
            const snapshot = await query.get();
            const pageDocs = snapshot.docs;
            
            const payments = [];
            for (const doc of pageDocs) {
                const data = doc.data();
                
                let userData = { name: data.name || "Unknown", email: data.email || "N/A" };
                if (data.userId) {
                    try {
                        const userDoc = await db.collection("users").doc(data.userId).get();
                        if (userDoc.exists) userData = userDoc.data();
                    } catch(e) { console.warn("Failed to fetch user doc for payment", doc.id); }
                }
                
                let courseData = { title: data.course || "Custom Course" };
                if (data.courseId) {
                    try {
                        const courseDoc = await db.collection("courses").doc(data.courseId).get();
                        if (courseDoc.exists) courseData = courseDoc.data();
                    } catch(e) { console.warn("Failed to fetch course doc for payment", doc.id); }
                }
                
                payments.push({
                    id: doc.id,
                    name: userData.name || data.name || "Unknown",
                    email: userData.email || data.email || "N/A",
                    mobile: userData.mobile || data.mobile || "No Mobile",
                    course: courseData.title || data.course || "Custom Course",
                    docSnapshot: doc,
                    ...data
                });
            }
            return payments;
        } else {
            const all = getLocalData('mca_payments').filter(p => p.status === "pending");
            all.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            const startIdx = lastVisible ? lastVisible : 0;
            return all.slice(startIdx, startIdx + limitCount).map(p => ({...p, docSnapshot: startIdx + limitCount}));
        }
    },

    async searchPendingPayments(email) {
        const emailLower = email.toLowerCase().trim();
        if (!useFallback && db) {
            try {
                // To avoid requiring a composite index for (email + status), 
                // we query by email natively, then filter 'pending' status locally.
                const snap = await db.collection("paymentRequests").where("email", "==", emailLower).get();
                
                const payments = [];
                for (const doc of snap.docs) {
                    const data = doc.data();
                    if (data.status !== 'pending') continue; // Local filter
                    
                    let userData = { name: data.name || "Unknown", email: data.email || "N/A" };
                    if (data.userId) {
                        try {
                            const userDoc = await db.collection("users").doc(data.userId).get();
                            if (userDoc.exists) userData = userDoc.data();
                        } catch(e) {}
                    }
                    
                    let courseData = { title: data.course || "Custom Course" };
                    if (data.courseId) {
                        try {
                            const courseDoc = await db.collection("courses").doc(data.courseId).get();
                            if (courseDoc.exists) courseData = courseDoc.data();
                        } catch(e) {}
                    }
                    
                    payments.push({
                        id: doc.id,
                        name: userData.name || data.name || "Unknown",
                        email: userData.email || data.email || "N/A",
                        mobile: userData.mobile || data.mobile || "No Mobile",
                        course: courseData.title || data.course || "Custom Course",
                        ...data
                    });
                }
                return payments.sort((a,b) => {
                    const timeA = a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : new Date(a.submittedAt || 0).getTime();
                    const timeB = b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : new Date(b.submittedAt || 0).getTime();
                    return timeB - timeA;
                });
            } catch (e) {
                console.error("Search failed:", e);
                return [];
            }
        } else {
            const all = getLocalData('mca_payments').filter(p => p.status === "pending" && p.email && p.email.toLowerCase() === emailLower);
            all.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            return all;
        }
    },

    async updatePaymentStatus(paymentId, status) {
        const currentUser = this.getCurrentUser();
        const reviewerId = currentUser ? currentUser.uid : "admin-sys";
        
        if (!useFallback && db) {
            try {
                const requestRef = db.collection("paymentRequests").doc(paymentId);
                const snap = await requestRef.get();
                if (!snap.exists) throw new Error("Payment request not found.");
                const pData = snap.data();
                
                const batch = db.batch();
                
                batch.update(requestRef, { 
                    status: status,
                    reviewedBy: reviewerId,
                    reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // If Approved, automatically trigger Enrollment (strict schema)
                if (status === 'approved') {
                    const enrollmentId = `${pData.userId}_${pData.courseId}`;
                    const enrollmentRef = db.collection("enrollments").doc(enrollmentId);
                    
                    // CRITICAL FIX: Only set createdAt if document is brand new to prevent index eviction
                    const enrollSnap = await enrollmentRef.get();
                    if (!enrollSnap.exists) {
                        batch.set(enrollmentRef, {
                            userId: pData.userId,
                            courseId: pData.courseId,
                            paymentRequestId: paymentId,
                            status: 'active',
                            enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        batch.update(enrollmentRef, {
                            status: 'active',
                            paymentRequestId: paymentId,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
                
                // Commit the atomic batch
                await batch.commit();
                
                // Fetch user data for logging
                const uDoc = await db.collection("users").doc(pData.userId).get();
                const uData = uDoc.data();
                await this.logActivity(pData.userId, uData?.email || pData.email, "payment_reviewed", `Payment status updated to ${status} by Admin`);
                
                return { success: true };
            } catch (error) {
                console.error("Firestore update error:", error);
                throw error;
            }
        } else {
            // Mock update status
            const payments = getLocalData('mca_payments');
            const idx = payments.findIndex(p => p.id === paymentId);
            if (idx !== -1) {
                payments[idx].status = status;
                payments[idx].reviewedBy = reviewerId;
                payments[idx].reviewedAt = new Date().toISOString();
                saveLocalData('mca_payments', payments);
                
                if (status === 'approved') {
                    const enrollments = getLocalData('mca_enrollments');
                    const enrollmentId = `${payments[idx].userId}_${payments[idx].courseId}`;
                    const existingIdx = enrollments.findIndex(e => e.id === enrollmentId);
                    
                    if (existingIdx !== -1) {
                        enrollments[existingIdx].status = 'active';
                        enrollments[existingIdx].paymentRequestId = paymentId;
                        enrollments[existingIdx].updatedAt = new Date().toISOString();
                        saveLocalData('mca_enrollments', enrollments);
                    } else {
                        enrollments.push({
                            id: enrollmentId,
                            userId: payments[idx].userId,
                            courseId: payments[idx].courseId,
                            paymentRequestId: paymentId,
                            status: 'active',
                            enrolledAt: new Date().toISOString(),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                        saveLocalData('mca_enrollments', enrollments);
                    }
                }
                
                await this.logActivity(payments[idx].userId, payments[idx].email, "payment_reviewed", `Payment status updated to ${status} by Admin`);
                return { success: true };
            }
            throw new Error("Payment record not found");
        }
    },

    getMetrics(callback) {
        if (!useFallback && db) {
            let state = { totalStudents: 0, activeStudents: 0, pendingCount: 0, revenue: "₹0" };
            
            const unsubUsers = db.collection("users").where("role", "==", "student").onSnapshot(snap => {
                state.totalStudents = snap.size;
                state.activeStudents = snap.docs.filter(d => d.data().isActive !== false).length;
                callback(state);
            });
            
            const unsubPayments = db.collection("paymentRequests").onSnapshot(snap => {
                const all = snap.docs.map(d => d.data());
                state.pendingCount = all.filter(p => p.status === 'pending').length;
                const revenue = all.filter(p => p.status === 'approved').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                state.revenue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue);
                callback(state);
            });
            
            return () => { unsubUsers(); unsubPayments(); };
        } else {
            // Mock Listener
            const emitStats = () => {
                const users = getLocalData('mca_users').filter(u => u.role === 'student');
                const payments = getLocalData('mca_payments');
                const pendingCount = payments.filter(p => p.status === 'pending').length;
                const revenue = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                
                callback({
                    totalStudents: users.length,
                    activeStudents: users.filter(u => u.isActive !== false).length,
                    pendingCount: pendingCount,
                    revenue: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue)
                });
            };
            emitStats();
            const intervalId = setInterval(emitStats, 2000);
            return () => clearInterval(intervalId);
        }
    },

    // --- STUDENT ENROLLMENTS MANAGEMENT (ADMIN CONTROLS) ---
    async getPaginatedEnrollments(lastVisible = null, limitCount = 10) {
        if (!useFallback && db) {
            let query = db.collection("enrollments")
                .orderBy("createdAt", "desc")
                .limit(limitCount);
            
            if (lastVisible) {
                query = query.startAfter(lastVisible);
            }
            
            const snap = await query.get();
            const enrollments = [];
            snap.forEach(d => enrollments.push({ id: d.id, docSnapshot: d, ...d.data() }));
            return enrollments;
        } else {
            const list = getLocalData('mca_enrollments');
            list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            const startIdx = lastVisible ? lastVisible : 0;
            return list.slice(startIdx, startIdx + limitCount).map(e => ({...e, docSnapshot: startIdx + limitCount}));
        }
    },

    async searchStudentEnrollments(email) {
        const emailLower = email.toLowerCase().trim();
        if (!useFallback && db) {
            // 1. Find user by email
            const userSnap = await db.collection("users").where("email", "==", emailLower).limit(1).get();
            if (userSnap.empty) return [];
            const userId = userSnap.docs[0].id;

            // 2. Find enrollments for that user
            const enrollSnap = await db.collection("enrollments").where("userId", "==", userId).get();
            const list = [];
            enrollSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
            return list;
        } else {
            const users = getLocalData('mca_users');
            const foundUser = users.find(u => u.email && u.email.toLowerCase() === emailLower);
            if (!foundUser) return [];
            
            const enrollments = getLocalData('mca_enrollments');
            return enrollments.filter(e => e.userId === foundUser.uid);
        }
    },

    async grantAccess(userId, courseId) {
        let email = "admin@granted.com"; // for activity log only
        
        if (!useFallback && db) {
            // Fetch email for activity log
            const userDoc = await db.collection("users").doc(userId).get();
            if (userDoc.exists) email = userDoc.data().email || email;

            const enrollmentId = `${userId}_${courseId}`;
            const enrollmentRef = db.collection("enrollments").doc(enrollmentId);
            const enrollSnap = await enrollmentRef.get();
            
            if (!enrollSnap.exists) {
                await enrollmentRef.set({
                    userId,
                    courseId,
                    paymentRequestId: "manually-granted",
                    status: 'active',
                    enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await enrollmentRef.update({
                    status: 'active',
                    paymentRequestId: "manually-granted",
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } else {
            const users = getLocalData('mca_users');
            const uData = users.find(u => u.uid === userId);
            if (uData) email = uData.email || email;

            const enrollments = getLocalData('mca_enrollments');
            const enrollmentId = `${userId}_${courseId}`;
            const existingIdx = enrollments.findIndex(e => e.id === enrollmentId);
            if (existingIdx !== -1) {
                enrollments[existingIdx].status = 'active';
                enrollments[existingIdx].updatedAt = new Date().toISOString();
                saveLocalData('mca_enrollments', enrollments);
            } else {
                enrollments.push({
                    id: enrollmentId,
                    userId,
                    courseId,
                    paymentRequestId: "manually-granted",
                    status: 'active',
                    enrolledAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                saveLocalData('mca_enrollments', enrollments);
            }
        }
        await this.logActivity(userId, email, "access_granted", `Manually granted access to course: ${courseId}`);
        return { success: true };
    },

    async removeAccess(userId, courseId) {
        if (!useFallback && db) {
            const enrollmentId = `${userId}_${courseId}`;
            await db.collection("enrollments").doc(enrollmentId).set({
                status: 'cancelled',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } else {
            const enrollments = getLocalData('mca_enrollments');
            const enrollmentId = `${userId}_${courseId}`;
            const idx = enrollments.findIndex(e => e.id === enrollmentId);
            if (idx !== -1) {
                enrollments[idx].status = 'cancelled';
                saveLocalData('mca_enrollments', enrollments);
            }
        }
        await this.logActivity(userId, "student", "access_revoked", `Manually revoked access to course: ${courseId}`);
        return { success: true };
    },

    async checkEnrolled(userId, courseId) {
        if (!useFallback && db) {
            const enrollmentId = `${userId}_${courseId}`;
            const doc = await db.collection("enrollments").doc(enrollmentId).get();
            return doc.exists && doc.data().status === 'active';
        } else {
            const enrollments = getLocalData('mca_enrollments');
            const enrollmentId = `${userId}_${courseId}`;
            return enrollments.some(e => e.id === enrollmentId && e.status === 'active');
        }
    },

    async logActivity(userId, email, type, description) {
        // Skip activity logging for students to save Spark Plan quota
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.role === 'student' && userId === currentUser.uid) {
            return { success: true, skipped: true };
        }

        const payload = {
            userId,
            email: email || "unknown",
            type,
            description,
            timestamp: new Date().toISOString()
        };
        if (!useFallback && db) {
            try {
                await db.collection("activities").add({
                    ...payload,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) {
                console.error("Failed to log activity to Firestore:", e);
            }
        } else {
            const list = getLocalData('mca_activities');
            list.unshift(payload);
            if (list.length > 100) list.pop();
            saveLocalData('mca_activities', list);
        }
    },

    getActivities(callback) {
        if (!useFallback && db) {
            return db.collection("activities")
                .orderBy("timestamp", "desc")
                .limit(50)
                .onSnapshot(snap => {
                    const list = [];
                    snap.forEach(doc => {
                        const data = doc.data();
                        list.push({
                            id: doc.id,
                            ...data,
                            timestamp: data.timestamp ? (data.timestamp.seconds ? new Date(data.timestamp.seconds * 1000).toISOString() : data.timestamp) : new Date().toISOString()
                        });
                    });
                    callback(list);
                });
        } else {
            const emitLocal = () => {
                const list = getLocalData('mca_activities');
                callback(list);
            };
            emitLocal();
            const intervalId = setInterval(emitLocal, 2000);
            return () => clearInterval(intervalId);
        }
    },

    async sendNotification({ title, message, recipientUid }) {
        const payload = {
            title,
            message,
            recipientUid: recipientUid || "all",
            createdAt: new Date().toISOString()
        };
        if (!useFallback && db) {
            await db.collection("notifications").add({
                ...payload,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const list = getLocalData('mca_notifications');
            list.unshift({
                id: "notif-" + Math.random().toString(36).substr(2, 9),
                ...payload
            });
            saveLocalData('mca_notifications', list);
        }
        await this.logActivity("admin", "admin@gmail.com", "notification", `Sent notification: "${title}" to ${recipientUid || "all"}`);
        return { success: true };
    },

    async getNotifications(userId) {
        if (!useFallback && db) {
            const q1 = await db.collection("notifications").where("recipientUid", "==", "all").get();
            const list = [];
            q1.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            if (userId) {
                const q2 = await db.collection("notifications").where("recipientUid", "==", userId).get();
                q2.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            }
            list.sort((a, b) => {
                const da = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                const dbTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                return dbTime - da;
            });
            return list;
        } else {
            const list = getLocalData('mca_notifications');
            return list.filter(n => n.recipientUid === "all" || n.recipientUid === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    },

    async getNotificationsPaginated(userId, limitCount = 5) {
        // Because of the "all" OR "userId" complexity in Firestore without composite indexes,
        // we fetch the full sorted list and let the client UI slice it safely.
        // This is perfectly fine for <1000 notifications per user.
        return await this.getNotifications(userId);
    },

    async markNotificationsRead(userId) {
        if (!useFallback && db) {
            await db.collection("users").doc(userId).update({
                lastNotifReadAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const users = getLocalData('mca_users');
            const idx = users.findIndex(u => u.uid === userId);
            if (idx !== -1) {
                users[idx].lastNotifReadAt = new Date().toISOString();
                saveLocalData('mca_users', users);
            }
        }
        return { success: true };
    },

    async getAllNotifications() {
        if (!useFallback && db) {
            const snap = await db.collection("notifications").get();
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => {
                const da = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                const dbTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                return dbTime - da;
            });
            return list;
        } else {
            return getLocalData('mca_notifications');
        }
    },

    async deleteNotification(id) {
        if (!useFallback && db) {
            await db.collection("notifications").doc(id).delete();
        } else {
            const list = getLocalData('mca_notifications');
            const filtered = list.filter(n => n.id !== id);
            saveLocalData('mca_notifications', filtered);
        }
        return { success: true };
    },

    async getMockTestsPaginated(courseId, lastVisible = null, limitCount = 6) {
        if (!useFallback && db) {
            let query = db.collection("mockTests")
                          .where("courseId", "==", courseId)
                          .orderBy("createdAt", "desc")
                          .limit(limitCount);
                          
            if (lastVisible) {
                query = query.startAfter(lastVisible);
            }
            
            const snap = await query.get();
            const list = [];
            snap.forEach(doc => {
                list.push({ id: doc.id, docSnap: doc, ...doc.data() });
            });
            
            return {
                tests: list,
                lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
                hasMore: snap.docs.length === limitCount
            };
        } else {
            const all = getLocalData('mca_mocktests');
            const filtered = all.filter(t => t.courseId === courseId)
                                .sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            
            let startIndex = 0;
            if (lastVisible) {
                startIndex = filtered.findIndex(t => t.id === lastVisible) + 1;
            }
            
            const paginatedList = filtered.slice(startIndex, startIndex + limitCount);
            return {
                tests: paginatedList,
                lastVisible: paginatedList.length > 0 ? paginatedList[paginatedList.length - 1].id : null,
                hasMore: startIndex + limitCount < filtered.length
            };
        }
    },

    async saveMockTest(testId, data) {
        if (!useFallback && db) {
            const payload = { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            if (testId) {
                await db.collection("mockTests").doc(testId).update(payload);
            } else {
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection("mockTests").add(payload);
            }
        } else {
            const tests = getLocalData('mca_mocktests');
            if (testId) {
                const idx = tests.findIndex(t => t.id === testId);
                if (idx !== -1) {
                    tests[idx] = { ...tests[idx], ...data, updatedAt: new Date().toISOString() };
                }
            } else {
                tests.push({
                    id: 'mock-' + Math.random().toString(36).substr(2, 9),
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            saveLocalData('mca_mocktests', tests);
        }
        await this.logActivity("admin", "admin@gmail.com", "mocktest", `Mock test saved: "${data.title}"`);
        return { success: true };
    },

    async deleteMockTest(testId) {
        if (!useFallback && db) {
            await db.collection("mockTests").doc(testId).delete();
        } else {
            const tests = getLocalData('mca_mocktests');
            const filtered = tests.filter(t => t.id !== testId);
            saveLocalData('mca_mocktests', filtered);
        }
        await this.logActivity("admin", "admin@gmail.com", "mocktest", `Mock test deleted: ${testId}`);
        return { success: true };
    },

    async saveMockAttempt(attemptData) {
        const payload = {
            ...attemptData,
            createdAt: new Date().toISOString()
        };
        
        let finalSummaries = null;
        
        if (!useFallback && db) {
            await db.runTransaction(async (transaction) => {
                const userRef = db.collection("users").doc(attemptData.userId);
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.data() || {};
                
                const existingSummary = userData.attemptSummaries?.[attemptData.testId];
                
                // Only keep the HIGHEST score to prevent punishment for practicing
                if (!existingSummary || existingSummary.percent < attemptData.percent) {
                    transaction.update(userRef, {
                        [`attemptSummaries.${attemptData.testId}`]: {
                            score: attemptData.score,
                            percent: attemptData.percent
                        }
                    });
                    
                    finalSummaries = {
                        ...(userData.attemptSummaries || {}),
                        [attemptData.testId]: {
                            score: attemptData.score,
                            percent: attemptData.percent
                        }
                    };
                } else {
                    finalSummaries = userData.attemptSummaries;
                }
                
                const attemptRef = db.collection("mockAttempts").doc();
                const fsPayload = {
                    ...attemptData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                transaction.set(attemptRef, fsPayload);
            });
        } else {
            const attempts = getLocalData('mca_mockattempts');
            payload.id = 'attempt-' + Math.random().toString(36).substr(2, 9);
            attempts.push(payload);
            saveLocalData('mca_mockattempts', attempts);
            
            const users = getLocalData('mca_users');
            const uIdx = users.findIndex(u => u.uid === attemptData.userId);
            if (uIdx !== -1) {
                if (!users[uIdx].attemptSummaries) users[uIdx].attemptSummaries = {};
                
                const existingSummary = users[uIdx].attemptSummaries[attemptData.testId];
                if (!existingSummary || existingSummary.percent < attemptData.percent) {
                    users[uIdx].attemptSummaries[attemptData.testId] = {
                        score: attemptData.score,
                        percent: attemptData.percent
                    };
                    saveLocalData('mca_users', users);
                }
                finalSummaries = users[uIdx].attemptSummaries;
            }
        }
        
        // Sync local session cache for BOTH environments
        if (finalSummaries) {
            const sessionUser = getLocalData('mca_current_user');
            if (sessionUser && sessionUser.uid === attemptData.userId) {
                sessionUser.attemptSummaries = finalSummaries;
                saveLocalData('mca_current_user', sessionUser);
            }
        }
        
        await this.logActivity(attemptData.userId, null, "mocktest_attempt", `Completed mock test "${attemptData.testTitle}" with score ${attemptData.score}`);
        return { success: true };
    },

};

// Export services to window object for global compatibility on file:///
window.FirebaseService = FirebaseService;
