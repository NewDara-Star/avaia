/**
 * Avaia GUI - Shared JavaScript Utilities
 * Common functionality across all pages
 */

// =============================================================================
// Learner ID Management
// =============================================================================

function getLearnerId() {
    return localStorage.getItem('avaia_learner_id') || '';
}

function setLearnerId(id) {
    localStorage.setItem('avaia_learner_id', id);
}

function getLearnerName() {
    return localStorage.getItem('avaia_learner_name') || '';
}

function setLearnerName(name) {
    localStorage.setItem('avaia_learner_name', name);
}

// =============================================================================
// API Helpers with Loading States
// =============================================================================

async function apiGet(url, options = {}) {
    const response = await fetch(url, {
        method: 'GET',
        ...options
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || 'Request failed');
    }
    return response.json();
}

async function apiPost(url, data, options = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: JSON.stringify(data),
        ...options
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || 'Request failed');
    }
    return response.json();
}

// =============================================================================
// Loading State Management
// =============================================================================

function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function showError(containerId, message, retryFn = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>${message}</p>
            ${retryFn ? '<button class="btn btn-secondary retry-btn">Retry</button>' : ''}
        </div>
    `;

    if (retryFn) {
        container.querySelector('.retry-btn')?.addEventListener('click', retryFn);
    }
}

function showEmpty(containerId, message, icon = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const defaultIcon = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8"/>
        </svg>
    `;

    container.innerHTML = `
        <div class="empty-state">
            ${icon || defaultIcon}
            <p>${message}</p>
        </div>
    `;
}

// =============================================================================
// Learner Verification & Creation Modal
// =============================================================================

async function verifyLearner(learnerId) {
    if (!learnerId) return { exists: false };
    try {
        return await apiGet(`/api/learner/exists?learner_id=${encodeURIComponent(learnerId)}`);
    } catch {
        return { exists: false };
    }
}

async function createLearner(name, preferredMethod = 'example_first') {
    return await apiPost('/api/learner/create', {
        name: name,
        preferred_teaching_method: preferredMethod
    });
}

function showLearnerModal(onSuccess) {
    // Check if modal already exists
    let modal = document.getElementById('learner-modal');
    if (modal) {
        modal.classList.add('visible');
        return;
    }

    // Create modal
    modal = document.createElement('div');
    modal.id = 'learner-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <h2>Welcome to Avaia!</h2>
            <p class="modal-subtitle">Let's set up your learner profile</p>

            <div class="modal-tabs">
                <button class="modal-tab active" data-tab="new">New Learner</button>
                <button class="modal-tab" data-tab="existing">Existing ID</button>
            </div>

            <div class="modal-tab-content active" id="tab-new">
                <div class="form-group">
                    <label for="learner-name">Your Name</label>
                    <input type="text" id="learner-name" placeholder="What should I call you?" class="input-field" autofocus>
                </div>
                <div class="form-group">
                    <label for="teaching-method">How do you like to learn?</label>
                    <select id="teaching-method" class="input-field">
                        <option value="example_first">Show me examples first (Recommended)</option>
                        <option value="concept_first">Explain concepts first</option>
                        <option value="try_first">Let me try first</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-full" id="create-learner-btn">Get Started</button>
            </div>

            <div class="modal-tab-content" id="tab-existing">
                <div class="form-group">
                    <label for="existing-id">Your Learner ID</label>
                    <input type="text" id="existing-id" placeholder="learner_xxxxxxxxxxxx" class="input-field">
                    <p class="form-hint">Find this in your previous session or chat history</p>
                </div>
                <button class="btn btn-primary btn-full" id="use-existing-btn">Continue Learning</button>
            </div>

            <div id="modal-error" class="modal-error" style="display: none;"></div>
        </div>
    `;

    document.body.appendChild(modal);

    // Tab switching
    modal.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Create new learner
    document.getElementById('create-learner-btn').addEventListener('click', async () => {
        const name = document.getElementById('learner-name').value.trim();
        const method = document.getElementById('teaching-method').value;
        const errorEl = document.getElementById('modal-error');

        if (!name) {
            errorEl.textContent = 'Please enter your name';
            errorEl.style.display = 'block';
            return;
        }

        try {
            const result = await createLearner(name, method);
            if (result.success) {
                setLearnerId(result.learner_id);
                setLearnerName(result.name);
                modal.classList.remove('visible');
                if (onSuccess) onSuccess(result.learner_id);
            } else {
                errorEl.textContent = result.error || 'Failed to create profile';
                errorEl.style.display = 'block';
            }
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to create profile';
            errorEl.style.display = 'block';
        }
    });

    // Use existing ID
    document.getElementById('use-existing-btn').addEventListener('click', async () => {
        const existingId = document.getElementById('existing-id').value.trim();
        const errorEl = document.getElementById('modal-error');

        if (!existingId) {
            errorEl.textContent = 'Please enter your learner ID';
            errorEl.style.display = 'block';
            return;
        }

        try {
            const result = await verifyLearner(existingId);
            if (result.exists) {
                setLearnerId(result.id);
                if (result.name) setLearnerName(result.name);
                modal.classList.remove('visible');
                if (onSuccess) onSuccess(result.id);
            } else {
                errorEl.textContent = 'Learner ID not found. Try creating a new profile.';
                errorEl.style.display = 'block';
            }
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to verify ID';
            errorEl.style.display = 'block';
        }
    });

    // Show modal with animation
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });
}

// =============================================================================
// Initialize Learner on Page Load
// =============================================================================

async function initializeLearner(onReady, containerId = null) {
    const learnerId = getLearnerId();

    if (learnerId) {
        // Verify the learner still exists
        const result = await verifyLearner(learnerId);
        if (result.exists) {
            // Update learner ID input if present
            const input = document.getElementById('learnerIdInput');
            if (input) input.value = learnerId;
            if (onReady) onReady(learnerId);
            return;
        }
    }

    // No valid learner - show creation modal
    if (containerId) {
        showEmpty(containerId, 'Set up your profile to get started');
    }
    showLearnerModal(onReady);
}

// =============================================================================
// Time Formatting
// =============================================================================

function formatTime(minutes) {
    if (!minutes || minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================================================
// Mobile Menu Toggle
// =============================================================================

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
}

// Auto-init mobile menu
document.addEventListener('DOMContentLoaded', initMobileMenu);
