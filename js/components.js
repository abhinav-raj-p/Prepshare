// Reusable Web Components for MCA Ace (PrepShare)
// This file runs in client context, supporting direct file:/// routing.

// -------------------------------------------------------------
// HELPER: RENDER INITIALS AVATAR
// -------------------------------------------------------------
const getInitialsAvatarSvg = (name) => {
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    const colors = [
        "#1e3a8a", "#0d9488", "#0891b2", "#4f46e5", "#7c3aed", 
        "#c026d3", "#db2777", "#ea580c", "#eab308", "#16a34a"
    ];
    const charCode = initial.charCodeAt(0);
    const color = colors[charCode % colors.length];
    
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40" class="rounded-full shadow-md shrink-0">
            <circle cx="50" cy="50" r="50" fill="${color}"/>
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="bold" font-size="50" fill="#ffffff">${initial}</text>
        </svg>
    `;
};

// 1. Shared Navigation Bar with Integrated Auth Modal
class CustomNavbar extends HTMLElement {
    connectedCallback() {
        this.render();
        // Check if user is logged in
        this.updateAuthState();
    }

    render() {
        this.innerHTML = `
        <nav class="fixed top-0 z-50 w-full bg-surface dark:bg-[#080e1d] shadow-[0px_4px_20px_rgba(26,43,86,0.06)] border-b border-border-light dark:border-outline-variant/20 h-20 transition-colors duration-300">
            <div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-full">
                <!-- Brand Logo -->
                <a href="index.html" class="font-headline-md text-headline-md font-bold text-primary dark:text-[#b5c4ff] hover:opacity-90 transition-opacity">
                    MCA Ace
                </a>
                
                <!-- Desktop Navigation Links -->
                <div class="hidden md:flex gap-8 items-center">
                    <a class="nav-link text-on-surface-variant dark:text-on-surface/80 hover:text-primary dark:hover:text-[#b5c4ff] transition-colors font-body-md text-body-md" href="index.html">Courses</a>
                    <a class="nav-link text-on-surface-variant dark:text-on-surface/80 hover:text-primary dark:hover:text-[#b5c4ff] transition-colors font-body-md text-body-md" href="index.html#demo">Demo Classes</a>
                    <a class="nav-link text-on-surface-variant dark:text-on-surface/80 hover:text-primary dark:hover:text-[#b5c4ff] transition-colors font-body-md text-body-md" href="index.html#success">Success Stories</a>
                    <span id="admin-panel-link-container"></span>
                </div>
                
                <!-- Action Buttons (Logged Out) -->
                <div id="logged-out-actions" class="hidden sm:flex items-center gap-4">
                    <button id="login-btn-trigger" class="text-primary dark:text-[#b5c4ff] font-label-md px-4 py-2 hover:bg-surface-subtle dark:hover:bg-[#151b2b] rounded-lg transition-all active:scale-95 font-bold">Login/Signup</button>
                    <a id="enroll-now-btn" href="upi-payment.html?course=Placement%20Prep%20Program&courseId=course-placement&price=7499" class="bg-[#FB6514] text-white hover:bg-[#e0560d] font-label-md px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">Enroll Now</a>
                </div>

                <!-- Action User Widget (Logged In) -->
                <div id="logged-in-actions" class="hidden sm:flex items-center gap-4 relative">
                    <!-- Dynamic Initials Avatar -->
                    <button id="avatar-btn" class="flex items-center gap-2 outline-none focus:ring-2 focus:ring-primary rounded-full p-0.5 transition-transform active:scale-95">
                        <div id="navbar-avatar-container"></div>
                    </button>
                    
                    <!-- Avatar Dropdown Menu -->
                    <div id="avatar-dropdown" class="absolute right-0 top-12 w-64 bg-white dark:bg-[#151b2b] rounded-xl shadow-xl border border-border-light dark:border-outline-variant/20 hidden flex-col py-2 z-50 animate-slide-up">
                        <div class="px-4 py-3 border-b border-border-light dark:border-outline-variant/10">
                            <p id="dropdown-user-name" class="font-bold text-primary dark:text-white text-sm truncate leading-tight"></p>
                            <p id="dropdown-user-email" class="text-xs text-on-surface-variant dark:text-on-surface/50 truncate mt-0.5"></p>
                            <span id="dropdown-user-role-badge" class="inline-block mt-2 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"></span>
                        </div>
                        <a href="student-dashboard.html" class="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle dark:hover:bg-[#0d1322] text-on-surface-variant dark:text-on-surface text-sm transition-colors">
                            <span class="material-symbols-outlined text-lg">dashboard</span>
                            Student Dashboard
                        </a>
                        <a href="course-workspace.html" class="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle dark:hover:bg-[#0d1322] text-on-surface-variant dark:text-on-surface text-sm transition-colors">
                            <span class="material-symbols-outlined text-lg">school</span>
                            Course Workspace
                        </a>
                        <a href="upi-payment.html" class="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle dark:hover:bg-[#0d1322] text-on-surface-variant dark:text-on-surface text-sm transition-colors">
                            <span class="material-symbols-outlined text-lg">payments</span>
                            Submit Payments
                        </a>
                        <span id="admin-dropdown-link-container"></span>
                        <div class="border-t border-border-light dark:border-outline-variant/10 my-1"></div>
                        <button id="logout-btn-trigger" class="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-error/5 text-error text-sm transition-colors">
                            <span class="material-symbols-outlined text-lg">logout</span>
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Mobile Hamburger Button -->
                <button id="mobile-menu-btn" class="flex md:hidden items-center justify-center p-2 text-primary dark:text-[#b5c4ff] hover:bg-surface-subtle dark:hover:bg-[#151b2b] rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-2xl">menu</span>
                </button>
            </div>

            <!-- Mobile Drawer Menu -->
            <div id="mobile-drawer" class="fixed inset-0 z-45 bg-[#021541]/55 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300">
                <div class="absolute right-0 top-0 h-full w-72 bg-white dark:bg-[#0d1322] shadow-2xl p-6 flex flex-col transform translate-x-full transition-transform duration-300">
                    <div class="flex justify-between items-center mb-8">
                        <span class="font-headline-md text-title-lg font-bold text-primary dark:text-[#b5c4ff]">Menu</span>
                        <button id="close-drawer-btn" class="p-2 rounded-lg hover:bg-surface-subtle dark:hover:bg-[#151b2b] text-on-surface-variant dark:text-on-surface">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <nav class="flex flex-col gap-6 text-lg font-semibold mb-auto">
                        <a href="index.html" class="text-on-surface-variant dark:text-on-surface hover:text-[#FB6514] transition-colors">Courses</a>
                        <a href="index.html#demo" class="text-on-surface-variant dark:text-on-surface hover:text-[#FB6514] transition-colors">Demo Classes</a>
                        <a href="index.html#success" class="text-on-surface-variant dark:text-on-surface hover:text-[#FB6514] transition-colors">Success Stories</a>
                        <span id="admin-mobile-link-container"></span>
                    </nav>
                    
                    <div class="flex flex-col gap-4 mt-8 pt-6 border-t border-border-light dark:border-outline-variant/20" id="mobile-drawer-auth-block">
                        <button id="mobile-login-trigger" class="w-full text-center py-3 border border-border-light dark:border-outline-variant/30 rounded-lg text-primary dark:text-[#b5c4ff] hover:bg-surface-subtle dark:hover:bg-[#151b2b] font-bold">Login/Signup</button>
                        <a id="mobile-enroll-now-btn" href="upi-payment.html?course=Placement%20Prep%20Program&courseId=course-placement&price=7499" class="w-full text-center py-3 bg-[#FB6514] text-white rounded-lg hover:bg-[#e0560d] font-bold shadow-md">Enroll Now</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Dynamic Auth Modal -->
        <div id="auth-modal" class="fixed inset-0 bg-[#021541]/70 backdrop-blur-sm hidden items-center justify-center z-[150] p-4">
            <div class="bg-white dark:bg-[#151b2b] rounded-2xl overflow-hidden max-w-md w-full shadow-2xl border border-border-light dark:border-outline-variant/20 flex flex-col animate-slide-up">
                <!-- Tabs -->
                <div class="flex border-b border-border-light dark:border-outline-variant/10 bg-surface-subtle dark:bg-[#0d1322]">
                    <button id="tab-login" class="flex-1 py-4 font-bold text-sm text-primary dark:text-[#b5c4ff] border-b-2 border-primary dark:border-[#b5c4ff] outline-none">Log In</button>
                    <button id="tab-signup" class="flex-1 py-4 font-bold text-sm text-on-surface-variant dark:text-on-surface/60 border-b-2 border-transparent hover:text-primary dark:hover:text-[#b5c4ff] outline-none">Sign Up</button>
                </div>
                
                <div class="p-6">
                    <h3 id="auth-title" class="font-headline-md text-xl font-bold text-primary dark:text-white mb-2">Welcome Back Aspirant!</h3>
                    <p id="auth-subtitle" class="text-xs text-on-surface-variant dark:text-on-surface/50 mb-6">Enter your details to access your classrooms.</p>
                    
                    <!-- Alert Message -->
                    <div id="auth-alert" class="hidden bg-error-container/20 border border-error/20 text-error p-3 rounded-lg text-xs mb-4"></div>
                    
                    <!-- Forms -->
                    <form id="auth-form" class="space-y-4">
                        <div id="signup-name-field" class="hidden">
                            <label class="block text-xs font-bold text-on-surface-variant dark:text-on-surface/75 uppercase mb-1">Full Name</label>
                            <input type="text" id="auth-name" class="w-full border border-border-light dark:border-outline-variant/35 bg-surface dark:bg-[#0d1322] text-on-surface dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="Enter your full name"/>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-on-surface-variant dark:text-on-surface/75 uppercase mb-1">Email Address</label>
                            <input type="email" id="auth-email" required class="w-full border border-border-light dark:border-outline-variant/35 bg-surface dark:bg-[#0d1322] text-on-surface dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="name@example.com"/>
                        </div>
                        <div id="auth-password-field">
                            <div class="flex justify-between items-center mb-1">
                                <label class="block text-xs font-bold text-on-surface-variant dark:text-on-surface/75 uppercase">Password</label>
                                <button type="button" id="forgot-password-trigger" class="text-[11px] text-secondary hover:underline font-bold outline-none">Forgot Password?</button>
                            </div>
                            <input type="password" id="auth-password" class="w-full border border-border-light dark:border-outline-variant/35 bg-surface dark:bg-[#0d1322] text-on-surface dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="••••••••"/>
                        </div>
                        
                        <button type="submit" id="auth-submit-btn" class="w-full bg-[#FB6514] hover:bg-[#e0560d] text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6">
                            Sign In
                        </button>
                    </form>
                    
                    <!-- Divider -->
                    <div id="auth-divider" class="flex items-center my-6">
                        <div class="flex-1 h-px bg-border-light dark:bg-outline-variant/10"></div>
                        <span class="px-3 text-xs text-on-surface-variant dark:text-on-surface/40 uppercase font-bold">OR</span>
                        <div class="flex-1 h-px bg-border-light dark:bg-outline-variant/10"></div>
                    </div>
                    
                    <!-- Google Signup/Login -->
                    <button id="google-login-btn" class="w-full border border-border-light dark:border-outline-variant/35 bg-surface dark:bg-[#0d1322] text-primary dark:text-[#b5c4ff] hover:bg-surface-subtle dark:hover:bg-[#1a2b56]/20 py-3 rounded-lg font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.54l3.86 3C6.2 7.8 8.89 5.04 12 5.04z"/>
                            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.92 3.42-8.6z"/>
                            <path fill="#FBBC05" d="M5.28 14.77c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.42 7.54C.51 9.36 0 11.4 0 13.5s.51 4.14 1.42 5.96l3.86-2.99z"/>
                            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.11 0-5.8-2.76-6.72-5.5l-3.86 3C3.37 20.35 7.35 23 12 23z"/>
                        </svg>
                        Sign in with Google
                    </button>
                </div>
                
                <div id="auth-footer" class="p-4 bg-surface-subtle dark:bg-[#0d1322] border-t border-border-light dark:border-outline-variant/10 text-center">
                    <button id="close-auth-modal" class="text-xs text-on-surface-variant dark:text-on-surface/60 hover:text-primary dark:hover:text-white font-bold">Cancel and Go Back</button>
                </div>
            </div>
        </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const menuBtn = this.querySelector('#mobile-menu-btn');
        const drawer = this.querySelector('#mobile-drawer');
        const drawerContent = drawer.querySelector('div');
        const closeBtn = this.querySelector('#close-drawer-btn');

        const openDrawer = () => {
            drawer.classList.remove('hidden');
            setTimeout(() => {
                drawer.classList.remove('opacity-0');
                drawerContent.classList.remove('translate-x-full');
            }, 10);
        };

        const closeDrawer = () => {
            drawer.classList.add('opacity-0');
            drawerContent.classList.add('translate-x-full');
            setTimeout(() => drawer.classList.add('hidden'), 300);
        };

        menuBtn.addEventListener('click', openDrawer);
        closeBtn.addEventListener('click', closeDrawer);
        drawer.addEventListener('click', (e) => {
            if (e.target === drawer) closeDrawer();
        });

        // Set active state on current page nav-link
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('nav-link-active', 'text-primary', 'dark:text-[#b5c4ff]');
            }
        });

        // Auth Modal Triggers
        const authModal = this.querySelector('#auth-modal');
        const loginTrigger = this.querySelector('#login-btn-trigger');
        const mobileLoginTrigger = this.querySelector('#mobile-login-trigger');
        const closeAuthBtn = this.querySelector('#close-auth-modal');

        const showAuthModal = () => {
            // Reset to default login state
            this.querySelector('#auth-form').classList.remove('hidden');
            this.querySelector('#google-login-btn').classList.remove('hidden');
            this.querySelector('#auth-divider').classList.remove('hidden');
            this.querySelector('#tab-login').parentElement.classList.remove('hidden');
            
            // Trigger tab click to reset title/subtitle depending on current tab
            const activeTab = this.querySelector('.border-primary.text-primary');
            if (activeTab) activeTab.click();
            else this.querySelector('#tab-login').click();
            
            authModal.classList.remove('hidden');
            authModal.classList.add('flex');
            closeDrawer();
        };

        const hideAuthModal = () => {
            authModal.classList.add('hidden');
            authModal.classList.remove('flex');
        };

        if (loginTrigger) loginTrigger.addEventListener('click', showAuthModal);
        if (mobileLoginTrigger) mobileLoginTrigger.addEventListener('click', showAuthModal);
        if (closeAuthBtn) closeAuthBtn.addEventListener('click', hideAuthModal);

        // Tab Switching
        const tabLogin = this.querySelector('#tab-login');
        const tabSignup = this.querySelector('#tab-signup');
        const signupNameField = this.querySelector('#signup-name-field');
        const authTitle = this.querySelector('#auth-title');
        const authSubtitle = this.querySelector('#auth-subtitle');
        const authSubmitBtn = this.querySelector('#auth-submit-btn');
        const passField = this.querySelector('#auth-password-field');
        let currentMode = 'login'; // 'login' | 'signup' | 'forgot'

        tabLogin.addEventListener('click', () => {
            currentMode = 'login';
            tabLogin.className = "flex-1 py-4 font-bold text-sm text-primary dark:text-[#b5c4ff] border-b-2 border-primary dark:border-[#b5c4ff] outline-none";
            tabSignup.className = "flex-1 py-4 font-bold text-sm text-on-surface-variant dark:text-on-surface/60 border-b-2 border-transparent hover:text-primary dark:hover:text-[#b5c4ff] outline-none";
            signupNameField.classList.add('hidden');
            passField.classList.remove('hidden');
            authTitle.innerText = "Welcome Back Aspirant!";
            authSubtitle.innerText = "Enter your credentials to access your classroom.";
            authSubmitBtn.innerText = "Sign In";
        });

        tabSignup.addEventListener('click', () => {
            currentMode = 'signup';
            tabSignup.className = "flex-1 py-4 font-bold text-sm text-primary dark:text-[#b5c4ff] border-b-2 border-primary dark:border-[#b5c4ff] outline-none";
            tabLogin.className = "flex-1 py-4 font-bold text-sm text-on-surface-variant dark:text-on-surface/60 border-b-2 border-transparent hover:text-primary dark:hover:text-[#b5c4ff] outline-none";
            signupNameField.classList.remove('hidden');
            passField.classList.remove('hidden');
            authTitle.innerText = "Create Account";
            authSubtitle.innerText = "Begin your prep journey today.";
            authSubmitBtn.innerText = "Register Account";
        });

        // Forgot Password Mode
        const forgotTrigger = this.querySelector('#forgot-password-trigger');
        forgotTrigger.addEventListener('click', () => {
            currentMode = 'forgot';
            signupNameField.classList.add('hidden');
            passField.classList.add('hidden');
            authTitle.innerText = "Reset Password";
            authSubtitle.innerText = "We'll send a password recovery email.";
            authSubmitBtn.innerText = "Send Recovery Email";
        });

        // Dropdown toggle
        const avatarBtn = this.querySelector('#avatar-btn');
        const dropdown = this.querySelector('#avatar-dropdown');
        if (avatarBtn) {
            avatarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
                dropdown.classList.toggle('flex');
            });
            document.addEventListener('click', () => {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
            });
        }

        // Form Submit handler
        const form = this.querySelector('#auth-form');
        const alertBox = this.querySelector('#auth-alert');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            alertBox.classList.add('hidden');
            authSubmitBtn.disabled = true;
            const originalText = authSubmitBtn.innerText;
            authSubmitBtn.innerText = "Processing...";

            const email = this.querySelector('#auth-email').value.trim();
            const password = this.querySelector('#auth-password').value;
            const name = this.querySelector('#auth-name').value.trim();

            try {
                let loggedInUser;
                if (currentMode === 'login') {
                    loggedInUser = await window.FirebaseService.loginEmail(email, password);
                } else if (currentMode === 'signup') {
                    if (!name) throw new Error("Full Name is required for registration.");
                    loggedInUser = await window.FirebaseService.signupEmail(name, email, password);
                } else {
                    await window.FirebaseService.forgotPassword(email);
                    alertBox.innerText = "Instructions to reset your password have been emailed.";
                    alertBox.classList.remove('bg-[#3b171f]', 'text-[#ffb4ab]', 'border-[#ffb4ab]/30');
                    alertBox.classList.add('bg-[#173b22]', 'text-[#abffb4]', 'border-[#abffb4]/30');
                    alertBox.classList.remove('hidden');
                    authSubmitBtn.innerText = "Check your email";
                    setTimeout(() => {
                        hideAuthModal();
                    }, 3000);
                    return;
                }
                
                await handleAuthSuccess(loggedInUser, currentMode);
            } catch (err) {
                alertBox.innerText = err.message;
                alertBox.classList.remove('hidden');
            } finally {
                authSubmitBtn.disabled = false;
                authSubmitBtn.innerText = originalText;
            }
        });

        // Google Authentication trigger
        const googleBtn = this.querySelector('#google-login-btn');
        googleBtn.addEventListener('click', async () => {
            alertBox.classList.add('hidden');
            googleBtn.disabled = true;
            try {
                const loggedInUser = await window.FirebaseService.loginGoogle();
                await handleAuthSuccess(loggedInUser, 'google');
            } catch (err) {
                alertBox.innerText = err.message;
                alertBox.classList.remove('hidden');
                googleBtn.disabled = false;
            }
        });

        // Centralized Auth Success Handler
        const handleAuthSuccess = async (loggedInUser, mode) => {
            if (!loggedInUser) {
                window.location.reload();
                return;
            }

            // Check if user is pending onboarding OR is a legacy user missing mobile
            if (loggedInUser.pendingOnboarding || (!loggedInUser.mobile && loggedInUser.role !== 'admin')) {
                hideAuthModal();
                if (window.OnboardingService) {
                    window.OnboardingService.requestMobileNumber(loggedInUser, () => {
                        const finalUser = window.FirebaseService.getCurrentUser();
                        if (loggedInUser.pendingOnboarding) finalUser.isNewUser = true;
                        finalizeRedirect(finalUser, mode);
                    });
                } else {
                    console.error("OnboardingService missing. Falling back to immediate redirect.");
                    finalizeRedirect(loggedInUser, mode);
                }
                return; // Wait for onboarding submit
            }

            finalizeRedirect(loggedInUser, mode);
        };

        const finalizeRedirect = async (loggedInUser, mode) => {
            hideAuthModal();
            this.updateAuthState();
            if (loggedInUser.role === 'admin') {
                window.location.replace("admin-dashboard.html");
            } else {
                // If already on the payment page, just reload so the form prefills
                if (window.location.pathname.includes('upi-payment.html')) {
                    window.location.reload();
                    return;
                }
                
                // ── State-Based Routing ──────────────────────────────────────────
                // Source of truth per collections.md:
                //   enrollments.status: 'active' | 'revoked'
                //   paymentRequests.status: 'pending' | 'approved' | 'rejected'
                //
                // Routing rules:
                //   1. Has active enrollment              → student-dashboard.html
                //   2. Has ANY payment request record
                //      (pending / approved / rejected)   → student-dashboard.html
                //      (dashboard overlays handle each status message)
                //   3. No enrollments & no payment record → upi-payment.html
                //      (total payment abandonment / brand new user)
                // ────────────────────────────────────────────────────────────────
                let hasEnrollments = false;
                let hasAnyPaymentRecord = false;
                
                try {
                    // Check 1: active enrollments
                    const enrollments = await window.FirebaseService.getUserEnrollments(loggedInUser.uid);
                    if (enrollments && enrollments.length > 0) hasEnrollments = true;
                    
                    // Check 2: any payment record (only needed when no active enrollment)
                    if (!hasEnrollments) {
                        const latestPayment = await window.FirebaseService.getLatestPaymentRequest(loggedInUser.uid);
                        // Per collections.md: status can be 'pending', 'approved', or 'rejected'
                        // All three mean they have engaged with the payment process.
                        // The dashboard will render the correct overlay for each.
                        if (latestPayment && ['pending', 'approved', 'rejected'].includes(latestPayment.status)) {
                            hasAnyPaymentRecord = true;
                        }
                    }
                } catch(e) {
                    console.error("State-based routing check failed:", e);
                    // On error, eject to payment page to prevent getting stuck in "Verifying Access" loop
                    window.location.replace("upi-payment.html");
                    return;
                }

                if (!hasEnrollments && !hasAnyPaymentRecord) {
                    // Absolute no-pay scenario: eject cleanly to payment page.
                    // Use replace() to prevent the back button creating a redirect loop.
                    window.location.replace("upi-payment.html");
                } else {
                    window.location.replace("student-dashboard.html");
                }
            }
        };


        // Logout action
        const logoutTrigger = this.querySelector('#logout-btn-trigger');
        if (logoutTrigger) {
            logoutTrigger.addEventListener('click', async () => {
                await window.FirebaseService.logout();
                window.location.href = "index.html";
            });
        }
    }

    updateAuthState() {
        const user = window.FirebaseService.getCurrentUser();
        const loggedOutActions = this.querySelector('#logged-out-actions');
        const loggedInActions = this.querySelector('#logged-in-actions');
        const avatarContainer = this.querySelector('#navbar-avatar-container');
        const dropdownName = this.querySelector('#dropdown-user-name');
        const dropdownEmail = this.querySelector('#dropdown-user-email');
        const dropdownBadge = this.querySelector('#dropdown-user-role-badge');
        const adminPanelContainer = this.querySelector('#admin-panel-link-container');
        const adminDropdownContainer = this.querySelector('#admin-dropdown-link-container');
        const adminMobileContainer = this.querySelector('#admin-mobile-link-container');
        const mobileDrawerAuth = this.querySelector('#mobile-drawer-auth-block');

        // Enroll Now visibility: only on landing page index.html
        const isLandingPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.split('/').pop() === '';

        if (user) {
            // Logged In state
            if (loggedOutActions) {
                loggedOutActions.classList.add('hidden');
                loggedOutActions.classList.remove('sm:flex');
            }
            if (loggedInActions) {
                loggedInActions.classList.remove('hidden');
                loggedInActions.classList.add('sm:flex');
            }
            
            // Hide Demo Classes and Success Stories nav links if logged in
            this.querySelectorAll('.nav-link').forEach(link => {
                const href = link.getAttribute('href') || '';
                if (href.includes('#demo') || href.includes('#success')) {
                    link.classList.add('hidden');
                }
            });
            
            // Render initials avatar SVG
            if (avatarContainer) {
                avatarContainer.innerHTML = getInitialsAvatarSvg(user.name);
            }
            
            if (dropdownName) dropdownName.innerText = user.name;
            if (dropdownEmail) dropdownEmail.innerText = user.email;
            
            if (dropdownBadge) {
                dropdownBadge.innerText = user.role;
                if (user.role === 'admin') {
                    dropdownBadge.className = "inline-block mt-2 text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-error-container text-error border border-error/20";
                } else {
                    dropdownBadge.className = "inline-block mt-2 text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20";
                }
            }
            
            // If admin, show Admin Panel link in navbars
            if (user.role === 'admin') {
                if (adminPanelContainer) {
                    adminPanelContainer.innerHTML = `
                        <a class="nav-link text-on-surface-variant dark:text-on-surface/80 hover:text-primary dark:hover:text-[#b5c4ff] transition-colors font-body-md text-body-md" href="admin-dashboard.html">Admin Panel</a>
                    `;
                }
                if (adminDropdownContainer) {
                    adminDropdownContainer.innerHTML = `
                        <a href="admin-dashboard.html" class="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle dark:hover:bg-[#0d1322] text-on-surface-variant dark:text-on-surface text-sm transition-colors border-t border-border-light dark:border-outline-variant/10">
                            <span class="material-symbols-outlined text-lg">admin_panel_settings</span>
                            Admin Panel
                        </a>
                    `;
                }
                if (adminMobileContainer) {
                    adminMobileContainer.innerHTML = `
                        <a href="admin-dashboard.html" class="text-on-surface-variant dark:text-on-surface hover:text-[#FB6514] transition-colors">Admin Panel</a>
                    `;
                }
            } else {
                if (adminPanelContainer) adminPanelContainer.innerHTML = '';
                if (adminDropdownContainer) adminDropdownContainer.innerHTML = '';
                if (adminMobileContainer) adminMobileContainer.innerHTML = '';
            }

            // Hide Mobile Auth actions if logged in
            if (mobileDrawerAuth) {
                mobileDrawerAuth.innerHTML = `
                    <div class="flex items-center gap-3 p-3 rounded-lg bg-surface-subtle dark:bg-[#151b2b] border border-border-light dark:border-outline-variant/20 mb-3">
                        ${getInitialsAvatarSvg(user.name)}
                        <div class="min-w-0">
                            <p class="font-bold text-sm text-primary dark:text-[#b5c4ff] truncate leading-tight">${user.name}</p>
                            <p class="text-[10px] text-on-surface-variant truncate mt-0.5">${user.role.toUpperCase()}</p>
                        </div>
                    </div>
                    <a href="student-dashboard.html" class="w-full text-center py-2.5 bg-[#FB6514] text-white rounded-lg font-bold text-sm mb-2">Student Dashboard</a>
                    <a href="course-workspace.html" class="w-full text-center py-2.5 bg-primary text-white rounded-lg font-bold text-sm mb-2">Course Workspace</a>
                    <button id="mobile-logout-btn" class="w-full text-center py-2.5 border border-error/30 text-error rounded-lg font-bold text-sm">Logout</button>
                `;
                this.querySelector('#mobile-logout-btn').addEventListener('click', async () => {
                    await window.FirebaseService.logout();
                    window.location.href = "index.html";
                });
            }
        } else {
            // Logged Out state
            if (loggedOutActions) {
                loggedOutActions.classList.remove('hidden');
                loggedOutActions.classList.add('sm:flex');
            }
            if (loggedInActions) {
                loggedInActions.classList.add('hidden');
                loggedInActions.classList.remove('sm:flex');
            }
            if (adminPanelContainer) adminPanelContainer.innerHTML = '';
            if (adminDropdownContainer) adminDropdownContainer.innerHTML = '';
            if (adminMobileContainer) adminMobileContainer.innerHTML = '';
            
            // Show Demo Classes and Success Stories nav links if logged out
            this.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('hidden');
            });
            
            if (mobileDrawerAuth) {
                mobileDrawerAuth.innerHTML = `
                    <button id="mobile-login-trigger" class="w-full text-center py-3 border border-border-light dark:border-outline-variant/30 rounded-lg text-primary dark:text-[#b5c4ff] hover:bg-surface-subtle dark:hover:bg-[#151b2b] font-bold">Login/Signup</button>
                    <a id="mobile-enroll-now-btn" href="upi-payment.html?course=Placement%20Prep%20Program&courseId=course-placement&price=7499" class="w-full text-center py-3 bg-[#FB6514] text-white rounded-lg hover:bg-[#e0560d] font-bold shadow-md ${isLandingPage ? '' : 'hidden'}">Enroll Now</a>
                `;
                this.querySelector('#mobile-login-trigger').addEventListener('click', () => {
                    const modal = this.querySelector('#auth-modal');
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                    this.querySelector('#mobile-drawer').classList.add('hidden');
                });
            }
        }

        // Final local overrides for Enroll buttons based on page location
        const enrollBtn = this.querySelector('#enroll-now-btn');
        const mobileEnrollBtn = this.querySelector('#mobile-enroll-now-btn');
        if (!isLandingPage) {
            if (enrollBtn) enrollBtn.classList.add('hidden');
            if (mobileEnrollBtn) mobileEnrollBtn.classList.add('hidden');
        } else {
            if (user) {
                if (enrollBtn) enrollBtn.classList.add('hidden');
                if (mobileEnrollBtn) mobileEnrollBtn.classList.add('hidden');
            }
        }
    }
}
customElements.define('custom-navbar', CustomNavbar);


// 2. Shared Footer Component
class CustomFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer class="bg-primary dark:bg-[#080e1d] text-on-primary transition-colors duration-300">
            <div class="w-full py-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-white/10">
                <div class="md:col-span-5">
                    <div class="font-headline-md text-headline-md font-bold mb-4 text-white dark:text-[#b5c4ff]">MCA Ace</div>
                    <p class="text-on-primary-container dark:text-on-surface-variant opacity-80 max-w-sm mb-6 leading-relaxed text-body-md">
                        India's leading platform for MCA entrance and placement preparation. Trusted by 50k+ students nationwide.
                    </p>
                    <div class="flex gap-4">
                        <a href="#" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center border border-white/10 transition-colors">
                            <span class="material-symbols-outlined text-white">language</span>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center border border-white/10 transition-colors">
                            <span class="material-symbols-outlined text-white">share</span>
                        </a>
                    </div>
                </div>
                <div class="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
                    <div class="flex flex-col gap-4">
                        <h5 class="font-bold text-white uppercase tracking-widest text-label-sm">Company</h5>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="#">About Us</a>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="#">Contact</a>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="index.html#success">Success Stories</a>
                    </div>
                    <div class="flex flex-col gap-4">
                        <h5 class="font-bold text-white uppercase tracking-widest text-label-sm">Resources</h5>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="#">Blog</a>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="index.html#demo">Demo Classes</a>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="#">Placement Stats</a>
                    </div>
                    <div class="flex flex-col gap-4">
                        <h5 class="font-bold text-white uppercase tracking-widest text-label-sm">Support</h5>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="#">Help Center</a>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="upi-payment.html">Payments</a>
                        <a class="text-on-primary-container dark:text-on-surface-variant opacity-85 hover:opacity-100 hover:text-white transition-all text-body-md" href="#">Refund Policy</a>
                    </div>
                </div>
            </div>
            <div class="max-w-container-max mx-auto py-8 px-margin-mobile md:px-margin-desktop flex flex-col sm:flex-row justify-between items-center gap-4 text-label-sm text-on-primary-container dark:text-on-surface-variant opacity-60">
                <span>© 2024 MCA Entrance Prep. All rights reserved.</span>
                <div class="flex gap-6">
                    <a class="hover:text-white transition-colors" href="#">Privacy Policy</a>
                    <a class="hover:text-white transition-colors" href="#">Terms of Service</a>
                </div>
            </div>
        </footer>
        `;
    }
}
customElements.define('custom-footer', CustomFooter);


// 3. Shared AI Chat Assistant Widget
class AIAssistant extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <div class="fixed bottom-8 right-8 z-[100] group" id="ai-assistant-root">
            <!-- Chat Window Dialog -->
            <div class="hidden absolute bottom-20 right-0 w-80 sm:w-96 bg-white dark:bg-[#151b2b] rounded-2xl shadow-2xl border border-border-light dark:border-outline-variant/30 overflow-hidden flex flex-col origin-bottom-right" id="chat-window">
                <!-- Header -->
                <div class="bg-primary dark:bg-[#080e1d] p-4 text-white flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-white/10 text-[#b5c4ff] rounded-full flex items-center justify-center border border-white/10">
                            <span class="material-symbols-outlined text-xl">smart_toy</span>
                        </div>
                        <div>
                            <p class="font-bold text-label-md leading-none">Ace AI Bot</p>
                            <p class="text-[10px] text-success font-medium mt-1">Online • Instant Answers</p>
                        </div>
                    </div>
                    <button class="material-symbols-outlined hover:bg-white/10 p-1.5 rounded transition-colors" id="close-chat-btn">close</button>
                </div>
                
                <!-- Chat Message Feed -->
                <div class="h-80 p-4 overflow-y-auto space-y-4 bg-surface-subtle dark:bg-[#0d1322]/50 custom-scrollbar" id="chat-messages">
                    <div class="flex gap-2.5">
                        <div class="w-6 h-6 bg-primary dark:bg-[#1a2b56] rounded-full flex-shrink-0 flex items-center justify-center text-white text-[12px]">
                            <span class="material-symbols-outlined text-sm">smart_toy</span>
                        </div>
                        <div class="bg-white dark:bg-[#151b2b] p-3 rounded-xl rounded-tl-none shadow-sm border border-border-light dark:border-outline-variant/10 text-body-md text-on-surface dark:text-on-surface">
                            Hi! I'm Ace Bot. Need help choosing a course or submitting payment proofs? Ask me anything!
                        </div>
                    </div>
                </div>
                
                <!-- Input Controls -->
                <div class="p-3 border-t border-border-light dark:border-outline-variant/20 bg-white dark:bg-[#151b2b]">
                    <form id="chat-form" class="flex gap-2">
                        <input id="chat-input" class="flex-1 border border-border-light dark:border-outline-variant/30 bg-surface dark:bg-[#0d1322] text-on-surface dark:text-on-surface placeholder:text-on-surface-variant/70 rounded-lg text-label-md px-3.5 py-2.5 focus:ring-2 focus:ring-primary dark:focus:ring-primary-container outline-none" placeholder="Ask about refund policy, courses..." type="text"/>
                        <button type="submit" class="bg-primary dark:bg-[#2e4a9e] text-white hover:opacity-90 px-3 py-2.5 rounded-lg flex items-center justify-center active:scale-95 transition-all">
                            <span class="material-symbols-outlined">send</span>
                        </button>
                    </form>
                </div>
            </div>
            
            <!-- Toggle Launcher Button -->
            <button id="launcher-btn" class="w-16 h-16 bg-primary dark:bg-[#2e4a9e] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all relative">
                <span class="material-symbols-outlined text-3xl">smart_toy</span>
                <!-- Pulse Dot Indicator -->
                <span class="absolute top-0 right-0 flex h-4 w-4">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-4 w-4 bg-error border-2 border-white dark:border-[#0d1322]"></span>
                </span>
            </button>
        </div>
        `;

        const launcherBtn = this.querySelector('#launcher-btn');
        const chatWindow = this.querySelector('#chat-window');
        const closeBtn = this.querySelector('#close-chat-btn');
        const chatForm = this.querySelector('#chat-form');
        const chatInput = this.querySelector('#chat-input');
        const messagesContainer = this.querySelector('#chat-messages');

        const toggleChat = () => {
            const isHidden = chatWindow.classList.contains('hidden');
            if (isHidden) {
                chatWindow.classList.remove('hidden');
                chatWindow.classList.add('animate-slide-up');
                const badge = launcherBtn.querySelector('span.absolute');
                if (badge) badge.remove();
            } else {
                chatWindow.classList.add('hidden');
                chatWindow.classList.remove('animate-slide-up');
            }
        };

        launcherBtn.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        const getBotReply = (text) => {
            const lower = text.toLowerCase();
            if (lower.includes('refund') || lower.includes('cancel')) {
                return "We offer a 100% money-back refund within the first 7 days of course enrollment. No questions asked!";
            } else if (lower.includes('course') || lower.includes('batch')) {
                return "Our top courses are the Placement Preparation Program (₹7,499) and NIMCET Ultimate Batch (₹4,999). Both offer complete DSA, mock exams, and placement mentorship.";
            } else if (lower.includes('payment') || lower.includes('screenshot') || lower.includes('verify')) {
                return "Once you scan the QR and pay, submit your details and payment screenshot on the 'upi-payment.html' page. It takes our admins 15-30 minutes to verify your access!";
            } else if (lower.includes('contact') || lower.includes('call') || lower.includes('phone')) {
                return "You can email our student support helpline at support@mcaace.com or connect via WhatsApp.";
            }
            return "Thank you for writing to us! An advisor will respond shortly. You can also view our featured courses in the syllabus section.";
        };

        const appendMessage = (sender, content) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'flex gap-2.5';
            
            if (sender === 'user') {
                msgDiv.innerHTML = `
                <div class="ml-auto bg-primary dark:bg-[#2e4a9e] text-white p-3 rounded-xl rounded-tr-none shadow-sm text-body-md max-w-[85%]">
                    ${content}
                </div>
                `;
            } else {
                msgDiv.innerHTML = `
                <div class="w-6 h-6 bg-primary dark:bg-[#1a2b56] rounded-full flex-shrink-0 flex items-center justify-center text-white text-[12px]">
                    <span class="material-symbols-outlined text-sm">smart_toy</span>
                </div>
                <div class="bg-white dark:bg-[#151b2b] p-3 rounded-xl rounded-tl-none shadow-sm border border-border-light dark:border-outline-variant/10 text-body-md text-on-surface dark:text-on-surface max-w-[85%]">
                    ${content}
                </div>
                `;
            }
            messagesContainer.appendChild(msgDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const queryText = chatInput.value.trim();
            if (!queryText) return;

            appendMessage('user', queryText);
            chatInput.value = '';

            setTimeout(() => {
                const reply = getBotReply(queryText);
                appendMessage('bot', reply);
            }, 800);
        });
    }
}
customElements.define('ai-assistant', AIAssistant);


// 4. Admin Dashboard Navigation Sidebar
class AdminSidebar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <aside class="fixed left-0 top-0 h-screen flex flex-col py-6 bg-surface-subtle dark:bg-[#151b2b] border-r border-border-light dark:border-outline-variant/20 w-64 z-50 transition-colors duration-300">
            <!-- Brand Identity -->
            <div class="px-6 mb-10 flex flex-col gap-1">
                <a href="index.html" class="font-title-lg text-title-lg font-bold text-primary dark:text-[#b5c4ff] hover:opacity-80 transition-opacity">Admin Portal</a>
                <p class="text-on-surface-variant dark:text-on-surface/60 font-label-sm text-label-sm">Management Console</p>
            </div>
            
            <!-- Navigation Items -->
            <nav class="flex-1 space-y-1">
                <a class="sidebar-link flex items-center gap-3 rounded-lg px-4 py-3 mx-2 text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container dark:hover:bg-[#0d1322] hover:text-primary dark:hover:text-[#b5c4ff] transition-all" href="admin-dashboard.html">
                    <span class="material-symbols-outlined">payments</span>
                    <span class="font-label-md text-label-md">Payment Verification</span>
                </a>
                <a class="sidebar-link flex items-center gap-3 rounded-lg px-4 py-3 mx-2 text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container dark:hover:bg-[#0d1322] hover:text-primary dark:hover:text-[#b5c4ff] transition-all" href="admin-curriculum.html">
                    <span class="material-symbols-outlined">menu_book</span>
                    <span class="font-label-md text-label-md">Course Curriculum</span>
                </a>
                <a class="sidebar-link flex items-center gap-3 rounded-lg px-4 py-3 mx-2 text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container dark:hover:bg-[#0d1322] hover:text-primary dark:hover:text-[#b5c4ff] transition-all" href="admin-students.html">
                    <span class="material-symbols-outlined">how_to_reg</span>
                    <span class="font-label-md text-label-md">Student Access</span>
                </a>
                <a class="sidebar-link flex items-center gap-3 rounded-lg px-4 py-3 mx-2 text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container dark:hover:bg-[#0d1322] hover:text-primary dark:hover:text-[#b5c4ff] transition-all" href="admin-student-manager.html">
                    <span class="material-symbols-outlined">group</span>
                    <span class="font-label-md text-label-md">Student Manager</span>
                </a>
                <a class="sidebar-link flex items-center gap-3 rounded-lg px-4 py-3 mx-2 text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container dark:hover:bg-[#0d1322] hover:text-primary dark:hover:text-[#b5c4ff] transition-all" href="admin-mocktests.html">
                    <span class="material-symbols-outlined">quiz</span>
                    <span class="font-label-md text-label-md">Mock Test Manager</span>
                </a>
                <button id="sidebar-logout-btn" class="flex w-[calc(100%-16px)] items-center gap-3 rounded-lg px-4 py-3 mx-2 text-error hover:bg-error/10 hover:text-error transition-all font-bold text-left outline-none cursor-pointer">
                    <span class="material-symbols-outlined">logout</span>
                    <span class="font-label-md text-label-md">Logout</span>
                </button>
            </nav>
            
            <!-- Admin Profile block -->
            <div id="sidebar-admin-profile" class="px-4 mt-auto"></div>
        </aside>
        `;

        this.renderProfileBlock();

        // Highlight active link in sidebar
        const currentPage = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
        this.querySelectorAll('.sidebar-link').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.remove('text-on-surface-variant');
                link.classList.add('bg-secondary-container', 'text-on-secondary-container', 'dark:bg-[#cd4802]', 'dark:text-white', 'font-bold');
            }
        });

        // Bind logout event
        const logoutBtn = this.querySelector('#sidebar-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await window.FirebaseService.logout();
                window.location.href = "index.html";
            });
        }
    }

    renderProfileBlock() {
        const user = window.FirebaseService.getCurrentUser();
        const profileBox = this.querySelector('#sidebar-admin-profile');
        if (profileBox) {
            if (user) {
                profileBox.innerHTML = `
                    <div class="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low dark:bg-[#0d1322] border border-border-light dark:border-outline-variant/10">
                        ${getInitialsAvatarSvg(user.name)}
                        <div class="min-w-0">
                            <p class="font-label-md text-label-md text-primary dark:text-[#b5c4ff] truncate leading-tight">${user.name}</p>
                            <p class="text-[9px] text-on-surface-variant dark:text-on-surface/50 uppercase tracking-widest font-bold mt-1">${user.role}</p>
                        </div>
                    </div>
                `;
            } else {
                profileBox.innerHTML = `
                    <div class="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low dark:bg-[#0d1322] border border-border-light dark:border-outline-variant/10">
                        <span class="material-symbols-outlined text-primary text-xl">account_circle</span>
                        <div class="min-w-0">
                            <p class="font-label-md text-label-md text-primary dark:text-[#b5c4ff] truncate leading-tight">Anonymous Admin</p>
                            <p class="text-[9px] text-on-surface-variant dark:text-on-surface/50 uppercase tracking-widest font-bold mt-1">Not Signed In</p>
                        </div>
                    </div>
                `;
            }
        }
    }
}
customElements.define('admin-sidebar', AdminSidebar);
