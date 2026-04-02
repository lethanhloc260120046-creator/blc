/**
 * web3_integration.js — Smart contract interaction layer for the P2P Escrow marketplace.
 *
 * Depends on:
 *   - ethers.js v6 loaded globally via CDN (window.ethers)
 *   - getCsrfToken() from auth.js (loaded before this file)
 *
 * Exposed functions:
 *   - initContract()
 *   - createEscrowTx(txId, sellerAddress, amountInWei)
 *   - payEscrowTx(txId, amountInWei)
 *   - confirmEscrowTx(txId)
 *   - cancelEscrowTx(txId)
 *   - getTransaction(txId)
 *   - getFeePercent()
 *   - setFeePercentTx(newFee)
 *   - updateTransactionStatus(transactionId, status, txHash)
 */

// ── Contract constants ──────────────────────────────────────────────────────
const CONTRACT_ADDRESS = '0x35F481cE890d00b58AF788494beE2b81D7eE6E54';
const REQUIRED_CHAIN_ID_HEX = '0xaa36a7';
const REQUIRED_CHAIN_NAME = 'Sepolia';
const REQUIRED_CHAIN_CONFIG = {
    chainId: REQUIRED_CHAIN_ID_HEX,
    chainName: 'Sepolia',
    nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/AK66B1YoH3D7dYP2qJKBZ'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "_txId", "type": "uint256"}],
        "name": "cancel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_txId", "type": "uint256"}],
        "name": "confirm",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_txId", "type": "uint256"},
            {"internalType": "address payable", "name": "_seller", "type": "address"},
            {"internalType": "uint256", "name": "_amount", "type": "uint256"}
        ],
        "name": "createTransaction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_txId", "type": "uint256"}],
        "name": "pay",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_txId", "type": "uint256"},
            {"internalType": "bool", "name": "_favorBuyer", "type": "bool"}
        ],
        "name": "resolveDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_newFee", "type": "uint256"}],
        "name": "setFeePercent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "admin",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feePercent",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "transactions",
        "outputs": [
            {"internalType": "address payable", "name": "buyer", "type": "address"},
            {"internalType": "address payable", "name": "seller", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "enum EscrowMarketplace.State", "name": "state", "type": "uint8"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// ── Module-level references (populated by initContract) ─────────────────────
let provider = null;
let signer = null;
let contract = null;

async function ensureRequiredChain() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to interact with the blockchain.');
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: REQUIRED_CHAIN_ID_HEX }],
        });
    } catch (error) {
        if (error.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [REQUIRED_CHAIN_CONFIG],
            });
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: REQUIRED_CHAIN_ID_HEX }],
            });
            return;
        }

        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            alert('Bạn cần chuyển MetaMask sang mạng ' + REQUIRED_CHAIN_NAME + ' để thanh toán.');
        } else {
            alert('Không thể chuyển sang mạng ' + REQUIRED_CHAIN_NAME + ': ' + (error.message || 'Unknown error.'));
        }
        throw error;
    }
}

/**
 * Initialize the ethers provider, signer, and contract instance.
 * Requests MetaMask account access if not already connected.
 *
 * @returns {ethers.Contract} The connected contract instance.
 */
async function initContract() {
    try {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed. Please install MetaMask to interact with the blockchain.');
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        await ensureRequiredChain();
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        return contract;
    } catch (error) {
        console.error('initContract error:', error);
        alert('Failed to connect to MetaMask: ' + (error.message || 'Unknown error.'));
        throw error;
    }
}

/**
 * Call the smart contract's createTransaction function.
 *
 * @param {number|string} txId          - The transaction ID on the contract.
 * @param {string}        sellerAddress - The seller's wallet address.
 * @param {bigint|string} amountInWei   - The escrow amount in Wei.
 * @returns {object} The transaction receipt.
 */
async function createEscrowTx(txId, sellerAddress, amountInWei) {
    try {
        const tx = await contract.createTransaction(txId, sellerAddress, amountInWei);
        const receipt = await tx.wait();
        console.log('createEscrowTx mined:', receipt.hash);
        return receipt;
    } catch (error) {
        console.error('createEscrowTx error:', error);
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            alert('Transaction cancelled. You rejected the request in MetaMask.');
        } else {
            alert('Failed to create escrow transaction: ' + (error.reason || error.message || 'Unknown error.'));
        }
        throw error;
    }
}

/**
 * Call the smart contract's pay function (sends ETH).
 *
 * @param {number|string} txId        - The transaction ID on the contract.
 * @param {bigint|string} amountInWei - The amount of ETH to send, in Wei.
 * @returns {object} The transaction receipt.
 */
async function payEscrowTx(txId, amountInWei) {
    try {
        const tx = await contract.pay(txId, { value: amountInWei });
        const receipt = await tx.wait();
        console.log('payEscrowTx mined:', receipt.hash);
        return receipt;
    } catch (error) {
        console.error('payEscrowTx error:', error);
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            alert('Payment cancelled. You rejected the request in MetaMask.');
        } else {
            alert('Failed to fund escrow: ' + (error.reason || error.message || 'Unknown error.'));
        }
        throw error;
    }
}

/**
 * Call the smart contract's confirm function to release funds to seller.
 *
 * @param {number|string} txId - The transaction ID on the contract.
 * @returns {object} The transaction receipt.
 */
async function confirmEscrowTx(txId) {
    try {
        const tx = await contract.confirm(txId);
        const receipt = await tx.wait();
        console.log('confirmEscrowTx mined:', receipt.hash);
        return receipt;
    } catch (error) {
        console.error('confirmEscrowTx error:', error);
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            alert('Confirmation cancelled. You rejected the request in MetaMask.');
        } else {
            alert('Failed to confirm transaction: ' + (error.reason || error.message || 'Unknown error.'));
        }
        throw error;
    }
}

/**
 * Call the smart contract's cancel function to refund the buyer.
 *
 * @param {number|string} txId - The transaction ID on the contract.
 * @returns {object} The transaction receipt.
 */
async function cancelEscrowTx(txId) {
    try {
        const tx = await contract.cancel(txId);
        const receipt = await tx.wait();
        console.log('cancelEscrowTx mined:', receipt.hash);
        return receipt;
    } catch (error) {
        console.error('cancelEscrowTx error:', error);
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            alert('Cancellation rejected. You rejected the request in MetaMask.');
        } else {
            alert('Failed to cancel transaction: ' + (error.reason || error.message || 'Unknown error.'));
        }
        throw error;
    }
}

/**
 * Call the smart contract's resolveDispute function (admin only).
 * Resolves a dispute by either refunding the buyer or paying the seller.
 *
 * @param {number|string} txId       - The transaction ID on the contract.
 * @param {boolean}       favorBuyer - true = refund buyer, false = pay seller.
 * @returns {object} The transaction receipt.
 */
async function resolveDisputeTx(txId, favorBuyer) {
    try {
        const tx = await contract.resolveDispute(txId, favorBuyer);
        const receipt = await tx.wait();
        console.log('resolveDisputeTx mined:', receipt.hash);
        return receipt;
    } catch (error) {
        console.error('resolveDisputeTx error:', error);
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            alert('Dispute resolution cancelled. You rejected the request in MetaMask.');
        } else {
            alert('Failed to resolve dispute: ' + (error.reason || error.message || 'Unknown error.'));
        }
        throw error;
    }
}

/**
 * Read a transaction's data from the smart contract.
 *
 * @param {number|string} txId - The transaction ID on the contract.
 * @returns {object} The transaction data (buyer, seller, amount, state).
 */
async function getTransaction(txId) {
    try {
        const result = await contract.transactions(txId);
        return result;
    } catch (error) {
        console.error('getTransaction error:', error);
        alert('Failed to fetch transaction data: ' + (error.message || 'Unknown error.'));
        throw error;
    }
}

/**
 * Read the current platform fee percentage from the smart contract.
 *
 * @returns {number} The fee percentage (e.g. 3 means 3%).
 */
async function getFeePercent() {
    try {
        const fee = await contract.feePercent();
        return Number(fee);
    } catch (error) {
        console.error('getFeePercent error:', error);
        alert('Failed to fetch fee percent: ' + (error.message || 'Unknown error.'));
        throw error;
    }
}

/**
 * Set a new platform fee percentage on the smart contract (admin only).
 *
 * @param {number} newFee - The new fee percentage (0–20).
 * @returns {object} The transaction receipt.
 */
async function setFeePercentTx(newFee) {
    try {
        const tx = await contract.setFeePercent(newFee);
        const receipt = await tx.wait();
        console.log('setFeePercentTx mined:', receipt.hash);
        return receipt;
    } catch (error) {
        console.error('setFeePercentTx error:', error);
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            alert('Fee update cancelled. You rejected the request in MetaMask.');
        } else {
            alert('Failed to set fee percent: ' + (error.reason || error.message || 'Unknown error.'));
        }
        throw error;
    }
}

/**
 * Call the Django API to update a transaction's status in the database.
 *
 * @param {number|string} transactionId - The Django Transaction primary key.
 * @param {string}        status        - The new status (e.g. 'Funded', 'Completed', 'Cancelled').
 * @param {string}        txHash        - The blockchain transaction hash.
 * @returns {object} The JSON response from the server.
 */
async function updateTransactionStatus(transactionId, status, txHash) {
    try {
        const response = await fetch('/transactions/api/update_status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({
                transaction_id: transactionId,
                status: status,
                tx_hash: txHash,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to update transaction status.');
        }

        console.log('Transaction status updated:', data);
        return data;
    } catch (error) {
        console.error('updateTransactionStatus error:', error);
        alert('Failed to update transaction status: ' + (error.message || 'Unknown error.'));
        throw error;
    }
}
