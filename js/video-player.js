/**
 * MCA Ace Shielded Custom YouTube Player Module
 * Encapsulates the YouTube Iframe API to hide branding/links and overlay custom premium controls.
 */
(function() {
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    window.McaPlayer = {
        /**
         * Initializes a shielded YouTube player inside a container with custom control elements.
         * @param {string} containerId - The ID of the container element to put the player in.
         * @param {string} videoId - The YouTube Video ID.
         * @param {Object} controlSelectors - Object map of control element IDs/references.
         * @param {Object} options - Optional overrides (start time, etc).
         */
        create: function(containerId, videoIdOrUrl, controlSelectors, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) return null;

            // Extract video ID from URL if a full link is passed
            let videoId = videoIdOrUrl;
            if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = videoIdOrUrl.match(regExp);
                if (match && match[2].length === 11) {
                    videoId = match[2];
                }
            }

            // Determine origin for the iframe link to prevent Error 153 on file:/// protocol
            let origin = window.location.origin;
            if (!origin || origin === 'null' || origin.startsWith('file:')) {
                origin = 'https://www.youtube.com'; // fallback origin
            }

            // Build full embed link
            const embedLink = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(origin)}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&disablekb=1`;

            // Re-render container contents with transparent overlay and an IFRAME with the full link
            container.innerHTML = `
                <div class="relative w-full h-full">
                    <!-- Transparent Overlay to trap clicks/hovers/right-clicks -->
                    <div id="${containerId}-overlay" class="absolute inset-0 z-10 cursor-pointer bg-transparent"></div>
                    <!-- YouTube Player Frame (actual iframe with link) -->
                    <iframe id="${containerId}-frame" class="w-full h-full pointer-events-none scale-[1.01] origin-center border-none" src="${embedLink}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
            `;

            let ytPlayer = null;
            let progressInterval = null;

            const setupControls = () => {
                const overlay = document.getElementById(`${containerId}-overlay`);
                const playBtn = document.getElementById(controlSelectors.playBtn);
                const playIcon = document.getElementById(controlSelectors.playIcon);
                const progressSlider = document.getElementById(controlSelectors.progressSlider);
                const timeCurrent = document.getElementById(controlSelectors.timeCurrent);
                const timeDuration = document.getElementById(controlSelectors.timeDuration);
                const volumeBtn = document.getElementById(controlSelectors.volumeBtn);
                const volumeIcon = document.getElementById(controlSelectors.volumeIcon);
                const volumeSlider = document.getElementById(controlSelectors.volumeSlider);
                const speedSelect = document.getElementById(controlSelectors.speedSelect);

                if (progressInterval) clearInterval(progressInterval);
                progressInterval = setInterval(() => {
                    if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
                        try {
                            const curr = ytPlayer.getCurrentTime();
                            const dur = ytPlayer.getDuration() || options.duration || 0;
                            if (dur > 0) {
                                if (progressSlider) progressSlider.value = (curr / dur) * 100;
                                if (timeCurrent) timeCurrent.innerText = formatTime(curr);
                                if (timeDuration) timeDuration.innerText = formatTime(dur);
                            }
                        } catch (e) {}
                    }
                }, 500);

                let isCustomPlaying = false;
                const togglePlay = () => {
                    if (!ytPlayer) return;
                    let state = -1;
                    try {
                        if (ytPlayer.getPlayerState) {
                            state = ytPlayer.getPlayerState();
                        }
                    } catch (e) {}

                    const shouldPause = (state === 1) || (state === -1 && isCustomPlaying); // YT.PlayerState.PLAYING is 1

                    if (shouldPause) {
                        if (ytPlayer.pauseVideo) ytPlayer.pauseVideo();
                        isCustomPlaying = false;
                        if (playIcon) playIcon.innerText = 'play_arrow';
                    } else {
                        if (ytPlayer.playVideo) ytPlayer.playVideo();
                        isCustomPlaying = true;
                        if (playIcon) playIcon.innerText = 'pause';
                    }
                };

                // Keyboard Events Global Listener
                const handleKeyDown = (e) => {
                    if (!ytPlayer) return;
                    // Ignore if typing in input/textarea
                    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
                    if (tag === 'input' || tag === 'textarea') return;

                    if (e.code === 'Space') {
                        e.preventDefault();
                        togglePlay();
                    } else if (e.code === 'ArrowLeft') {
                        e.preventDefault();
                        if (ytPlayer.getCurrentTime) ytPlayer.seekTo(ytPlayer.getCurrentTime() - 10, true);
                    } else if (e.code === 'ArrowRight') {
                        e.preventDefault();
                        if (ytPlayer.getCurrentTime) ytPlayer.seekTo(ytPlayer.getCurrentTime() + 10, true);
                    }
                };
                document.addEventListener('keydown', handleKeyDown);

                // Double Tap / Single Tap Touch Handle
                let lastTap = 0;
                let tapTimeout = null;

                if (overlay) {
                    overlay.addEventListener('click', (e) => {
                        if (!ytPlayer) return;
                        let currentTime = new Date().getTime();
                        let tapLength = currentTime - lastTap;

                        if (tapLength < 300 && tapLength > 0) {
                            // Double Tap
                            clearTimeout(tapTimeout);
                            const rect = overlay.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            if (x < rect.width / 2) {
                                if (ytPlayer.getCurrentTime) ytPlayer.seekTo(ytPlayer.getCurrentTime() - 10, true);
                            } else {
                                if (ytPlayer.getCurrentTime) ytPlayer.seekTo(ytPlayer.getCurrentTime() + 10, true);
                            }
                        } else {
                            // Single Tap Schedule
                            tapTimeout = setTimeout(() => {
                                togglePlay();
                            }, 300);
                        }
                        lastTap = currentTime;
                    });
                }
                
                // Expose listener for cleanup
                if (ytPlayer) ytPlayer._handleKeyDown = handleKeyDown;
                if (playBtn) playBtn.onclick = togglePlay;

                if (progressSlider) {
                    progressSlider.oninput = (e) => {
                        if (!ytPlayer || !ytPlayer.getDuration) return;
                        const dur = ytPlayer.getDuration() || options.duration || 0;
                        const targetSecs = (e.target.value / 100) * dur;
                        ytPlayer.seekTo(targetSecs, true);
                        if (timeCurrent) timeCurrent.innerText = formatTime(targetSecs);
                    };
                }

                if (volumeSlider) {
                    volumeSlider.oninput = (e) => {
                        if (!ytPlayer || !ytPlayer.setVolume) return;
                        const vol = parseInt(e.target.value, 10);
                        ytPlayer.setVolume(vol);
                        if (volumeIcon) {
                            if (vol === 0) {
                                volumeIcon.innerText = 'volume_mute';
                            } else if (vol < 50) {
                                volumeIcon.innerText = 'volume_down';
                            } else {
                                volumeIcon.innerText = 'volume_up';
                            }
                        }
                    };
                }

                if (volumeBtn) {
                    volumeBtn.onclick = () => {
                        if (!ytPlayer || !ytPlayer.isMuted) return;
                        if (ytPlayer.isMuted()) {
                            ytPlayer.unMute();
                            if (volumeSlider) volumeSlider.value = 100;
                            if (volumeIcon) volumeIcon.innerText = 'volume_up';
                        } else {
                            ytPlayer.mute();
                            if (volumeSlider) volumeSlider.value = 0;
                            if (volumeIcon) volumeIcon.innerText = 'volume_mute';
                        }
                    };
                }

                if (speedSelect) {
                    speedSelect.onchange = (e) => {
                        if (!ytPlayer || !ytPlayer.setPlaybackRate) return;
                        ytPlayer.setPlaybackRate(parseFloat(e.target.value));
                    };
                }
            };

            const onPlayerStateChange = (event) => {
                const playIcon = document.getElementById(controlSelectors.playIcon);
                if (playIcon) {
                    if (event.data === 1) { // YT.PlayerState.PLAYING
                        playIcon.innerText = 'pause';
                    } else {
                        playIcon.innerText = 'play_arrow';
                    }
                }
                if (options.onStateChange) {
                    options.onStateChange(event);
                }
            };

            const initPlayer = () => {
                ytPlayer = new YT.Player(`${containerId}-frame`, {
                    events: {
                        'onReady': () => {
                            setupControls();
                            if (options.autoplay !== false) {
                                ytPlayer.playVideo();
                            }
                            if (options.onReady) {
                                options.onReady(ytPlayer);
                            }
                        },
                        'onStateChange': onPlayerStateChange
                    }
                });
            };

            // Dynamically load YouTube API if not ready
            if (window.YT && window.YT.Player) {
                initPlayer();
            } else {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                
                // Keep reference to previous onYouTubeIframeAPIReady callback if any
                const prevAPIReady = window.onYouTubeIframeAPIReady;
                window.onYouTubeIframeAPIReady = () => {
                    initPlayer();
                    if (prevAPIReady) prevAPIReady();
                };
            }

            return {
                getPlayer: () => ytPlayer,
                destroy: () => {
                    if (progressInterval) clearInterval(progressInterval);
                    if (ytPlayer) {
                        if (ytPlayer._handleKeyDown) {
                            document.removeEventListener('keydown', ytPlayer._handleKeyDown);
                        }
                        if (ytPlayer.destroy) {
                            try {
                                ytPlayer.destroy();
                            } catch (e) {}
                        }
                    }
                }
            };
        }
    };
})();
