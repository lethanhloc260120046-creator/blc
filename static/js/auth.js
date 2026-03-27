/**
 * auth.js — MetaMask Web3 Authentication for TechEscrow P2P.
 *
 * Depends on:
 *   - ethers.js v6 loaded globally via CDN (window.ethers)
 *
 * Exposed functions:
 *   - getCsrfToken()      — Read Django CSRF token from cookies.
 *   - loginWithMetaMask()  — Full Web3 auth flow: connect → get nonce → sign → verify → redirect.
 */

/**
 * Read the Django CSRF token from the browser cookies.
 *
 * @returns {string|null} The CSRF token value, or null if not found.
 */
function getCsrfToken() {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken='.length) === 'csrftoken=') {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken='.length));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Full MetaMask login flow using ethers.js v6.
 *
 * 1. Request MetaMask account access.
 * 2. Fetch a one-time nonce from the backend for the wallet address.
 * 3. Ask the user to sign the nonce with their private key.
 * 4. Send the signature to the backend for verification.
 * 5. On success, redirect to the marketplace.
 */
async function loginWithMetaMask() {
    var btn = document.getElementById('metamask-btn');
    var statusEl = document.getElementById('login-status');
    var statusText = document.getElementById('login-status-text');
    var originalBtnText = btn ? btn.innerHTML : '';

    try {
        // ── Check MetaMask is installed ──────────────────────────────
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask is not installed. Please install MetaMask to continue.');
            return;
        }

        // Show loading state
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined text-xl" style="font-variation-settings: \'FILL\' 1;">hourglass_top</span> Connecting…';
        }
        if (statusEl) {
            statusEl.classList.remove('hidden');
            statusEl.classList.add('flex');
        }
        if (statusText) statusText.textContent = 'Requesting wallet connection…';

        // ── Step 1: Connect to MetaMask and get wallet address ──────
        var provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        var signer = await provider.getSigner();
        var walletAddress = await signer.getAddress();

        if (statusText) statusText.textContent = 'Wallet connected: ' + walletAddress.slice(0, 6) + '…' + walletAddress.slice(-4);

        // ── Step 2: Request nonce from the backend ──────────────────
        if (statusText) statusText.textContent = 'Requesting authentication challenge…';

        var nonceResponse = await fetch('/users/api/get_nonce/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: walletAddress }),
        });

        var nonceData = await nonceResponse.json();

        if (!nonceResponse.ok || !nonceData.nonce) {
            throw new Error(nonceData.error || 'Failed to get nonce from server.');
        }

        var nonce = nonceData.nonce;

        // ── Step 3: Sign the nonce with MetaMask ────────────────────
        if (statusText) statusText.textContent = 'Please sign the message in MetaMask…';

        var signature = await signer.signMessage(nonce);

        // ── Step 4: Send signature to backend for verification ──────
        if (statusText) statusText.textContent = 'Verifying signature…';

        var verifyResponse = await fetch('/users/api/verify_signature/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: walletAddress,
                signature: signature,
            }),
        });

        var verifyData = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Signature verification failed.');
        }

        // ── Step 5: Login successful — redirect ─────────────────────
        if (statusText) statusText.textContent = 'Login successful! Redirecting…';

        if (verifyData.is_staff) {
            window.location.href = '/transactions/admin/dashboard/';
        } else {
            window.location.href = '/marketplace/';
        }

    } catch (error) {
        console.error('loginWithMetaMask error:', error);

        // Restore button state
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnText || '<span class="material-symbols-outlined text-xl" style="font-variation-settings: \'FILL\' 1;">account_balance_wallet</span> Connect MetaMask';
        }
        if (statusEl) {
            statusEl.classList.add('hidden');
            statusEl.classList.remove('flex');
        }

        // User rejected the signature request
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            alert('Login cancelled. You rejected the signature request in MetaMask.');
        } else {
            alert('Login failed: ' + (error.message || 'Unknown error.'));
        }
    }
}
