/* ==========================================================================
   NADR CMS Pro — one owner, password only
   The app belongs to one mediator. The login asks only for the password.
   - First run (no account with a real password yet): the mediator types their
     name and chooses a password; that becomes the only account used to sign in.
   - Existing installs: the account last used with a real (not default) password
     becomes the owner. Other stored accounts are kept but can no longer sign in.
   Sign-in itself is still done by app.js (hashing, remember me, profile).
   ========================================================================== */
(function () {
    'use strict';
    const OWNER_KEY = 'nadr_owner_username';
    const $ = id => document.getElementById(id);
    const readUsers = () => { try { const u = JSON.parse(localStorage.getItem('nadr_admin_users')); return Array.isArray(u) ? u : []; } catch (e) { return []; } };
    const weak = () => (typeof WEAK_PASSWORDS !== 'undefined' ? WEAK_PASSWORDS : ['admin', '123', 'admin123', 'user', '1234', 'password']);
    const hasRealPassword = u => !!u && (u.passwordHash || u.password) && !u.mustChangePassword && !(u.password && weak().includes(u.password)) && (u.status || 'Active') !== 'Inactive';

    function findOwner() {
        const users = readUsers();
        const byName = n => users.find(u => n && String(u.username).toLowerCase() === String(n).toLowerCase());
        const saved = byName(localStorage.getItem(OWNER_KEY));
        if (saved && (saved.passwordHash || saved.password)) return saved;
        const pick = [byName(localStorage.getItem('nadr_last_username')), byName('admin'), ...users].find(hasRealPassword);
        if (pick) localStorage.setItem(OWNER_KEY, pick.username);
        return pick || null;
    }

    let setupMode = false;
    function showError(html) {
        const e = $('login-error-msg');
        if (!e) return;
        e.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>' + html + '</span>';
        e.classList.remove('d-none');
    }

    function applyMode() {
        const form = $('login-form'), userInput = $('login-username');
        if (!form || !userInput) return;
        const userLabel = form.querySelector('label[for="login-username"]');
        const userWrap = userInput.closest('.kh-input-wrap');
        // the user name is never typed any more
        if (userLabel) userLabel.style.display = 'none';
        if (userWrap) userWrap.style.display = 'none';
        userInput.required = false;

        const owner = findOwner();
        setupMode = !owner;
        let box = $('owner-setup');
        const pwdLabel = form.querySelector('label[for="login-password"]');
        const sub = document.querySelector('#login-overlay .kh-card-title');
        const btn = form.querySelector('.kh-submit');
        if (setupMode) {
            if (!box) {
                box = document.createElement('div');
                box.id = 'owner-setup';
                box.className = 'owner-setup';
                box.innerHTML =
                    '<p class="owner-setup-note"><i class="fa-solid fa-circle-info"></i> ការប្រើលើកដំបូង៖ សូមបញ្ចូលឈ្មោះរបស់លោក-លោកស្រី និងកំណត់ពាក្យសម្ងាត់សម្រាប់ចូលប្រើកម្មវិធីនេះ។</p>' +
                    '<label for="owner-name" class="kh-label"><i class="fa-solid fa-user-tie"></i> ឈ្មោះ ម.ស.វ.</label>' +
                    '<div class="kh-input-wrap" style="margin-bottom: 14px;"><i class="fa-solid fa-user kh-input-icon"></i><input type="text" id="owner-name" class="kh-input" placeholder="ឧ. ឡាយ អូន" autocomplete="name"></div>';
                form.insertBefore(box, pwdLabel || form.firstChild);
                const confirmWrap = document.createElement('div');
                confirmWrap.id = 'owner-confirm-wrap';
                confirmWrap.innerHTML =
                    '<label for="owner-password2" class="kh-label" style="margin-top: 14px;"><i class="fa-solid fa-key"></i> បញ្ជាក់ពាក្យសម្ងាត់</label>' +
                    '<div class="kh-input-wrap"><i class="fa-solid fa-lock kh-input-icon"></i><input type="password" id="owner-password2" class="kh-input" placeholder="វាយពាក្យសម្ងាត់ម្តងទៀត..." autocomplete="new-password"></div>';
                const pwdWrap = $('login-password').closest('.kh-input-wrap');
                pwdWrap.parentNode.insertBefore(confirmWrap, pwdWrap.nextSibling);
            }
            box.style.display = ''; $('owner-confirm-wrap').style.display = '';
            if (pwdLabel) pwdLabel.innerHTML = '<i class="fa-solid fa-key"></i> កំណត់ពាក្យសម្ងាត់ (យ៉ាងតិច ៤ តួ)';
            $('login-password').setAttribute('autocomplete', 'new-password');
            $('login-password').placeholder = 'ពាក្យសម្ងាត់ថ្មី...';
            if (btn) btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> រក្សាទុក និងចូលប្រើ';
            if (sub) sub.textContent = 'សូមស្វាគមន៍! រៀបចំកម្មវិធីសម្រាប់ការប្រើលើកដំបូង';
        } else {
            userInput.value = owner.username;
            if (box) box.style.display = 'none';
            if ($('owner-confirm-wrap')) $('owner-confirm-wrap').style.display = 'none';
            if (pwdLabel) pwdLabel.innerHTML = '<i class="fa-solid fa-key"></i> ពាក្យសម្ងាត់';
            $('login-password').setAttribute('autocomplete', 'current-password');
            $('login-password').placeholder = 'វាយពាក្យសម្ងាត់របស់អ្នក...';
            if (btn) btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> ចូលប្រព័ន្ធ';
            const who = owner.name || localStorage.getItem('nadr_user_profile_name');
            if (sub) sub.textContent = who ? 'សូមស្វាគមន៍ ' + who : 'សូមស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងសំណុំរឿង';
        }
    }

    // Runs before app.js's own submit handler (capture phase on the document).
    document.addEventListener('submit', async e => {
        if (!e.target || e.target.id !== 'login-form') return;
        applyMode();
        if (!setupMode) return;            // normal sign-in: app.js checks the owner's password
        e.preventDefault();
        e.stopImmediatePropagation();
        const name = ($('owner-name').value || '').trim();
        const p1 = $('login-password').value.trim(), p2 = ($('owner-password2').value || '').trim();
        if (!name) { showError('សូមបញ្ចូលឈ្មោះ ម.ស.វ.'); $('owner-name').focus(); return; }
        if (p1.length < 4) { showError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួ។'); $('login-password').focus(); return; }
        if (weak().includes(p1)) { showError('ពាក្យសម្ងាត់នេះងាយទាយពេក។ សូមជ្រើសពាក្យសម្ងាត់ផ្សេង។'); $('login-password').focus(); return; }
        if (p1 !== p2) { showError('ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ។'); $('owner-password2').focus(); return; }
        const owner = { username: 'admin', name, role: 'មន្ត្រីសម្រុះសម្រួលវិវាទ (ម.ស.វ.)', status: 'Active' };
        if (typeof setUserPassword === 'function') await setUserPassword(owner, p1); else owner.password = p1;
        // keep any older stored accounts' data out of the way: only the owner can sign in
        const others = readUsers().filter(u => String(u.username).toLowerCase() !== 'admin');
        localStorage.setItem('nadr_admin_users', JSON.stringify([owner, ...others]));
        if (typeof ADMIN_USERS !== 'undefined') { try { ADMIN_USERS = [owner, ...others]; } catch (err) { /* read-only */ } }
        localStorage.setItem(OWNER_KEY, 'admin');
        localStorage.setItem('nadr_user_profile_name', name);
        localStorage.setItem('nadr_user_profile_role', owner.role);
        applyMode();                       // back to normal mode with the owner filled in
        $('login-password').value = p1;
        e.target.requestSubmit();          // app.js signs in as usual
    }, true);

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(applyMode, 0)); else setTimeout(applyMode, 0);
    window.ownerLoginRefresh = applyMode;
})();
