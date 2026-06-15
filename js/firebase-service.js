// Firebase Firestore & Auth Service (Compat mode for file:/// support)
// Configures Firestore collections, auth events, progress syncing and admin approvals.

let db = null;
let auth = null;
let useFallback = true;

// -------------------------------------------------------------
// 1. DYNAMIC SVG INITIALS AVATAR GENERATOR
// -------------------------------------------------------------
const getInitialsAvatar = (name) => {
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    const colors = [
        "#1e3a8a", "#0d9488", "#0891b2", "#4f46e5", "#7c3aed", 
        "#c026d3", "#db2777", "#ea580c", "#eab308", "#16a34a"
    ];
    const charCode = initial.charCodeAt(0);
    const color = colors[charCode % colors.length];
    
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="50" r="50" fill="${color}"/>
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="bold" font-size="50" fill="#ffffff">${initial}</text>
        </svg>
    `;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg.trim());
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
                    alert("You have been logged out because your account is logged in on another device.");
                    window.FirebaseService.logout().then(() => {
                        window.location.href = "index.html";
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
                alert("You have been logged out because your account is logged in on another device.");
                window.FirebaseService.logout().then(() => {
                    window.location.href = "index.html";
                });
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
                    profileImage: user.photoURL || getInitialsAvatar(user.displayName),
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
            const docRef = await db.collection("mockAttempts").add({
                ...attemptData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await this.logActivity(attemptData.userId, attemptData.email || "student", "mocktest_attempt", `Completed mock test attempt with score ${attemptData.score || 0}/${attemptData.totalMarks || 0}`);
            return { id: docRef.id, ...attemptData };
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
            await this.logActivity(attemptData.userId, attemptData.email || "student", "mocktest_attempt", `Completed mock test attempt with score ${attemptData.score || 0}/${attemptData.totalMarks || 0}`);
            return newAttempt;
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
        if (!useFallback && db) {
            const q = await db.collection("courses").where("isDeleted", "!=", true).get();
            const list = [];
            q.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list;
        } else {
            return getLocalData('mca_courses').filter(c => !c.isDeleted);
        }
    },

    async getSyllabus(courseId) {
        if (!useFallback && db) {
            const modulesSnap = await db.collection("modules").where("courseId", "==", courseId).get();
            const lessonsSnap = await db.collection("lessons").where("courseId", "==", courseId).get();
            
            const modules = [];
            modulesSnap.forEach(d => modules.push({ id: d.id, ...d.data() }));
            modules.sort((a,b) => a.order - b.order);
            
            const lessons = [];
            lessonsSnap.forEach(d => lessons.push({ id: d.id, ...d.data() }));
            lessons.sort((a,b) => a.order - b.order);
            
            return { modules, lessons };
        } else {
            const modules = getLocalData('mca_modules').filter(m => m.courseId === courseId);
            modules.sort((a,b) => a.order - b.order);
            const lessons = getLocalData('mca_lessons').filter(l => l.courseId === courseId);
            lessons.sort((a,b) => a.order - b.order);
            return { modules, lessons };
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
            await db.collection("modules").doc(docId).update({
                isDeleted: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const list = getLocalData('mca_modules');
            const idx = list.findIndex(m => m.id === docId);
            if (idx !== -1) {
                list[idx].isDeleted = true;
                saveLocalData('mca_modules', list);
            }
        }
        return { success: true };
    },

    async saveLesson(arg1, arg2, arg3, arg4) {
        let id, courseId, moduleId, title, description, youtubeVideoId, durationSeconds, isFreePreview, resources, order;
        
        if (typeof arg4 === 'object') {
            courseId = arg1;
            moduleId = arg2;
            id = arg3;
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
                topicId: "default-topic",
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
                topicId: "default-topic",
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


    // --- RATE-LIMITED PROGRESS TRACKING ---
    async saveProgress(userId, courseId, lessonId, watchSeconds, durationSeconds, isCompletedStatus = false) {
        // Enforce 30 writes rate-limiting count in localStorage
        const today = new Date().toISOString().slice(0, 10);
        const limitKey = `yt_writes_count_${userId}_${today}`;
        const currentCount = parseInt(localStorage.getItem(limitKey) || "0", 10);
        
        if (currentCount >= 30) {
            console.warn(`Write limit of 30 exceeded for today. Firestore progress update blocked to prevent quota exhaustion.`);
            return { limitExceeded: true, count: currentCount };
        }
        
        const completionPercent = Math.min(Math.round((watchSeconds / durationSeconds) * 100), 100);
        const isCompleted = isCompletedStatus || completionPercent >= 90;
        
        // Log the local write
        localStorage.setItem(limitKey, (currentCount + 1).toString());
        
        if (!useFallback && db) {
            const docId = `${userId}_${lessonId}`;
            const progressRef = db.collection("lessonProgress").doc(docId);
            const updatePayload = {
                userId,
                courseId,
                lessonId,
                watchSeconds,
                completionPercent,
                isCompleted,
                lastPositionSeconds: watchSeconds,
                lastWatchedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Check if document exists to write createdAt
            const docSnap = await progressRef.get();
            if (!docSnap.exists) {
                updatePayload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await progressRef.set(updatePayload);
            } else {
                await progressRef.update(updatePayload);
            }
            return { success: true, count: currentCount + 1, data: updatePayload };
        } else {
            // Mock Progress Sync
            const progressList = getLocalData('mca_progress');
            const docId = `${userId}_${lessonId}`;
            const existingIdx = progressList.findIndex(p => p.id === docId);
            
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
            
            if (existingIdx !== -1) {
                payload.createdAt = progressList[existingIdx].createdAt;
                progressList[existingIdx] = payload;
            } else {
                payload.createdAt = new Date().toISOString();
                progressList.push(payload);
            }
            saveLocalData('mca_progress', progressList);
            return { success: true, count: currentCount + 1, data: payload };
        }
    },

    async markLessonCompleted(userId, courseId, lessonId) {
        return this.saveProgress(userId, courseId, lessonId, 1, 1, true);
    },

    async getLessonProgress(userId, courseId) {
        if (!useFallback && db) {
            const q = await db.collection("lessonProgress")
                .where("userId", "==", userId)
                .where("courseId", "==", courseId)
                .get();
            const list = [];
            q.forEach(d => list.push({ id: d.id, ...d.data() }));
            return list;
        } else {
            return getLocalData('mca_progress').filter(p => p.userId === userId && p.courseId === courseId);
        }
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
                c => c.title?.toLowerCase() === course?.toLowerCase()
            );
            courseId = matched?.id || 'course-unknown';
        }

        const now = new Date().toISOString();

        if (!useFallback && db) {
            try {
                const docRef = await db.collection('paymentRequests').add({
                    userId,
                    courseId,
                    name,
                    email,
                    course,
                    amount:       parseFloat(amount),
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
                .get();
            if (snap.empty) return null;
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a,b) => {
                const da = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
                const db = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
                return db - da;
            });
            return docs[0];
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
            const snapshot = await db.collection("paymentRequests")
                .where("status", "==", "pending")
                .get();
                
            let allDocs = snapshot.docs;
            // Sort descending in memory to avoid needing composite index
            allDocs.sort((a,b) => {
                const da = a.data().submittedAt?.toMillis ? a.data().submittedAt.toMillis() : (a.data().submittedAt ? new Date(a.data().submittedAt).getTime() : 0);
                const db = b.data().submittedAt?.toMillis ? b.data().submittedAt.toMillis() : (b.data().submittedAt ? new Date(b.data().submittedAt).getTime() : 0);
                return db - da;
            });
            
            const startIdx = lastVisible ? allDocs.findIndex(d => d.id === lastVisible.id) + 1 : 0;
            const pageDocs = allDocs.slice(startIdx, startIdx + limitCount);
            
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

    async updatePaymentStatus(paymentId, status) {
        const currentUser = this.getCurrentUser();
        const reviewerId = currentUser ? currentUser.uid : "admin-sys";
        
        if (!useFallback && db) {
            try {
                const requestRef = db.collection("paymentRequests").doc(paymentId);
                const snap = await requestRef.get();
                if (!snap.exists) throw new Error("Payment request not found.");
                const pData = snap.data();
                
                await requestRef.update({ 
                    status: status,
                    reviewedBy: reviewerId,
                    reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // If Approved, automatically trigger Enrollment (strict schema)
                if (status === 'approved') {
                    const enrollmentId = `${pData.userId}_${pData.courseId}`;
                    await db.collection("enrollments").doc(enrollmentId).set({
                        userId: pData.userId,
                        courseId: pData.courseId,
                        paymentRequestId: paymentId,
                        status: 'active',
                        enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
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
                    // Prevent duplicate enrollments
                    if (!enrollments.some(e => e.id === enrollmentId)) {
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
    async getEnrollments() {
        if (!useFallback && db) {
            const snap = await db.collection("enrollments").get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            return list;
        } else {
            return getLocalData('mca_enrollments');
        }
    },

    async grantAccess(userId, courseId) {
        let email = "admin@granted.com"; // for activity log only
        
        if (!useFallback && db) {
            // Fetch email for activity log
            const userDoc = await db.collection("users").doc(userId).get();
            if (userDoc.exists) email = userDoc.data().email || email;

            const enrollmentId = `${userId}_${courseId}`;
            await db.collection("enrollments").doc(enrollmentId).set({
                userId,
                courseId,
                paymentRequestId: "manually-granted",
                status: 'active',
                enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const users = getLocalData('mca_users');
            const uData = users.find(u => u.uid === userId);
            if (uData) email = uData.email || email;

            const enrollments = getLocalData('mca_enrollments');
            const enrollmentId = `${userId}_${courseId}`;
            if (!enrollments.some(e => e.id === enrollmentId)) {
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
            await db.collection("enrollments").doc(enrollmentId).update({
                status: 'cancelled',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
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
            return list.filter(n => n.recipientUid === "all" || n.recipientUid === userId);
        }
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
    }
};

// Export services to window object for global compatibility on file:///
window.FirebaseService = FirebaseService;
