document.addEventListener('DOMContentLoaded', () => {
    // Utility to show full-screen states without destroying Web Components
    const showStateOverlay = (contentHTML) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[9999] bg-gray-100 flex items-center justify-center p-6';
        overlay.innerHTML = contentHTML;
        document.body.appendChild(overlay);
    };

    // Authentication Guard with native listener fallback
    const checkAuthAndInit = async () => {
        let user = null;
        if (!window.useFallback && window.auth) {
            user = await new Promise(resolve => {
                let resolved = false;
                const unsubscribe = window.auth.onAuthStateChanged(u => {
                    if (!resolved) {
                        resolved = true;
                        unsubscribe();
                        // Even if u is present, we want our full user object from local storage / Firestore
                        resolve(window.FirebaseService.getCurrentUser());
                    }
                });
                // 2 second fallback just in case the event doesn't fire
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        unsubscribe();
                        resolve(window.FirebaseService.getCurrentUser());
                    }
                }, 2000);
            });
        } else {
            user = window.FirebaseService.getCurrentUser();
        }

        if (!user) {
            window.location.href = "index.html";
            return;
        }
        if (user.role === 'admin') {
            window.location.href = "admin-dashboard.html";
            return;
        }
        
        // Banned user check
        if (user.isActive === false) {
            showStateOverlay(`
                <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-border-light">
                    <span class="material-symbols-outlined text-error text-6xl mb-4">block</span>
                    <h2 class="text-2xl font-bold text-primary mb-2">Account Suspended</h2>
                    <p class="text-sm text-on-surface-variant mb-6">Your account has been deactivated. Please contact support.</p>
                    <a href="index.html" class="bg-primary hover:bg-[#1a2b56] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-all block w-full">Back to Home</a>
                </div>
            `);
            return;
        }

        // Render student metadata
        const nameEl = document.getElementById('student-name');
        if(nameEl) nameEl.innerText = user.name;
        
        // Fetch user statistics from authoritative profile
        const mockExamsCount = user.totalMockExamsTaken || 0;
        const mockCountEl = document.getElementById('stat-mock-count');
        if(mockCountEl) mockCountEl.innerText = mockExamsCount;

        // Initialize Dashboard Data
        await initDashboard(user);
    };

    const initDashboard = async (user) => {
        try {
            if (!user) return;
            
            // Initialize Notifications Engine
            initNotifications(user);
            const courses = await window.FirebaseService.getCourses();
            const enrolledGrid = document.getElementById('enrolled-courses-grid');
            const exploreGrid = document.getElementById('explore-courses-grid');

            let enrolledHTML = '';
            let exploreHTML = '';
            let enrolledCount = 0;
            let totalCompleted = 0;
            let totalSyllabusLessons = 0;
            let enrolledCourseIds = [];

            // Fetch Last Watched Progress for "Continue Learning" banner
            const lastWatched = await window.FirebaseService.getLastWatchedProgress(user.uid);
            if (lastWatched) {
                const continueSection = document.getElementById('continue-learning-section');
                if (continueSection) {
                    const courseTitle = courses.find(c => c.id === lastWatched.courseId)?.title || 'Your Course';
                    document.getElementById('continue-course-title').innerText = courseTitle;
                    document.getElementById('continue-progress').style.width = `${lastWatched.completionPercent || 0}%`;
                    document.getElementById('continue-progress-text').innerText = `${lastWatched.completionPercent || 0}%`;
                    document.getElementById('btn-continue-learning').href = `course-workspace.html?course=${lastWatched.courseId}&lesson=${lastWatched.lessonId}`;
                    continueSection.classList.remove('hidden');
                }
            }

            for (const course of courses) {
                const isEnrolled = await window.FirebaseService.checkEnrolled(user.uid, course.id);
                const { lessons } = await window.FirebaseService.getSyllabus(course.id);
                totalSyllabusLessons += lessons.length;

                // Fetch user's completion progress
                const progressList = await window.FirebaseService.getLessonProgress(user.uid, course.id);
                const completedLessons = progressList.filter(p => p.status === 'completed' || p.isCompleted).length;
                totalCompleted += completedLessons;

                const percent = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

                if (isEnrolled) {
                    enrolledCount++;
                    enrolledCourseIds.push(course.id);
                    enrolledHTML += `
                        <div class="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                            <div class="p-6 md:p-8 flex-1 flex flex-col justify-between">
                                <div>
                                    <div class="flex justify-between items-start mb-4">
                                        <span class="bg-success/10 text-success text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border border-success/20">Enrolled & Active</span>
                                        <span class="text-xs text-on-surface-variant font-bold">${completedLessons}/${lessons.length} Completed</span>
                                    </div>
                                    <h3 class="font-headline-md text-xl text-primary font-bold mb-2 group-hover:text-secondary transition-colors">${course.title}</h3>
                                    <p class="text-xs text-on-surface-variant mb-6 line-clamp-2">${course.description || 'Access full online curriculum resources, quiz libraries, and test keys.'}</p>
                                </div>
                                <div class="space-y-4">
                                    <div>
                                        <div class="flex justify-between text-[11px] font-bold mb-1">
                                            <span class="text-on-surface-variant">Course Progress</span>
                                            <span class="text-primary">${percent}%</span>
                                        </div>
                                        <div class="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                                            <div class="bg-[#FB6514] h-full rounded-full" style="width: ${percent}%"></div>
                                        </div>
                                    </div>
                                        <a href="course-workspace.html?course=${course.id}" class="w-full col-span-2 bg-primary hover:bg-[#1e2b56] text-white text-center py-2.5 rounded-lg font-bold text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1">
                                            <span class="material-symbols-outlined text-sm">play_circle</span>
                                            Resume Learning
                                        </a>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    exploreHTML += `
                        <div class="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                            <div class="aspect-video w-full relative overflow-hidden bg-primary/5">
                                <div class="absolute inset-0 bg-[#021541]/10 z-10"></div>
                                <span class="absolute top-4 left-4 bg-[#FB6514] text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded z-20">Premium Course</span>
                                <div class="w-full h-full flex items-center justify-center text-primary/10">
                                    <span class="material-symbols-outlined text-[64px]" style="font-variation-settings: 'FILL' 1;">school</span>
                                </div>
                            </div>
                            <div class="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 class="font-bold text-primary text-base mb-1.5 group-hover:text-[#FB6514] transition-colors">${course.title}</h3>
                                    <p class="text-xs text-on-surface-variant line-clamp-2 mb-4">${course.description || 'Premium entrance curriculum with extensive modules and live revision mocks.'}</p>
                                </div>
                                <div class="pt-4 border-t border-border-light flex justify-between items-center">
                                    <div class="flex flex-col">
                                        <span class="text-xs text-on-surface-variant line-through">₹8,999</span>
                                        <span class="font-bold text-primary text-sm">₹${course.price || '4,999'}</span>
                                    </div>
                                    <a href="upi-payment.html?course=${encodeURIComponent(course.title)}&courseId=${encodeURIComponent(course.id)}&price=${course.price || '4,999'}" class="bg-[#FB6514] hover:bg-[#e0560d] text-white font-bold text-xs px-4 py-2 rounded shadow transition-all active:scale-95">
                                        Enroll Now
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            const statEnrolledEl = document.getElementById('stat-enrolled-count');
            if(statEnrolledEl) statEnrolledEl.innerText = enrolledCount;
            
            const badgeEl = document.getElementById('completed-badge');
            if(badgeEl) badgeEl.innerText = `${totalCompleted} / ${totalSyllabusLessons}`;

            if (enrolledCount === 0) {
                const latestPayment = await window.FirebaseService.getLatestPaymentRequest(user.uid);
                
                if (latestPayment && ['pending', 'rejected', 'approved'].includes(latestPayment.status)) {
                    // Remove shield so overlay is visible
                    const shield = document.getElementById('dashboard-shield');
                    if (shield) shield.remove();
                }
                
                if (latestPayment && latestPayment.status === 'pending') {
                    showStateOverlay(`
                        <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-border-light">
                            <span class="material-symbols-outlined text-pending text-6xl mb-4">hourglass_empty</span>
                            <h2 class="text-2xl font-bold text-primary mb-2">Payment Pending Approval</h2>
                            <p class="text-sm text-on-surface-variant mb-6">We have received your payment for <b>${latestPayment.course || 'a course'}</b> and it is currently under review by our admin. You will gain access soon.</p>
                            <button onclick="window.FirebaseService.logout().then(() => window.location.href='index.html')" class="bg-primary hover:bg-[#1a2b56] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-all block w-full">Logout</button>
                        </div>
                    `);
                    return;
                } else if (latestPayment && latestPayment.status === 'rejected') {
                    showStateOverlay(`
                        <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-border-light">
                            <span class="material-symbols-outlined text-error text-6xl mb-4">cancel</span>
                            <h2 class="text-2xl font-bold text-primary mb-2">Payment Rejected</h2>
                            <p class="text-sm text-on-surface-variant mb-6">Your recent payment request was rejected by the administrator. Please check your details or contact support.</p>
                            <a href="upi-payment.html" class="bg-primary hover:bg-[#1a2b56] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-all block w-full mb-3">Submit New Payment</a>
                            <button onclick="window.FirebaseService.logout().then(() => window.location.href='index.html')" class="text-on-surface-variant hover:text-primary font-bold text-sm">Logout</button>
                        </div>
                    `);
                    return;
                } else if (latestPayment && latestPayment.status === 'approved') {
                    showStateOverlay(`
                        <div class="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-border-light">
                            <span class="material-symbols-outlined text-success text-6xl mb-4">check_circle</span>
                            <h2 class="text-2xl font-bold text-primary mb-2">Provisioning Course</h2>
                            <p class="text-sm text-on-surface-variant mb-6">Your payment was approved! We are currently provisioning your course workspace. This usually takes less than a minute. Please refresh the page.</p>
                            <button onclick="window.location.reload()" class="bg-primary hover:bg-[#1a2b56] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-all block w-full mb-3">Refresh Dashboard</button>
                            <button onclick="window.FirebaseService.logout().then(() => window.location.href='index.html')" class="text-on-surface-variant hover:text-primary font-bold text-sm">Logout</button>
                        </div>
                    `);
                    return;
                }
                
                // User has 0 active enrollments and no payment record at all.
                // Use replace() so the back button cannot create a redirect loop.
                window.location.replace("upi-payment.html");

                return;
            } else {
                if(enrolledGrid) {
                    enrolledGrid.innerHTML = enrolledCount > 0 ? enrolledHTML : `
                    <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-border-light">
                        <span class="material-symbols-outlined text-border-light text-5xl mb-3">sentiment_dissatisfied</span>
                        <h3 class="font-bold text-primary mb-1">No Active Courses</h3>
                        <p class="text-xs text-on-surface-variant">You are not enrolled in any programs yet. Explore below to start your journey.</p>
                    </div>
                    `;
                }
            }

            if(exploreGrid) exploreGrid.innerHTML = exploreHTML;

            // Initialize Mock Test Hub
            const badge = document.getElementById('mock-tests-highlight-badge');
            if (badge) badge.remove(); // Removed in new architecture

            // Bind Load Button
            const loadBtn = document.getElementById('load-mock-tests-btn');
            if(loadBtn) {
                loadBtn.addEventListener('click', async () => {
                    const container = document.getElementById('mock-tests-container');
                    const masterGrid = document.getElementById('mock-tests-grid');
                    container.classList.remove('hidden');
                    loadBtn.classList.add('hidden');
                    
                    if (!enrolledCourseIds || enrolledCourseIds.length === 0) {
                        masterGrid.innerHTML = '<div class="col-span-full text-center py-8 text-on-surface-variant text-xs font-bold">No enrolled courses to load mock tests for.</div>';
                        return;
                    }
                    
                    masterGrid.innerHTML = ''; // Clear
                    masterGrid.className = 'space-y-8'; // Change from unified grid to vertical stack of course sections
                    
                    // Zero-read attempt lookups
                    const summaries = user.attemptSummaries || {};
                    
                    const renderTestCard = (test) => {
                        const attempt = summaries[test.id];
                        const isCompleted = !!attempt;
                        const bestScore = attempt ? attempt.percent : 0;
                        
                        return `
                            <div class="bg-white rounded-xl border border-border-light p-5 shadow-sm flex flex-col justify-between hover:border-primary transition-colors">
                                <div>
                                    <div class="flex justify-between items-start mb-3">
                                        <span class="bg-${isCompleted ? 'success' : 'rose-500'}/10 text-${isCompleted ? 'success' : 'rose-500'} text-[9px] uppercase font-bold px-2 py-0.5 rounded border border-${isCompleted ? 'success' : 'rose-500'}/20">${isCompleted ? 'Completed' : 'New'}</span>
                                        ${isCompleted ? \`<span class="text-xs font-bold text-primary">Best: \${bestScore}%</span>\` : ''}
                                    </div>
                                    <h3 class="font-bold text-primary text-sm mb-1 line-clamp-2">${test.title}</h3>
                                    <p class="text-[11px] text-on-surface-variant font-semibold mb-4">${test.durationMinutes} mins • ${test.totalMarks || (test.questions ? test.questions.length * 4 : 0)} Marks</p>
                                </div>
                                <a href="mocktest.html?course=${test.courseId}&testId=${test.id}" class="w-full text-center flex items-center justify-center gap-1 ${isCompleted ? 'bg-surface-subtle text-primary border border-border-light hover:bg-surface-container' : 'bg-[#FB6514] text-white hover:bg-[#e0560d]'} text-xs font-bold py-2 rounded-lg shadow-sm transition-all active:scale-95">
                                    <span class="material-symbols-outlined text-[14px]">${isCompleted ? 'replay' : 'play_arrow'}</span>
                                    ${isCompleted ? 'Retake Test' : 'Take Now'}
                                </a>
                            </div>
                        `;
                    };

                    for (const cid of enrolledCourseIds) {
                        const courseObj = activeCourses.find(c => c.id === cid) || { title: 'Enrolled Course' };
                        
                        const section = document.createElement('div');
                        section.className = 'border border-border-light rounded-2xl p-6 bg-surface-subtle';
                        section.innerHTML = `
                            <h3 class="font-bold text-primary text-lg mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-secondary">school</span> 
                                ${courseObj.title} Mocks
                            </h3>
                            <div id="grid-${cid}" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                                <div class="col-span-full text-center py-4"><span class="material-symbols-outlined animate-spin text-primary">autorenew</span></div>
                            </div>
                            <div class="text-center">
                                <button id="load-more-${cid}" class="hidden bg-white border border-border-light text-xs font-bold text-primary hover:bg-surface-container px-6 py-2 rounded-full shadow-sm outline-none transition-all">Load Older Tests</button>
                            </div>
                        `;
                        masterGrid.appendChild(section);
                        
                        const subGrid = document.getElementById(`grid-${cid}`);
                        const loadMoreBtn = document.getElementById(`load-more-${cid}`);
                        
                        let lastDocCursor = null;
                        
                        const fetchAndRender = async () => {
                            try {
                                const result = await window.FirebaseService.getMockTestsPaginated(cid, lastDocCursor, 6);
                                if (lastDocCursor === null) subGrid.innerHTML = '';
                                
                                if (result.tests.length === 0 && lastDocCursor === null) {
                                    subGrid.innerHTML = '<div class="col-span-full text-center py-4 text-on-surface-variant text-xs">No mock tests available for this course yet.</div>';
                                } else {
                                    result.tests.forEach(test => {
                                        subGrid.insertAdjacentHTML('beforeend', renderTestCard(test));
                                    });
                                }
                                
                                lastDocCursor = result.lastVisible;
                                
                                if (result.hasMore) {
                                    loadMoreBtn.classList.remove('hidden');
                                } else {
                                    loadMoreBtn.classList.add('hidden');
                                }
                            } catch(e) {
                                console.error("Error loading mock tests for", cid, e);
                                if (lastDocCursor === null) {
                                    subGrid.innerHTML = '<div class="col-span-full text-center py-4 text-error text-xs">Failed to load tests.</div>';
                                }
                            }
                        };
                        
                        await fetchAndRender();
                        
                        loadMoreBtn.addEventListener('click', async () => {
                            const originalText = loadMoreBtn.innerText;
                            loadMoreBtn.innerText = 'Loading...';
                            loadMoreBtn.disabled = true;
                            await fetchAndRender();
                            loadMoreBtn.innerText = originalText;
                            loadMoreBtn.disabled = false;
                        });
                    }
                });
            }

            // Clear generic dashboard loading shield
            const shield = document.getElementById('dashboard-shield');
            if(shield) {
                shield.classList.add('opacity-0');
                setTimeout(() => shield.remove(), 500);
            }
            
        } catch (e) {
            console.error("Dashboard initialization error:", e);
            const shield = document.getElementById('dashboard-shield');
            if (shield) shield.remove();
            // On any unexpected error (like missing collections), eject to payment to prevent being stuck
            window.location.replace("upi-payment.html");
        }
    };

    // --- NOTIFICATION ENGINE ---
    let allNotifs = [];
    let notifsLoadedCount = 0;
    const notifsPerLoad = 5;

    const initNotifications = async (user) => {
        const bellBtn = document.getElementById('notif-bell-btn');
        const dropdown = document.getElementById('notif-dropdown');
        const closeBtn = document.getElementById('close-notif-btn');
        const listEl = document.getElementById('notif-list');
        const loadMoreBtn = document.getElementById('notif-load-more-btn');
        const loadMoreContainer = document.getElementById('notif-load-more-container');
        const badge = document.getElementById('notif-badge');

        if(!bellBtn || !dropdown || !listEl) return;

        try {
            if(typeof window.FirebaseService.getNotificationsPaginated === 'function') {
                allNotifs = await window.FirebaseService.getNotificationsPaginated(user.uid);
            }
            
            const getTime = (ts) => ts?.seconds ? ts.seconds * 1000 : new Date(ts).getTime();

            if (allNotifs.length > 0) {
                const latestTime = getTime(allNotifs[0].createdAt);
                const lastRead = user.lastNotifReadAt ? getTime(user.lastNotifReadAt) : 0;
                
                if (latestTime > lastRead) {
                    badge.classList.remove('hidden');
                    badge.classList.add('animate-pulse');
                }
            }

            const renderChunk = () => {
                const chunk = allNotifs.slice(notifsLoadedCount, notifsLoadedCount + notifsPerLoad);
                if (notifsLoadedCount === 0) listEl.innerHTML = ''; 
                
                if (chunk.length === 0 && notifsLoadedCount === 0) {
                    listEl.innerHTML = `<div class="p-8 text-center text-on-surface-variant text-xs font-semibold">You're all caught up! No announcements yet.</div>`;
                    if(loadMoreContainer) loadMoreContainer.classList.add('hidden');
                    return;
                }

                const chunkHtml = chunk.map(n => {
                    const dStr = new Date(getTime(n.createdAt)).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                    return `
                        <div class="p-4 hover:bg-surface-subtle transition-colors">
                            <div class="flex justify-between items-start mb-1">
                                <h4 class="font-bold text-primary text-sm">${n.title}</h4>
                                <span class="text-[10px] text-on-surface-variant shrink-0 ml-2 font-semibold">${dStr}</span>
                            </div>
                            <p class="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">${n.message}</p>
                        </div>
                    `;
                }).join('');

                listEl.insertAdjacentHTML('beforeend', chunkHtml);
                notifsLoadedCount += chunk.length;

                if(loadMoreContainer) {
                    if (notifsLoadedCount >= allNotifs.length) {
                        loadMoreContainer.classList.add('hidden');
                    } else {
                        loadMoreContainer.classList.remove('hidden');
                    }
                }
            };

            renderChunk();

            if(loadMoreBtn) loadMoreBtn.onclick = () => renderChunk();

        } catch (err) {
            console.error("Notifications Failed to Load", err);
            listEl.innerHTML = `<div class="p-8 text-center text-error text-xs font-bold">Failed to load announcements.</div>`;
        }

        bellBtn.onclick = async () => {
            dropdown.classList.toggle('hidden');
            if (!dropdown.classList.contains('hidden') && !badge.classList.contains('hidden')) {
                badge.classList.add('hidden');
                badge.classList.remove('animate-pulse');
                if(typeof window.FirebaseService.markNotificationsRead === 'function') {
                    await window.FirebaseService.markNotificationsRead(user.uid);
                }
                user.lastNotifReadAt = new Date().toISOString();
                localStorage.setItem('mca_current_user', JSON.stringify(user));
            }
        };

        if(closeBtn) closeBtn.onclick = () => dropdown.classList.add('hidden');
    };

    // Kick off
    checkAuthAndInit();
});
