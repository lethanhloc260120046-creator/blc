/**
 * main.js — General UI utilities and checkout / transaction flows.
 *
 * Depends on:
 *   - ethers.js v6 loaded globally via CDN (window.ethers)
 *   - auth.js         → getCsrfToken()
 *   - web3_integration.js → initContract(), createEscrowTx(), payEscrowTx(),
 *                           confirmEscrowTx(), cancelEscrowTx(), updateTransactionStatus(),
 *                           getTransaction()
 *
 * Exposed functions:
 *   - initiateCheckout(productId, sellerWallet, priceInVnd, shippingData)
 *   - confirmTransaction(txId)
 *   - cancelTransaction(txId)
 *   - payTransaction(txId)
 *   - truncateAddress(address)
 *   - formatVND(number)
 *   - formatAllVndPrices()
 *   - convertAllVndToEth()
 */

// ═══════════════════════════════════════════════════════════════════════
// VND ↔ ETH Conversion Utility
// ═══════════════════════════════════════════════════════════════════════

var ETH_VND_RATE = null;
var MOBILE_CHECKOUT_STATE = null;

function formatVND(amount) {
    if (amount == null || isNaN(amount)) return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

function formatAllVndPrices() {
    document.querySelectorAll('.vnd-price').forEach(function(el) {
        var vnd = parseFloat(el.getAttribute('data-vnd'));
        if (!isNaN(vnd)) {
            el.textContent = formatVND(vnd);
        }
    });
}

function convertAllVndToEth() {
    if (!ETH_VND_RATE) return;
    document.querySelectorAll('.vnd-to-eth').forEach(function(el) {
        var vnd = parseFloat(el.getAttribute('data-vnd-price'));
        if (!isNaN(vnd) && vnd > 0) {
            var eth = vnd / ETH_VND_RATE;
            el.textContent = '≈ ' + eth.toFixed(6) + ' ETH';
        }
    });
}

function formatWalletBalance(ethAmount) {
    if (ethAmount == null || isNaN(ethAmount)) return '';

    var vndText = '';
    if (ETH_VND_RATE) {
        var vndAmount = ethAmount * ETH_VND_RATE;
        vndText = ' / ' + formatVND(vndAmount);
    }

    return ethAmount.toFixed(4) + ' ETH' + vndText;
}

function isMetaMaskMobileBrowser() {
    var ua = (navigator.userAgent || '').toLowerCase();
    return ua.indexOf('metamaskmobile') !== -1;
}

function getAmountInWeiFromVnd(priceInVnd) {
    var ethAmount = parseFloat(priceInVnd) / ETH_VND_RATE;
    var ethString = ethAmount.toFixed(8);
    return ethers.parseEther(ethString);
}

async function refreshNavWalletBalance() {
    var balanceWrap = document.getElementById('nav-balance-display');
    var balanceEl = document.getElementById('nav-wallet-balance');

    if (!balanceWrap || !balanceEl) return;

    var walletAddress = balanceWrap.getAttribute('data-wallet-address');
    if (!walletAddress) return;

    balanceEl.classList.remove('hidden');

    try {
        var response = await fetch('/users/api/wallet_balance/', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        var data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Balance unavailable');
        }

        var ethBalance = parseFloat(data.eth_balance);
        balanceEl.textContent = formatWalletBalance(ethBalance);
    } catch (error) {
        console.warn('Could not load wallet balance:', error);
        balanceEl.textContent = 'Balance unavailable';
    }
}

(function fetchEthVndRate() {
    formatAllVndPrices();
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=vnd')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data && data.ethereum && data.ethereum.vnd) {
                ETH_VND_RATE = data.ethereum.vnd;
                convertAllVndToEth();
                refreshNavWalletBalance();
            }
        })
        .catch(function(err) {
            console.warn('Could not fetch ETH/VND rate:', err);
        });
})();

refreshNavWalletBalance();

/**
 * Truncate an Ethereum address for display.
 * E.g. "0x1234567890abcdef1234567890abcdef12345678" → "0x1234...5678"
 *
 * @param {string} address - Full Ethereum address.
 * @returns {string} Truncated address string.
 */
function truncateAddress(address) {
    if (!address || address.length < 10) return address || '';
    return address.slice(0, 6) + '...' + address.slice(-4);
}

/**
 * Full checkout flow: create a DB transaction, create on-chain escrow,
 * fund the escrow, update DB status, and redirect.
 *
 * @param {number|string} productId    - The Django Product primary key.
 * @param {string}        sellerWallet - The seller's wallet address.
 * @param {string}        priceInVnd   - The product price in VND (e.g. "25000000").
 */
async function initiateCheckout(productId, sellerWallet, priceInVnd, shippingData) {
    const checkoutBtn = document.getElementById('checkout-btn');
    const originalBtnText = checkoutBtn ? checkoutBtn.textContent : '';
    let transactionId = null;
    let escrowCreatedOnChain = false;

    try {
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Processing…';
        }

        // ── Step 0: Ensure ETH/VND rate is available ────────────────────
        if (!ETH_VND_RATE) {
            if (checkoutBtn) checkoutBtn.textContent = 'Đang tải tỷ giá…';
            try {
                const rateRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=vnd');
                const rateData = await rateRes.json();
                if (rateData && rateData.ethereum && rateData.ethereum.vnd) {
                    ETH_VND_RATE = rateData.ethereum.vnd;
                }
            } catch (e) { /* ignore */ }
            if (!ETH_VND_RATE) {
                throw new Error('Không thể tải tỷ giá ETH/VND. Vui lòng kiểm tra kết nối mạng và thử lại.');
            }
        }

        if (isMetaMaskMobileBrowser()) {
            await handleMobileCheckoutFlow(productId, sellerWallet, priceInVnd, shippingData, checkoutBtn, originalBtnText);
            return;
        }

        // ── Step 1: Create DB transaction ───────────────────────────────
        if (checkoutBtn) checkoutBtn.textContent = 'Creating order…';

        const checkoutResponse = await fetch(`/transactions/checkout/${productId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(shippingData || {}),
        });

        const checkoutData = await checkoutResponse.json();

        if (!checkoutResponse.ok || !checkoutData.success) {
            throw new Error(checkoutData.error || 'Failed to create transaction in the database.');
        }

        transactionId = checkoutData.transaction_id;

        // ── Step 2: Initialize contract ─────────────────────────────────
        if (checkoutBtn) checkoutBtn.textContent = 'Connecting to wallet…';

        await initContract();

        // ── Step 3: Convert VND → ETH → Wei ─────────────────────────────
        var ethAmount = parseFloat(priceInVnd) / ETH_VND_RATE;
        var ethString = ethAmount.toFixed(8);
        const amountInWei = ethers.parseEther(ethString);

        // ── Step 4: Create escrow on-chain ──────────────────────────────
        if (checkoutBtn) checkoutBtn.textContent = 'Creating escrow on-chain…';

        const createReceipt = await createEscrowTx(transactionId, sellerWallet, amountInWei);
        escrowCreatedOnChain = true;
        await updateTransactionStatus(transactionId, 'Created', createReceipt.hash);

        // ── Step 5: Fund the escrow ─────────────────────────────────────
        if (checkoutBtn) checkoutBtn.textContent = 'Funding escrow…';

        const payReceipt = await payEscrowTx(transactionId, amountInWei);

        // ── Step 6: Update DB status to 'Funded' ────────────────────────
        if (checkoutBtn) checkoutBtn.textContent = 'Updating order status…';

        await updateTransactionStatus(transactionId, 'Funded', payReceipt.hash);

        // ── Step 7: Redirect to transaction history ─────────────────────
        alert('Checkout successful! Your escrow has been funded.');
        window.location.href = '/transactions/history/';

    } catch (error) {
        console.error('initiateCheckout error:', error);

        if (transactionId && !escrowCreatedOnChain) {
            try {
                await abandonCheckoutRecord(transactionId);
            } catch (cleanupError) {
                console.error('abandonCheckoutRecord error:', cleanupError);
            }
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = originalBtnText || 'Checkout';
        }

        if (error.code !== 'ACTION_REJECTED' && error.code !== 4001) {
            // Avoid duplicate alerts — lower-level functions already alert
        }
    }
}

async function createCheckoutRecord(productId, shippingData) {
    const checkoutResponse = await fetch(`/transactions/checkout/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(shippingData || {}),
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok || !checkoutData.success) {
        throw new Error(checkoutData.error || 'Failed to create transaction in the database.');
    }

    return checkoutData.transaction_id;
}

async function handleMobileCheckoutFlow(productId, sellerWallet, priceInVnd, shippingData, checkoutBtn, originalBtnText) {
    try {
        if (!MOBILE_CHECKOUT_STATE) {
            if (checkoutBtn) checkoutBtn.textContent = 'Creating order…';

            var mobileTransactionId = await createCheckoutRecord(productId, shippingData);

            MOBILE_CHECKOUT_STATE = {
                productId: productId,
                sellerWallet: sellerWallet,
                priceInVnd: priceInVnd,
                shippingData: shippingData,
                transactionId: mobileTransactionId,
                step: 'create',
            };

            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Bấm lại để tạo giao dịch trên MetaMask';
            }

            alert('Đơn hàng đã được chuẩn bị. Trên MetaMask mobile, vui lòng bấm nút thêm 1 lần để xác nhận tạo giao dịch.');
            return;
        }

        if (MOBILE_CHECKOUT_STATE.step === 'create') {
            if (checkoutBtn) checkoutBtn.textContent = 'Opening MetaMask…';

            await initContract();

            var createAmountInWei = getAmountInWeiFromVnd(MOBILE_CHECKOUT_STATE.priceInVnd);
            var createReceipt = await createEscrowTx(
                MOBILE_CHECKOUT_STATE.transactionId,
                MOBILE_CHECKOUT_STATE.sellerWallet,
                createAmountInWei
            );

            await updateTransactionStatus(MOBILE_CHECKOUT_STATE.transactionId, 'Created', createReceipt.hash);
            MOBILE_CHECKOUT_STATE.step = 'pay';

            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Bấm lại để nạp tiền vào escrow';
            }

            alert('Đã tạo giao dịch trên blockchain. Vui lòng bấm thêm 1 lần nữa để nạp tiền vào escrow.');
            return;
        }

        if (MOBILE_CHECKOUT_STATE.step === 'pay') {
            if (checkoutBtn) checkoutBtn.textContent = 'Funding escrow…';

            await initContract();

            var payAmountInWei = getAmountInWeiFromVnd(MOBILE_CHECKOUT_STATE.priceInVnd);
            var payReceipt = await payEscrowTx(MOBILE_CHECKOUT_STATE.transactionId, payAmountInWei);

            await updateTransactionStatus(MOBILE_CHECKOUT_STATE.transactionId, 'Funded', payReceipt.hash);
            MOBILE_CHECKOUT_STATE = null;

            alert('Checkout successful! Your escrow has been funded.');
            window.location.href = '/transactions/history/';
        }
    } catch (error) {
        console.error('handleMobileCheckoutFlow error:', error);

        if (MOBILE_CHECKOUT_STATE && MOBILE_CHECKOUT_STATE.step === 'create' &&
            error.code !== 'ACTION_REJECTED' && error.code !== 4001) {
            // Keep state so the user can retry create on-chain without recreating the DB order.
        }

        if (MOBILE_CHECKOUT_STATE && MOBILE_CHECKOUT_STATE.step === 'create' &&
            (error.code === 'ACTION_REJECTED' || error.code === 4001)) {
            try {
                await abandonCheckoutRecord(MOBILE_CHECKOUT_STATE.transactionId);
            } catch (cleanupError) {
                console.error('abandonCheckoutRecord error:', cleanupError);
            }
            MOBILE_CHECKOUT_STATE = null;
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = MOBILE_CHECKOUT_STATE
                ? (MOBILE_CHECKOUT_STATE.step === 'create'
                    ? 'Bấm lại để tạo giao dịch trên MetaMask'
                    : 'Bấm lại để nạp tiền vào escrow')
                : (originalBtnText || 'Checkout');
        }
    }
}

async function abandonCheckoutRecord(transactionId) {
    const response = await fetch('/transactions/api/abandon_checkout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
            transaction_id: transactionId,
        }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to abandon checkout.');
    }

    return data;
}

/**
 * Confirm delivery: release escrow funds to the seller.
 *
 * @param {number|string} txId - The transaction ID (used both as Django PK and on-chain ID).
 */
async function confirmTransaction(txId) {
    try {
        if (!confirm('Are you sure you want to confirm delivery? This will release the funds to the seller.')) {
            return;
        }

        // ── Step 1: Initialize contract ─────────────────────────────────
        await initContract();

        // ── Step 2: Confirm on-chain ────────────────────────────────────
        const receipt = await confirmEscrowTx(txId);

        // ── Step 3: Update DB status ────────────────────────────────────
        await updateTransactionStatus(txId, 'Completed', receipt.hash);

        alert('Transaction confirmed! Funds have been released to the seller.');
        window.location.reload();

    } catch (error) {
        console.error('confirmTransaction error:', error);
        // Errors are already alerted by lower-level functions
    }
}

/**
 * Cancel/refund: cancel the escrow and refund the buyer.
 *
 * @param {number|string} txId - The transaction ID (used both as Django PK and on-chain ID).
 */
async function cancelTransaction(txId) {
    try {
        if (!confirm('Are you sure you want to cancel this transaction? The buyer will be refunded.')) {
            return;
        }

        // ── Step 1: Initialize contract ─────────────────────────────────
        await initContract();

        // ── Step 2: Cancel on-chain ─────────────────────────────────────
        const receipt = await cancelEscrowTx(txId);

        // ── Step 3: Update DB status ────────────────────────────────────
        await updateTransactionStatus(txId, 'Cancelled', receipt.hash);

        alert('Transaction cancelled. The buyer has been refunded.');
        window.location.reload();

    } catch (error) {
        console.error('cancelTransaction error:', error);
        // Errors are already alerted by lower-level functions
    }
}

/**
 * Fund an already-created escrow transaction.
 * Reads the exact Wei amount from the smart contract to avoid rate mismatch.
 *
 * @param {number|string} txId - The transaction ID (used both as Django PK and on-chain ID).
 */
async function payTransaction(txId) {
    try {
        await initContract();

        var txData = await getTransaction(txId);
        var amountInWei = txData[2];

        if (!amountInWei || amountInWei.toString() === '0') {
            alert('Giao dịch chưa được tạo trên blockchain. Vui lòng thử lại checkout.');
            return;
        }

        const receipt = await payEscrowTx(txId, amountInWei);
        await updateTransactionStatus(txId, 'Funded', receipt.hash);

        alert('Escrow funded successfully!');
        window.location.reload();

    } catch (error) {
        console.error('payTransaction error:', error);
    }
}

/**
 * Submit a refund/return request for a Funded transaction.
 * Called from the refund modal form in history.html.
 *
 * @param {HTMLFormElement} formElement - The refund request form.
 */
async function submitRefundRequest(formElement) {
    var submitBtn = formElement.querySelector('button[type="submit"]');
    var originalText = submitBtn ? submitBtn.textContent : '';

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang gửi...';
        }

        var formData = new FormData(formElement);

        var response = await fetch('/transactions/api/refund_request/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
            },
            body: formData,
        });

        var contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Server trả về lỗi (status ' + response.status + '). Vui lòng đăng nhập lại và thử lại.');
        }

        var data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Gửi yêu cầu thất bại.');
        }

        alert(data.message || 'Yêu cầu trả hàng đã được gửi!');
        window.location.reload();

    } catch (error) {
        console.error('submitRefundRequest error:', error);
        alert('Lỗi: ' + error.message);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Admin resolves a dispute on-chain and updates the DB.
 *
 * @param {number|string} refundId   - The RefundRequest ID in Django DB.
 * @param {number|string} txId       - The Transaction ID (on-chain and DB).
 * @param {boolean}       favorBuyer - true = approve (refund buyer), false = reject (pay seller).
 * @param {string}        adminNote  - Optional admin note.
 */
async function adminResolveDispute(refundId, txId, favorBuyer, adminNote) {
    var actionLabel = favorBuyer ? 'hoàn tiền cho Buyer' : 'chuyển tiền cho Seller';

    if (!confirm('Bạn có chắc muốn ' + actionLabel + '? Hành động này không thể hoàn tác.')) {
        return;
    }

    try {
        await initContract();

        var receipt = await resolveDisputeTx(txId, favorBuyer);

        var response = await fetch('/transactions/api/admin/resolve_refund/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({
                refund_id: refundId,
                action: favorBuyer ? 'approve' : 'reject',
                admin_note: adminNote || '',
                tx_hash: receipt.hash,
            }),
        });

        var contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Server trả về lỗi (status ' + response.status + '). Vui lòng đăng nhập lại và thử lại.');
        }

        var data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Cập nhật DB thất bại.');
        }

        alert(data.message || 'Đã xử lý thành công!');
        window.location.reload();

    } catch (error) {
        console.error('adminResolveDispute error:', error);
        alert('Lỗi: ' + (error.message || 'Không thể xử lý yêu cầu.'));
    }
}
