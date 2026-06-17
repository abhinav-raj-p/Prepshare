document.addEventListener('DOMContentLoaded', () => {
    // YT Iframe Player variables
    let ytPlayerInstance = null;
    let ytPlayer = null;
    let activeLesson = null;
    let activeCourseId = "course-placement";
    let isEnrolled = false;
    let progressMap = {}; // lessonId -> progressDoc
    let initialTargetLessonId = null;
    let currentUser = null;

    // Toast Notification System
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-[#ef4444]' : 'bg-[#22c55e]';
        toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg z-[9999] transform translate-y-20 opacity-0 transition-all duration-300 font-bold text-sm flex items-center gap-2`;
        toast.innerHTML = `<span class="material-symbols-outlined text-lg">${type === 'error' ? 'error' : 'check_circle'}</span> ${message}`;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.remove('translate-y-20', 'opacity-0'));
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    let autoAdvanceTimer = null;
    const showAutoAdvanceOverlay = (nextLessonId, nextLessonTitle) => {
        if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
        
        const container = document.getElementById('player-container');
        if (!container) return;
        
        let overlay = document.getElementById('auto-advance-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'auto-advance-overlay';
            overlay.className = 'absolute inset-0 bg-[#0d1322]/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center animate-fade-in';
            container.appendChild(overlay);
        }

        let secondsLeft = 5;
        const render = () => {
            overlay.innerHTML = `
                <h4 class="font-bold text-white text-lg mb-2">Up Next:</h4>
                <p class="text-[#c5c5d3] max-w-sm mb-6">${nextLessonTitle}</p>
                <div class="flex items-center gap-4">
                    <button id="btn-cancel-advance" class="px-5 py-2 rounded-lg border border-[#2f3445] text-white hover:bg-[#2f3445] transition-colors font-bold text-sm">Cancel</button>
                    <button id="btn-play-next" class="bg-[#cd4802] hover:bg-[#b03d00] text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">play_arrow</span> Play Now (<span id="advance-counter">${secondsLeft}</span>s)
                    </button>
                </div>
            `;
            document.getElementById('btn-cancel-advance').onclick = () => {
                clearInterval(autoAdvanceTimer);
                overlay.remove();
            };
            document.getElementById('btn-play-next').onclick = () => {
                clearInterval(autoAdvanceTimer);
                overlay.remove();
                window.selectLesson(nextLessonId);
            };
        };

        render();
        autoAdvanceTimer = setInterval(() => {
            secondsLeft--;
            const counterEl = document.getElementById('advance-counter');
            if (counterEl) counterEl.innerText = secondsLeft;
            if (secondsLeft <= 0) {
                clearInterval(autoAdvanceTimer);
                overlay.remove();
                window.selectLesson(nextLessonId);
            }
        }, 1000);
    };

    // Authentication Guard with native listener fallback
    const checkAuthAndInit = async () => {
        if (!window.useFallback && window.auth) {
            currentUser = await new Promise(resolve => {
                let resolved = false;
                const unsubscribe = window.auth.onAuthStateChanged(u => {
                    if (!resolved) {
                        resolved = true;
                        unsubscribe();
                        resolve(window.FirebaseService.getCurrentUser());
                    }
                });
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        unsubscribe();
                        resolve(window.FirebaseService.getCurrentUser());
                    }
                }, 2000);
            });
        } else {
            currentUser = window.FirebaseService.getCurrentUser();
        }

        if (!currentUser) {
            showToast("Please log in to access the classroom workspace.", "error");
            setTimeout(() => window.location.href = "index.html", 1500);
            return;
        }

        // Strict Routing Guard: If not admin, check for any active enrollments or pending payments
        if (currentUser.role !== 'admin') {
            const enrollments = await window.FirebaseService.getUserEnrollments(currentUser.uid);
            if (!enrollments || enrollments.length === 0) {
                const latestPayment = await window.FirebaseService.getLatestPaymentRequest(currentUser.uid);
                if (!latestPayment || latestPayment.status !== 'pending') {
                    // Force them to payment page
                    window.location.href = "upi-payment.html";
                    return;
                }
            }
        }
        
        await initWorkspace();
    };

    // -------------------------------------------------------------
    // DYNAMIC SYLLABUS RETRIEVAL & RENDERING
    // -------------------------------------------------------------
    const initWorkspace = async () => {
        // Load course selection
        const courses = await window.FirebaseService.getCourses();
        const selector = document.getElementById('course-selector');
        
        if (!selector) return;
        
        selector.innerHTML = courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        
        // Set course from URL param if available
        const urlParams = new URLSearchParams(window.location.search);
        const urlCourse = urlParams.get('course');
        initialTargetLessonId = urlParams.get('lesson');

        if (urlCourse && courses.some(c => c.id === urlCourse)) {
            activeCourseId = urlCourse;
            selector.value = urlCourse;
        } else if (courses.length > 0) {
            activeCourseId = courses[0].id;
            selector.value = activeCourseId;
            // Graceful error if URL provided an invalid course
            if (urlCourse) {
                console.warn(`Requested course ${urlCourse} not found. Defaulting to ${activeCourseId}.`);
            }
        }

        selector.addEventListener('change', (e) => {
            activeCourseId = e.target.value;
            initialTargetLessonId = null; // Prevent contamination
            loadCourseSyllabus();
        });
        
        const syncBtn = document.getElementById('btn-sync-syllabus');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                if (activeCourseId) {
                    localStorage.removeItem(`mca_cache_syllabus_${activeCourseId}`);
                    showToast("Syncing curriculum updates...", "success");
                    loadCourseSyllabus();
                }
            });
        }

        loadCourseSyllabus();
    };

    // Expose selectLesson to window so inline onclick handlers in generated HTML can call it
    window.selectLesson = async (lessonId) => {
        // Save progress of the active lesson before changing
        await syncCurrentVideoProgress();

        // Clear any active auto-advance timers
        if (autoAdvanceTimer) {
            clearInterval(autoAdvanceTimer);
            const overlay = document.getElementById('auto-advance-overlay');
            if (overlay) overlay.remove();
        }

        const { lessons } = await window.FirebaseService.getSyllabus(activeCourseId);
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) {
            console.error(`Lesson ${lessonId} not found in course ${activeCourseId}`);
            return;
        }

        activeLesson = lesson;
        
        // Add visual active state to sidebar (You Are Here indicator)
        document.querySelectorAll('.lesson-item').forEach(el => {
            el.classList.remove('bg-[#1f2638]', 'text-white', 'font-bold');
            el.classList.add('text-[#c5c5d3]');
        });
        const activeEl = document.getElementById(`lesson-item-${lessonId}`);
        if (activeEl) {
            activeEl.classList.remove('text-[#c5c5d3]');
            activeEl.classList.add('bg-[#1f2638]', 'text-white', 'font-bold');
        }
        
        // Dynamically update URL so browser history and refreshes work flawlessly
        window.history.replaceState(null, '', `?course=${activeCourseId}&lesson=${lessonId}`);

        document.getElementById('lecture-title').innerText = lesson.title;
        document.getElementById('lecture-description').innerText = lesson.description || 'No description provided.';
        
        // Re-verify enrollment on each lesson change to prevent session hijacking if revoked
        const currentEnrollmentStatus = await window.FirebaseService.checkEnrolled(currentUser.uid, activeCourseId);
        isEnrolled = currentEnrollmentStatus; // Update global state
        const hasAccess = lesson.isFreePreview || isEnrolled || currentUser.role === 'admin';
        
        // Update manual complete button state
        const btnComplete = document.getElementById('btn-complete-lesson');
        if (progressMap[lessonId]?.isCompleted) {
            btnComplete.innerText = "Completed";
            btnComplete.className = "bg-[#22c55e] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 cursor-default";
        } else {
            btnComplete.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> Mark Completed`;
            btnComplete.className = "bg-[#cd4802] hover:bg-[#b03d00] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-all";
        }

        // Resources loading & PDF Logic
        const resCard = document.getElementById('resources-card');
        const resList = document.getElementById('resources-list');
        if (hasAccess && lesson.resources && lesson.resources.length > 0) {
            resCard.classList.remove('hidden');
            
            const processLink = (url) => {
                if (url.includes('drive.google.com/file/d/')) {
                    return url.replace(/\/view.*$/, '/preview');
                }
                return url;
            };

            resList.innerHTML = lesson.resources.map((url, i) => {
                const safeUrl = processLink(url);
                return `
                <div class="flex flex-col gap-2">
                    <button onclick="document.getElementById('pdf-frame-${i}').classList.remove('hidden'); this.classList.add('hidden');" class="flex items-center justify-center gap-2 text-xs text-white hover:opacity-90 bg-primary p-2.5 rounded-lg border border-[#2f3445] transition-all w-full text-center font-bold shadow">
                        <span class="material-symbols-outlined text-sm">visibility</span> View PDF Document ${i+1}
                    </button>
                    <iframe id="pdf-frame-${i}" src="${safeUrl}" class="hidden w-full h-[500px] border border-[#2f3445] rounded-xl" allow="autoplay" style="pointer-events: auto;"></iframe>
                </div>
                `;
            }).join('');
        } else {
            resCard.classList.add('hidden');
        }

        // Load video player if allowed
        if (hasAccess) {
            const controls = document.getElementById('custom-player-controls');
            const playerContainer = document.getElementById('player-container');
            
            if (ytPlayerInstance) {
                ytPlayerInstance.destroy();
                ytPlayerInstance = null;
                ytPlayer = null;
            }

            if (lesson.youtubeVideoId) {
                controls.classList.remove('hidden');
                playerContainer.innerHTML = ''; // Clear container for McaPlayer
                
                const prevProgress = progressMap[activeLesson.id];
                let startSecs = prevProgress ? prevProgress.watchSeconds : 0;
                
                // Edge case: If video was basically finished, restart it
                if (lesson.durationSeconds && startSecs >= lesson.durationSeconds - 2) {
                    startSecs = 0;
                }
                
                ytPlayerInstance = window.McaPlayer.create('player-container', lesson.youtubeVideoId, {
                    playBtn: 'custom-play-btn',
                    playIcon: 'custom-play-icon',
                    progressSlider: 'custom-progress',
                    timeCurrent: 'custom-time-current',
                    timeDuration: 'custom-time-duration',
                    volumeBtn: 'custom-volume-btn',
                    volumeIcon: 'custom-volume-icon',
                    volumeSlider: 'custom-volume-slider',
                    speedSelect: 'custom-speed'
                }, {
                    duration: lesson.durationSeconds,
                    onStateChange: (event) => {
                        // YT.PlayerState.PAUSED = 2, YT.PlayerState.ENDED = 0
                        if (event.data === 2) {
                            syncCurrentVideoProgress();
                        } else if (event.data === 0) {
                            syncCurrentVideoProgress(true).then(() => {
                                // Auto-Advance Logic
                                const lessonItems = Array.from(document.querySelectorAll('.lesson-item'));
                                const currentIdx = lessonItems.findIndex(el => el.id === \`lesson-item-\${activeLesson.id}\`);
                                const nextLessonEl = lessonItems[currentIdx + 1];
                                if (nextLessonEl) {
                                    const nextId = nextLessonEl.id.replace('lesson-item-', '');
                                    const nextTitle = nextLessonEl.querySelector('.truncate').innerText;
                                    showAutoAdvanceOverlay(nextId, nextTitle);
                                }
                            });
                        }
                    },
                    onReady: (player) => {
                        ytPlayer = player;
                        if (startSecs > 0 && ytPlayer.seekTo) {
                            ytPlayer.seekTo(startSecs, true);
                        }
                    }
                });
            } else {
                controls.classList.add('hidden');
                playerContainer.innerHTML = `
                    <div class="absolute inset-0 bg-[#0d1322] flex flex-col items-center justify-center p-6 text-center border border-[#2f3445] rounded-2xl">
                        <span class="material-symbols-outlined text-4xl text-[#c5c5d3] mb-3">picture_as_pdf</span>
                        <h4 class="font-bold text-white text-base">Document Lesson</h4>
                        <p class="text-xs text-[#c5c5d3] max-w-sm mt-1 mb-4">This lesson contains document resources. Please click "View PDF" below to read.</p>
                    </div>
                `;
            }
        } else {
            // Video is locked
            document.getElementById('player-container').innerHTML = `
                <div class="absolute inset-0 bg-[#0d1322]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <span class="material-symbols-outlined text-4xl text-[#ffb59a] mb-3">lock</span>
                    <h4 class="font-bold text-white text-base">Premium Lesson Lock</h4>
                    <p class="text-xs text-[#c5c5d3] max-w-sm mt-1 mb-4">This video requires course enrollment. Watch free previews in the list or enroll to continue.</p>
                    <a href="upi-payment.html?course=${encodeURIComponent(activeCourseId)}&price=7499" class="bg-[#cd4802] hover:bg-[#b03d00] text-white px-5 py-2 rounded-lg font-bold text-xs shadow-md">Unlock Full Curriculum</a>
                </div>
            `;
            document.getElementById('custom-player-controls').classList.add('hidden');
        }
    };

    const loadCourseSyllabus = async () => {
        // Check enrollment
        isEnrolled = await window.FirebaseService.checkEnrolled(currentUser.uid, activeCourseId);
        const warningBox = document.getElementById('enrollment-warning');
        const enrollBtn = document.getElementById('warning-enroll-btn');
        
        if (currentUser.role === 'admin' || isEnrolled) {
            warningBox.classList.add('hidden');
            warningBox.classList.remove('flex');
        } else {
            warningBox.classList.remove('hidden');
            warningBox.classList.add('flex');
            enrollBtn.href = `upi-payment.html?course=${encodeURIComponent(activeCourseId)}&price=7499`;
        }

        // Get progress checkmarks
        const progress = await window.FirebaseService.getLessonProgress(currentUser.uid, activeCourseId);
        progressMap = {};
        progress.forEach(p => {
            progressMap[p.lessonId] = p;
        });

        // Get curriculum modules/lessons
        const { modules, topics, lessons } = await window.FirebaseService.getSyllabus(activeCourseId);
        const accordion = document.getElementById('syllabus-accordion');
        
        if (modules.length === 0) {
            accordion.innerHTML = `<p class="text-xs text-on-surface-variant text-center py-6">No modules created yet for this course.</p>`;
            return;
        }

        accordion.innerHTML = modules.map((mod, index) => {
            const modTopics = topics ? topics.filter(t => t.moduleId === mod.id) : [];
            // Find lessons that belong to this module but do not map to any valid topic
            const orphanLessons = lessons ? lessons.filter(l => l.moduleId === mod.id && !modTopics.find(t => t.id === l.topicId)) : [];
            
            const isActive = index === 0 ? 'accordion-active' : '';
            
            return `
            <div class="accordion-item border border-[#2f3445] rounded-xl overflow-hidden bg-[#151b2b] ${isActive}">
                <button class="w-full flex items-center justify-between p-4 text-left hover:bg-[#191f2f] transition-colors outline-none font-bold text-white" onclick="toggleAccordion(this)">
                    <div class="flex items-center gap-3">
                        <span class="font-mono text-[#b5c4ff] text-xs bg-[#b5c4ff]/10 px-2 py-1 rounded">M${index+1}</span>
                        <span class="text-sm truncate max-w-[180px]">${mod.title}</span>
                    </div>
                    <span class="material-symbols-outlined rotate-icon transition-transform text-[#c5c5d3] text-sm">expand_more</span>
                </button>
                <div class="accordion-content">
                    <div class="border-t border-[#2f3445] bg-[#0d1322]">
                        ${modTopics.map((top, tIdx) => {
                            const topLessons = lessons ? lessons.filter(l => l.topicId === top.id) : [];
                            if (topLessons.length === 0) return ''; // Skip empty topics
                            return `
                            <div class="px-4 py-3 border-b border-[#2f3445]/50 last:border-0">
                                <h5 class="text-xs font-bold text-[#808090] uppercase tracking-wider mb-2">${top.title}</h5>
                                <div class="space-y-1">
                                    ${topLessons.map(les => {
                                        const isComp = progressMap[les.id]?.isCompleted;
                                        const checkIcon = isComp ? 'check_circle' : 'play_circle';
                                        const checkColor = isComp ? 'text-[#22c55e]' : 'text-[#c5c5d3]';
                                        const lockIcon = (!les.isFreePreview && !isEnrolled && currentUser.role !== 'admin') ? '<span class="material-symbols-outlined text-xs text-error ml-auto">lock</span>' : '';
                                        
                                        return `
                                        <div id="lesson-item-${les.id}" class="lesson-item flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#151b2b] cursor-pointer transition-colors text-xs text-[#c5c5d3]" onclick="window.selectLesson('${les.id}')">
                                            <span class="material-symbols-outlined text-base shrink-0 ${checkColor}">${checkIcon}</span>
                                            <span class="truncate pr-4">${les.title}</span>
                                            ${lockIcon}
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            `;
                        }).join('')}
                        
                        ${orphanLessons.length > 0 ? `
                            <div class="px-4 py-3 border-b border-[#2f3445]/50 last:border-0">
                                ${modTopics.length > 0 ? `<h5 class="text-xs font-bold text-[#808090] uppercase tracking-wider mb-2">General Lessons</h5>` : ''}
                                <div class="space-y-1">
                                    ${orphanLessons.map(les => {
                                        const isComp = progressMap[les.id]?.isCompleted;
                                        const checkIcon = isComp ? 'check_circle' : 'play_circle';
                                        const checkColor = isComp ? 'text-[#22c55e]' : 'text-[#c5c5d3]';
                                        const lockIcon = (!les.isFreePreview && !isEnrolled && currentUser.role !== 'admin') ? '<span class="material-symbols-outlined text-xs text-error ml-auto">lock</span>' : '';
                                        
                                        return `
                                        <div id="lesson-item-${les.id}" class="lesson-item flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#151b2b] cursor-pointer transition-colors text-xs text-[#c5c5d3]" onclick="window.selectLesson('${les.id}')">
                                            <span class="material-symbols-outlined text-base shrink-0 ${checkColor}">${checkIcon}</span>
                                            <span class="truncate pr-4">${les.title}</span>
                                            ${lockIcon}
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Load first lesson if lessons exist, or URL lesson
        if (initialTargetLessonId && lessons.some(l => l.id === initialTargetLessonId)) {
            window.selectLesson(initialTargetLessonId);
            initialTargetLessonId = null; // Clear after use
        } else if (initialTargetLessonId && !lessons.some(l => l.id === initialTargetLessonId)) {
            console.warn(`Requested lesson ${initialTargetLessonId} not found in course ${activeCourseId}. Defaulting to first lesson.`);
            if (lessons.length > 0) window.selectLesson(lessons[0].id);
            initialTargetLessonId = null;
        } else if (activeLesson && lessons.some(l => l.id === activeLesson.id)) {
            window.selectLesson(activeLesson.id); // Maintain active lesson across reloads
        } else if (lessons.length > 0) {
            window.selectLesson(lessons[0].id);
        }
    };

    // -------------------------------------------------------------
    // SYNC-ON-EXIT PROGRESS
    // -------------------------------------------------------------

    const syncCurrentVideoProgress = async (forceComplete = false) => {
        if (!ytPlayer || !activeLesson || !ytPlayer.getCurrentTime) return;
        
        // Prevent infinite quota bypass: If it's already completed, downgrade forceComplete.
        if (forceComplete && progressMap[activeLesson.id]?.isCompleted) {
            forceComplete = false;
        }
        
        const currTime = Math.round(ytPlayer.getCurrentTime());
        const duration = Math.round(ytPlayer.getDuration()) || activeLesson.durationSeconds;
        
        if (currTime === 0 && !forceComplete) return;

        // Trigger sync only if changed
        const res = await window.FirebaseService.saveProgress(
            currentUser.uid,
            activeCourseId,
            activeLesson.id,
            currTime,
            duration,
            forceComplete
        );

        // Even for local updates, we update the local progress Map so the checkmark stays green 
        // without a full page refresh if they complete the lesson.
        if (res && res.success) {
            progressMap[activeLesson.id] = res.data;
            if (res.data.isCompleted) {
                 // Reload syllabus to update checkmarks if it newly completed
                 const list = await window.FirebaseService.getLessonProgress(currentUser.uid, activeCourseId);
                 list.forEach(p => {
                     progressMap[p.lessonId] = p;
                 });
            }
        }
    };

    // Manual complete trigger button
    const completeBtn = document.getElementById('btn-complete-lesson');
    if (completeBtn) {
        completeBtn.addEventListener('click', async () => {
            if (!activeLesson) return;
            if (progressMap[activeLesson.id]?.isCompleted) return;

            const res = await window.FirebaseService.markLessonCompleted(currentUser.uid, activeCourseId, activeLesson.id);
            if (res && res.success) {
                showToast("Congratulations! Lesson marked as completed.", "success");
                // Reload list and update button/checkmarks
                loadCourseSyllabus();
            }
        });
    }

    // Sync on page unload / navigations
    window.addEventListener('beforeunload', () => {
        syncCurrentVideoProgress();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            syncCurrentVideoProgress();
        }
    });

    // Kick off
    checkAuthAndInit();
});
