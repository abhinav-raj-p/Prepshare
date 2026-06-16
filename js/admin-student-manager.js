class AdminStudentManager extends HTMLElement {
    constructor() {
        super();
        this.currentStudents = [];
        this.selectedUids = new Set();
        this.courses = [];
        this.lastVisibleDocs = [null]; // Stack for backwards pagination
        this.currentIndex = 0; // Current page index (0-indexed)
        this.filters = {
            searchType: 'recent',
            queryStr: '',
            courseId: ''
        };
    }

    async connectedCallback() {
        this.innerHTML = `
            <div class="bg-white rounded-2xl border border-border-light overflow-hidden flex flex-col shadow-sm">
                <!-- Header & Filters -->
                <div class="p-5 border-b border-border-light bg-surface-subtle">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <h3 class="font-title-lg text-title-lg text-primary font-bold flex items-center gap-2">
                            <span class="material-symbols-outlined text-secondary">manage_accounts</span>
                            Student Directory
                        </h3>
                        <div class="flex items-center gap-2">
                            <button id="asm-btn-delete-selected" class="hidden bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition-all flex items-center gap-2">
                                <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                                Delete Selected (<span id="asm-selected-count">0</span>)
                            </button>
                        </div>
                    </div>

                    <!-- Search Bar Row -->
                    <div class="flex flex-col md:flex-row gap-3">
                        <select id="asm-search-type" class="border border-border-light rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white min-w-[140px]">
                            <option value="recent">Recently Joined</option>
                            <option value="name">Search by Name</option>
                            <option value="email">Search by Email</option>
                            <option value="course">Filter by Course</option>
                        </select>
                        
                        <div id="asm-input-container" class="flex-1 hidden">
                            <input type="text" id="asm-search-input" placeholder="Type here..." class="w-full border border-border-light rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                        </div>
                        
                        <div id="asm-course-container" class="flex-1 hidden">
                            <select id="asm-course-select" class="w-full border border-border-light rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white">
                                <option value="">Select Course...</option>
                            </select>
                        </div>
                        
                        <button id="asm-btn-search" class="bg-[#191f2f] hover:bg-[#2f3445] text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">Apply Filter</button>
                        <button id="asm-btn-reset" class="text-on-surface-variant hover:bg-surface border border-border-light px-4 py-2 rounded-lg text-sm font-bold transition-colors">Reset</button>
                    </div>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto custom-scrollbar min-h-[300px] relative">
                    <div id="asm-loader" class="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center hidden">
                        <span class="material-symbols-outlined animate-spin text-primary text-3xl">autorenew</span>
                    </div>
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-surface-container-low border-b border-border-light">
                            <tr>
                                <th class="px-6 py-4 w-12">
                                    <input type="checkbox" id="asm-select-all" class="rounded border-border-light text-primary focus:ring-primary w-4 h-4 cursor-pointer">
                                </th>
                                <th class="px-6 py-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Student</th>
                                <th class="px-6 py-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Contact</th>
                                <th class="px-6 py-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Joined</th>
                                <th class="px-6 py-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border-light" id="asm-tbody">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="p-4 border-t border-border-light bg-surface-subtle flex items-center justify-between">
                    <button id="asm-btn-prev" class="px-4 py-2 border border-border-light rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled>Previous Page</button>
                    <span class="text-xs text-on-surface-variant font-mono font-bold" id="asm-page-indicator">Page 1</span>
                    <button id="asm-btn-next" class="px-4 py-2 border border-border-light rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled>Next Page</button>
                </div>
            </div>
        `;

        await this.loadCourses();
        this.bindEvents();
        await this.fetchAndRender();
    }

    async loadCourses() {
        if (!window.FirebaseService) return;
        this.courses = await window.FirebaseService.getCourses();
        const courseSelect = this.querySelector('#asm-course-select');
        if (courseSelect) {
            courseSelect.innerHTML = '<option value="">Select Course...</option>' + 
                this.courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
    }

    bindEvents() {
        const typeSelect = this.querySelector('#asm-search-type');
        const inputContainer = this.querySelector('#asm-input-container');
        const courseContainer = this.querySelector('#asm-course-container');
        const inputStr = this.querySelector('#asm-search-input');
        const selectCourse = this.querySelector('#asm-course-select');

        // Search Type Toggle
        typeSelect.addEventListener('change', (e) => {
            inputContainer.classList.add('hidden');
            courseContainer.classList.add('hidden');
            
            if (e.target.value === 'name' || e.target.value === 'email') {
                inputContainer.classList.remove('hidden');
                inputStr.placeholder = e.target.value === 'email' ? 'Enter exact email...' : 'Enter starting letters of name...';
            } else if (e.target.value === 'course') {
                courseContainer.classList.remove('hidden');
            }
        });

        // Search Submit
        this.querySelector('#asm-btn-search').addEventListener('click', () => {
            this.filters.searchType = typeSelect.value;
            this.filters.queryStr = inputStr.value.trim();
            this.filters.courseId = selectCourse.value;
            
            if (this.filters.searchType === 'course' && !this.filters.courseId) {
                alert('Please select a course to filter by.');
                return;
            }
            if ((this.filters.searchType === 'name' || this.filters.searchType === 'email') && !this.filters.queryStr) {
                alert('Please enter a search term.');
                return;
            }

            this.resetPagination();
            this.fetchAndRender();
        });

        // Reset Filter
        this.querySelector('#asm-btn-reset').addEventListener('click', () => {
            typeSelect.value = 'recent';
            inputStr.value = '';
            selectCourse.value = '';
            typeSelect.dispatchEvent(new Event('change'));
            
            this.filters = { searchType: 'recent', queryStr: '', courseId: '' };
            this.resetPagination();
            this.fetchAndRender();
        });

        // Pagination
        this.querySelector('#asm-btn-prev').addEventListener('click', () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.lastVisibleDocs.pop(); // Remove current cursor
                this.fetchAndRender(this.lastVisibleDocs[this.currentIndex]);
            }
        });

        this.querySelector('#asm-btn-next').addEventListener('click', () => {
            this.currentIndex++;
            this.fetchAndRender(this.lastVisibleDocs[this.currentIndex]);
        });

        // Select All Checkbox
        this.querySelector('#asm-select-all').addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const checkboxes = this.querySelectorAll('.asm-row-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
                if (isChecked) this.selectedUids.add(cb.value);
                else this.selectedUids.delete(cb.value);
            });
            this.updateSelectionUI();
        });

        // Bulk Delete Button
        this.querySelector('#asm-btn-delete-selected').addEventListener('click', async () => {
            if (this.selectedUids.size === 0) return;
            const confirmed = confirm(`Are you sure you want to COMPLETELY WIPE ${this.selectedUids.size} student(s)? This will delete their profile, enrollments, progress, and mock attempts forever.`);
            if (!confirmed) return;
            
            this.setLoading(true);
            try {
                for (const uid of Array.from(this.selectedUids)) {
                    await window.FirebaseService.deleteStudentAndAssociatedData(uid);
                }
                this.selectedUids.clear();
                this.querySelector('#asm-select-all').checked = false;
                this.updateSelectionUI();
                await this.fetchAndRender(this.lastVisibleDocs[this.currentIndex]); // Refresh current page
            } catch (e) {
                console.error("Bulk delete error", e);
                alert("An error occurred during bulk deletion. Check console for details.");
            }
            this.setLoading(false);
        });
    }

    resetPagination() {
        this.currentIndex = 0;
        this.lastVisibleDocs = [null];
        this.selectedUids.clear();
        this.querySelector('#asm-select-all').checked = false;
        this.updateSelectionUI();
    }

    setLoading(isLoading) {
        const loader = this.querySelector('#asm-loader');
        if (loader) {
            if (isLoading) loader.classList.remove('hidden');
            else loader.classList.add('hidden');
        }
    }

    updateSelectionUI() {
        const btn = this.querySelector('#asm-btn-delete-selected');
        const countSpan = this.querySelector('#asm-selected-count');
        if (this.selectedUids.size > 0) {
            btn.classList.remove('hidden');
            countSpan.innerText = this.selectedUids.size;
        } else {
            btn.classList.add('hidden');
        }
    }

    async fetchAndRender(cursor = null) {
        if (!window.FirebaseService) return;
        this.setLoading(true);

        try {
            const result = await window.FirebaseService.searchStudentsPaginated(this.filters, cursor, 20);
            this.currentStudents = result.students;
            
            // Manage pagination cursors
            if (this.lastVisibleDocs.length === this.currentIndex + 1 && result.hasMore) {
                this.lastVisibleDocs.push(result.lastVisible);
            }

            this.renderTable();
            this.updatePaginationUI(result.hasMore);
        } catch (e) {
            console.error("Fetch students error", e);
            this.querySelector('#asm-tbody').innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-error font-bold">Failed to load students.</td></tr>';
        }

        this.setLoading(false);
    }

    updatePaginationUI(hasMore) {
        const btnPrev = this.querySelector('#asm-btn-prev');
        const btnNext = this.querySelector('#asm-btn-next');
        const indicator = this.querySelector('#asm-page-indicator');

        btnPrev.disabled = this.currentIndex === 0;
        btnNext.disabled = !hasMore;
        indicator.innerText = \`Page \${this.currentIndex + 1}\`;
    }

    renderTable() {
        const tbody = this.querySelector('#asm-tbody');
        if (this.currentStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-on-surface-variant font-bold text-sm">No students found matching the criteria.</td></tr>';
            return;
        }

        tbody.innerHTML = this.currentStudents.map(student => {
            const isChecked = this.selectedUids.has(student.uid);
            let dateStr = 'Unknown';
            if (student.createdAt) {
                dateStr = new Date(student.createdAt.seconds ? student.createdAt.seconds * 1000 : student.createdAt).toLocaleDateString();
            }

            return \`
                <tr class="hover:bg-surface-subtle transition-colors group">
                    <td class="px-6 py-4">
                        <input type="checkbox" value="\${student.uid}" class="asm-row-checkbox rounded border-border-light text-primary focus:ring-primary w-4 h-4 cursor-pointer" \${isChecked ? 'checked' : ''}>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                                \${student.profileImage || '?'}
                            </div>
                            <div class="flex flex-col">
                                <span class="font-bold text-sm text-primary">\${student.name}</span>
                                <span class="text-xs text-on-surface-variant uppercase tracking-wider font-mono">\${student.uid.substring(0,8)}...</span>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-sm font-semibold text-on-surface">\${student.email}</span>
                    </td>
                    <td class="px-6 py-4 text-sm font-mono text-on-surface-variant">
                        \${dateStr}
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button class="asm-btn-delete-single text-on-surface-variant hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors" data-uid="\${student.uid}" title="Delete Student & Data">
                            <span class="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    </td>
                </tr>
            \`;
        }).join('');

        // Bind Row Checkboxes
        const checkboxes = this.querySelectorAll('.asm-row-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) this.selectedUids.add(e.target.value);
                else this.selectedUids.delete(e.target.value);
                this.updateSelectionUI();
                
                // Update Select All Checkbox state
                const selectAll = this.querySelector('#asm-select-all');
                selectAll.checked = checkboxes.length > 0 && Array.from(checkboxes).every(c => c.checked);
            });
        });

        // Bind Single Delete Buttons
        const deleteBtns = this.querySelectorAll('.asm-btn-delete-single');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const uid = e.currentTarget.dataset.uid;
                const confirmed = confirm("Are you sure you want to COMPLETELY WIPE this student? This will delete their profile, enrollments, progress, and mock attempts forever.");
                if (confirmed) {
                    this.setLoading(true);
                    try {
                        await window.FirebaseService.deleteStudentAndAssociatedData(uid);
                        this.selectedUids.delete(uid);
                        this.updateSelectionUI();
                        // Refresh
                        await this.fetchAndRender(this.lastVisibleDocs[this.currentIndex]);
                    } catch (err) {
                        console.error("Single delete error", err);
                        alert("Failed to delete student.");
                    }
                    this.setLoading(false);
                }
            });
        });
    }
}

customElements.define('admin-student-manager', AdminStudentManager);
