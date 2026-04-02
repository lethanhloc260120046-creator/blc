# Giai thich cac ham lien quan den luong chinh

File nay chi tap trung vao cac luong anh can:
- dang nhap bang MetaMask
- tao san pham de dang ban
- mua san pham cho den luc confirm don hang
- phan admin blockchain nhu chia phi san va giai quyet tranh chap

## 1. Luong dang nhap bang MetaMask

### File: [users/views.py](./users/views.py)

- `login_page(request)`: hien trang dang nhap bang vi.
- `get_nonce_api(request)`: cap nonce de MetaMask ky vao.
- `verify_signature_api(request)`: xac thuc chu ky va tao session dang nhap.
- `logout_view(request)`: dang xuat khoi he thong.
- `profile_page(request)`: hien thong tin user va vi da lien ket.

### File: [static/js/main.js](./static/js/main.js)

- `refreshNavWalletBalance()`: cap nhat so du vi len header sau khi user da dang nhap.
- `truncateAddress(address)`: rut gon dia chi vi de hien thi gon hon.

## 2. Luong tao san pham de dang ban

### File: [marketplace/views.py](./marketplace/views.py)

- `sell_item(request)`: hien form dang san pham.
- `create_product(request)`: nhan du lieu form va tao san pham moi.
- `edit_product(request, product_id)`: hien form sua san pham.
- `update_product(request, product_id)`: cap nhat thong tin san pham.
- `my_products(request)`: hien danh sach san pham cua nguoi ban.

### File: [templates/marketplace/sell_item.html](./templates/marketplace/sell_item.html)

- Form nhap thong tin san pham.
- Cac input trong file nay la noi nguoi ban nhap ten, gia, mo ta, hinh anh.

### File: [templates/marketplace/edit_product.html](./templates/marketplace/edit_product.html)

- Form sua san pham da dang.
- Dung khi nguoi ban muon chinh lai thong tin san pham.

## 3. Luong mua san pham cho den confirm don hang

### File: [marketplace/views.py](./marketplace/views.py)

- `product_detail(request, product_id)`: hien chi tiet san pham truoc khi mua.
- `cart(request)`: hien gio hang neu user them san pham vao gio.

### File: [static/js/main.js](./static/js/main.js)

- `initiateCheckout(productId, sellerWallet, priceInVnd, shippingData)`: bat dau luong checkout khi buyer bam mua.
- `createCheckoutRecord(productId, shippingData)`: tao don hang trong DB truoc khi goi blockchain.
- `handleMobileCheckoutFlow(productId, sellerWallet, priceInVnd, shippingData, checkoutBtn, originalBtnText)`: xu ly checkout rieng cho MetaMask mobile.
- `getAmountInWeiFromVnd(priceInVnd)`: doi gia VND sang wei de nap len smart contract.
- `payTransaction(txId)`: buyer nap tien vao escrow.
- `confirmTransaction(txId)`: buyer xac nhan nhan hang va giai ngan tien cho seller.
- `cancelTransaction(txId)`: buyer huy don va hoan tien.
- `abandonCheckoutRecord(transactionId)`: xoa don DB neu buyer huy truoc khi giao dich on-chain duoc tao.

### File: [static/js/web3_integration.js](./static/js/web3_integration.js)

- `ensureRequiredChain()`: ep MetaMask sang Sepolia truoc khi thanh toan.
- `initContract()`: khoi tao ket noi den smart contract.
- `createEscrowTx(txId, sellerAddress, amountInWei)`: tao giao dich escrow tren blockchain.
- `payEscrowTx(txId, amountInWei)`: gui tien vao escrow.
- `confirmEscrowTx(txId)`: xac nhan giao dich va giai ngan tien.
- `cancelEscrowTx(txId)`: huy giao dich tren smart contract.
- `getTransaction(txId)`: doc thong tin giao dich tu contract.
- `updateTransactionStatus(transactionId, status, txHash)`: dong bo trang thai giao dich ve backend.

### File: [transactions/views.py](./transactions/views.py)

- `checkout(request, product_id)`: tao don hang trong DB khi buyer vao trang checkout.
- `update_transaction_status(request)`: nhan trang thai moi tu frontend sau khi giao dich on-chain xong.
- `transaction_history(request)`: hien lich su mua ban va trang thai don.
- `transaction_detail(request, transaction_id)`: hien chi tiet don hang.
- `sync_product_status(transaction_obj)`: dong bo trang thai san pham theo trang thai don hang.
- `abandon_checkout(request)`: huy don DB neu user huy truoc khi tao giao dich tren chain.

### File: [templates/transactions/checkout.html](./templates/transactions/checkout.html)

- Trang hien thong tin san pham va nut thanh toan.
- Day la noi buyer xem lai truoc khi xac nhan mua.

### File: [templates/transactions/transaction_detail.html](./templates/transactions/transaction_detail.html)

- Trang xem chi tiet giao dich sau khi da mua.
- Cho buyer xem trang thai don va cac buoc tiep theo.

## 4. Luong admin blockchain

### File: [static/js/main.js](./static/js/main.js)

- `adminResolveDispute(refundId, txId, favorBuyer, adminNote)`: admin bam nut de giai quyet tranh chap va goi sang smart contract.

### File: [static/js/web3_integration.js](./static/js/web3_integration.js)

- `resolveDisputeTx(txId, favorBuyer)`: goi smart contract de phan xu tranh chap va chuyen tien ve ben dung.
- `getFeePercent()`: doc ty le phi san hien tai tren contract.
- `setFeePercentTx(newFee)`: cap nhat ty le phi san tren smart contract.

### File: [transactions/views.py](./transactions/views.py)

- `admin_resolve_refund(request)`: backend cap nhat lai DB sau khi admin da xu ly tranh chap.
- `admin_dashboard(request)`: hien dashboard co cac thong tin blockchain cho admin.

## 5. Thu tu nen doc neu muon hieu nhanh

1. [users/views.py](./users/views.py) de hieu luong dang nhap MetaMask
2. [marketplace/views.py](./marketplace/views.py) de hieu luong tao san pham va hien san pham
3. [static/js/main.js](./static/js/main.js) de hieu flow bam mua va confirm don
4. [static/js/web3_integration.js](./static/js/web3_integration.js) de hieu phan goi smart contract
5. [transactions/views.py](./transactions/views.py) de hieu backend luu va dong bo don hang

## 6. Tom tat cuc ngan

Neu can tim nhanh:

- Dang nhap MetaMask:
  - `get_nonce_api`
  - `verify_signature_api`

- Dang san pham:
  - `sell_item`
  - `create_product`
  - `edit_product`
  - `update_product`

- Mua san pham den confirm:
  - `initiateCheckout`
  - `createCheckoutRecord`
  - `createEscrowTx`
  - `payEscrowTx`
  - `confirmEscrowTx`
  - `confirmTransaction`
  - `update_transaction_status`

- Admin blockchain:
  - `adminResolveDispute`
  - `resolveDisputeTx`
  - `getFeePercent`
  - `setFeePercentTx`
