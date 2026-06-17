// js/onboarding-service.js
// Modular service for collecting missing user profile data (e.g., mobile number)

window.OnboardingService = {
    _modal: null,
    
    _createModalHTML: function() {
        return `
            <div id="mca-onboarding-modal" class="fixed inset-0 bg-[#021541]/80 backdrop-blur-sm flex items-center justify-center z-[300] p-4 opacity-0 transition-opacity duration-300">
                <div class="bg-white dark:bg-[#151b2b] rounded-2xl overflow-hidden max-w-md w-full shadow-2xl border border-border-light dark:border-outline-variant/20 flex flex-col transform scale-95 transition-transform duration-300 p-8">
                    <div class="flex justify-center mb-6">
                        <div class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-3xl">contact_phone</span>
                        </div>
                    </div>
                    
                    <h3 class="font-headline-md text-2xl font-bold text-center text-primary dark:text-white mb-2">Almost there!</h3>
                    <p class="text-sm text-center text-on-surface-variant dark:text-on-surface/75 mb-6">We need your mobile number to send important course updates and secure verification codes.</p>
                    
                    <div id="mca-onboarding-alert" class="hidden bg-error-container/20 border border-error/20 text-error p-3 rounded-lg text-xs mb-4 text-center"></div>
                    
                    <form id="mca-onboarding-form" class="space-y-6">
                        <div>
                            <label class="block text-xs font-bold text-on-surface-variant dark:text-on-surface/75 uppercase mb-1">Mobile Number</label>
                            <div class="flex shadow-sm rounded-lg overflow-hidden">
                                <span class="inline-flex items-center px-4 text-sm border border-r-0 border-border-light dark:border-outline-variant/35 bg-surface-subtle dark:bg-[#0d1322] text-on-surface-variant font-bold">+91</span>
                                <input type="tel" id="mca-onboarding-mobile" required pattern="[0-9]{10}" class="flex-1 border border-border-light dark:border-outline-variant/35 bg-surface dark:bg-[#0d1322] text-on-surface dark:text-white px-4 py-3 text-base focus:ring-1 focus:ring-primary outline-none" placeholder="10-digit number"/>
                            </div>
                        </div>
                        <button type="submit" id="mca-onboarding-btn" class="w-full bg-[#FB6514] hover:bg-[#e0560d] text-white py-3.5 rounded-lg font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            Complete Profile
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    requestMobileNumber: function(loggedInUser, onSuccessCallback) {
        if (!loggedInUser) return;
        
        // Don't re-create if it already exists
        if (!this._modal) {
            const container = document.createElement('div');
            container.innerHTML = this._createModalHTML();
            this._modal = container.firstElementChild;
            document.body.appendChild(this._modal);
            
            // Bind Events
            const form = this._modal.querySelector('#mca-onboarding-form');
            const btn = this._modal.querySelector('#mca-onboarding-btn');
            const input = this._modal.querySelector('#mca-onboarding-mobile');
            const alertBox = this._modal.querySelector('#mca-onboarding-alert');
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const mobile = input.value.trim();
                
                if (mobile.length !== 10 || !/^[0-9]+$/.test(mobile)) {
                    alertBox.innerText = "Please enter a valid 10-digit mobile number.";
                    alertBox.classList.remove('hidden');
                    return;
                }
                
                btn.disabled = true;
                btn.innerText = "Saving profile...";
                alertBox.classList.add('hidden');
                
                try {
                    if (loggedInUser.pendingOnboarding) {
                        await window.FirebaseService.finalizeUserSignup(loggedInUser, mobile);
                    } else {
                        await window.FirebaseService.updateUserMobile(mobile);
                        loggedInUser.mobile = mobile;
                    }
                    
                    // Trigger exit animation
                    this._modal.classList.remove('opacity-100');
                    this._modal.classList.add('opacity-0');
                    this._modal.querySelector('div').classList.remove('scale-100');
                    this._modal.querySelector('div').classList.add('scale-95');
                    
                    setTimeout(() => {
                        this._modal.classList.add('hidden');
                        if (onSuccessCallback) onSuccessCallback();
                    }, 300);
                    
                } catch(err) {
                    alertBox.innerText = err.message;
                    alertBox.classList.remove('hidden');
                    btn.disabled = false;
                    btn.innerText = "Complete Profile";
                }
            });
        }
        
        // Show Modal
        this._modal.classList.remove('hidden');
        // Trigger reflow for animation
        void this._modal.offsetWidth;
        this._modal.classList.remove('opacity-0');
        this._modal.classList.add('opacity-100');
        this._modal.querySelector('div').classList.remove('scale-95');
        this._modal.querySelector('div').classList.add('scale-100');
        
        // Focus input
        setTimeout(() => {
            this._modal.querySelector('#mca-onboarding-mobile').focus();
        }, 300);
    }
};
