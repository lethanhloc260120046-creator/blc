# User 3 - Luồng mua sản phẩm đến confirm đơn hàng

## Mục tiêu cần học
- Người dùng xem sản phẩm và đưa vào mua như thế nào
- Checkout tạo đơn ra sao
- MetaMask được dùng ở các bước nào
- Xác nhận đơn hàng và hoàn tiền hoạt động thế nào

## File chính cần học
- [marketplace/views.py](./marketplace/views.py)
- [static/js/main.js](./static/js/main.js)
- [static/js/web3_integration.js](./static/js/web3_integration.js)
- [transactions/views.py](./transactions/views.py)
- [templates/transactions/checkout.html](./templates/transactions/checkout.html)
- [templates/transactions/transaction_detail.html](./templates/transactions/transaction_detail.html)

## Hàm chính cần học
- [static/js/main.js] `initiateCheckout(productId, sellerWallet, priceInVnd, shippingData)`: bắt đầu luồng mua hàng.
- [static/js/main.js] `createCheckoutRecord(productId, shippingData)`: tạo đơn trong DB trước khi lên blockchain.
- [static/js/main.js] `handleMobileCheckoutFlow(...)`: xử lý checkout riêng cho MetaMask mobile.
- [static/js/main.js] `getAmountInWeiFromVnd(priceInVnd)`: đổi giá VND sang wei.
- [static/js/web3_integration.js] `ensureRequiredChain()`: ép ví sang Sepolia.
- [static/js/web3_integration.js] `initContract()`: tạo kết nối với smart contract.
- [static/js/web3_integration.js] `createEscrowTx(txId, sellerAddress, amountInWei)`: tạo giao dịch escrow.
- [static/js/web3_integration.js] `payEscrowTx(txId, amountInWei)`: thanh toán vào escrow.
- [static/js/web3_integration.js] `confirmEscrowTx(txId)`: xác nhận đơn hàng trên chain.
- [static/js/web3_integration.js] `cancelEscrowTx(txId)`: hủy giao dịch trên chain.
- [static/js/main.js] `payTransaction(txId)`: gọi bước thanh toán từ UI.
- [static/js/main.js] `confirmTransaction(txId)`: gọi bước xác nhận từ UI.
- [static/js/main.js] `cancelTransaction(txId)`: gọi bước hủy từ UI.
- [transactions/views.py] `checkout(request, product_id)`: tạo đơn hàng phía backend.
- [transactions/views.py] `update_transaction_status(request)`: đồng bộ trạng thái từ frontend về backend.
- [transactions/views.py] `abandon_checkout(request)`: xóa đơn nếu buyer hủy trước khi tạo giao dịch on-chain.
- [transactions/views.py] `sync_product_status(transaction_obj)`: cập nhật trạng thái sản phẩm theo trạng thái đơn.

## Khi báo cáo nên nói
- Người mua xem sản phẩm, vào checkout rồi tạo đơn.
- MetaMask chỉ được dùng khi tạo và xác nhận giao dịch blockchain.
- Tiền được giữ theo cơ chế escrow, sau đó buyer xác nhận nhận hàng thì mới giải ngân.
- Nếu hủy giữa chừng, hệ thống rollback đơn để sản phẩm được trả lại trạng thái có thể mua tiếp.

