# Phân chia nhóm học và báo cáo theo luồng

Tài liệu này được chia theo 4 luồng chính trong dự án để 4 thành viên trong nhóm có thể học và thuyết trình rõ ràng, không bị trùng phần.

## 1. Thành viên 1 - Luồng đăng nhập bằng MetaMask

### Mục tiêu cần hiểu
- Người dùng đăng nhập bằng ví MetaMask như thế nào
- Backend xác thực chữ ký ra sao
- Sau khi đăng nhập thì hệ thống lưu session như thế nào

### File chính cần học
- [users/views.py](./users/views.py)
- [static/js/auth.js](./static/js/auth.js)
- [static/js/main.js](./static/js/main.js)

### Hàm chính cần học
- [users/views.py] `login_page(request)`: hiển thị trang đăng nhập.
- [users/views.py] `get_nonce_api(request)`: cấp nonce để ký xác thực.
- [users/views.py] `verify_signature_api(request)`: kiểm tra chữ ký MetaMask và tạo phiên đăng nhập.
- [users/views.py] `logout_view(request)`: đăng xuất người dùng.
- [static/js/auth.js] `loginWithMetaMask()`: kết nối MetaMask, lấy nonce, ký message và gửi lên backend để đăng nhập.

### Khi báo cáo nên nói
- Hệ thống không đăng nhập bằng mật khẩu truyền thống.
- Người dùng ký một message bằng MetaMask để xác thực quyền sở hữu ví.
- Backend dùng nonce để tránh giả mạo đăng nhập lại bằng chữ ký cũ.

---

## 2. Thành viên 2 - Luồng tạo sản phẩm để đăng bán

### Mục tiêu cần hiểu
- Người bán tạo sản phẩm ở đâu
- Dữ liệu sản phẩm được lưu và sửa như thế nào
- Trang nào hiển thị sản phẩm cho người bán quản lý
- Trang chi tiết sản phẩm là điểm bắt đầu để người mua đi sang luồng blockchain checkout
- Phần này cũng có cầu nối sang blockchain để người mua bắt đầu thanh toán escrow từ trang chi tiết sản phẩm

### File chính cần học
- [marketplace/views.py](./marketplace/views.py)
- [templates/marketplace/sell_item.html](./templates/marketplace/sell_item.html)
- [templates/marketplace/edit_product.html](./templates/marketplace/edit_product.html)
- [templates/marketplace/product_detail.html](./templates/marketplace/product_detail.html)
- [static/js/main.js](./static/js/main.js)

### Hàm chính cần học
- [marketplace/views.py] `sell_item(request)`: mở form đăng sản phẩm.
- [marketplace/views.py] `create_product(request)`: nhận dữ liệu và tạo sản phẩm mới.
- [marketplace/views.py] `edit_product(request, product_id)`: mở form sửa sản phẩm.
- [marketplace/views.py] `update_product(request, product_id)`: lưu thay đổi của sản phẩm.
- [marketplace/views.py] `my_products(request)`: xem danh sách sản phẩm của chính mình.
- [marketplace/views.py] `product_detail(request, product_id)`: hiển thị chi tiết sản phẩm, seller wallet và nút sang checkout blockchain.
- [static/js/main.js] `initiateCheckout(productId, sellerWallet, priceInVnd, shippingData)`: bắt đầu checkout escrow từ trang chi tiết sản phẩm.

### Khi báo cáo nên nói
- Người bán nhập thông tin sản phẩm qua form.
- Sau khi lưu, sản phẩm sẽ xuất hiện trong hệ thống để chờ duyệt hoặc hiển thị.
- Trang chi tiết sản phẩm là nơi người mua xem thông tin và bấm sang checkout bằng smart contract escrow.
- Từ trang này, người mua bắt đầu bước giao dịch blockchain đầu tiên trước khi sang phần thanh toán và xác nhận.
- Đây là phần dữ liệu nền tảng để luồng mua bán và blockchain hoạt động tiếp theo.

---

## 3. Thành viên 3 - Luồng mua sản phẩm đến confirm đơn hàng

### Mục tiêu cần hiểu
- Người dùng xem sản phẩm và đưa vào mua như thế nào
- Checkout tạo đơn ra sao
- MetaMask được dùng ở các bước nào
- Xác nhận đơn hàng và hoàn tiền hoạt động thế nào

### File chính cần học
- [marketplace/views.py](./marketplace/views.py)
- [static/js/main.js](./static/js/main.js)
- [static/js/web3_integration.js](./static/js/web3_integration.js)
- [transactions/views.py](./transactions/views.py)
- [templates/transactions/checkout.html](./templates/transactions/checkout.html)
- [templates/transactions/transaction_detail.html](./templates/transactions/transaction_detail.html)
- [marketplace/views.py](./marketplace/views.py)

### Hàm chính cần học

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

### Khi báo cáo nên nói
- Người mua xem sản phẩm, vào checkout rồi tạo đơn.
- MetaMask chỉ được dùng khi tạo và xác nhận giao dịch blockchain.
- Tiền được giữ theo cơ chế escrow, sau đó buyer xác nhận nhận hàng thì mới giải ngân.
- Nếu hủy giữa chừng, hệ thống rollback đơn để sản phẩm được trả lại trạng thái có thể mua tiếp.

---

## 4. Thành viên 4 - Luồng admin blockchain

### Mục tiêu cần hiểu
- Admin theo dõi hệ thống ở đâu
- Cách chia phí sàn hoạt động thế nào
- Cách admin giải quyết tranh chấp và trả hàng hoàn tiền

### File chính cần học
- [transactions/views.py](./transactions/views.py)
- [static/js/main.js](./static/js/main.js)
- [static/js/web3_integration.js](./static/js/web3_integration.js)
- [templates/transactions/admin_dashboard.html](./templates/transactions/admin_dashboard.html)
- [templates/transactions/admin_refund_list.html](./templates/transactions/admin_refund_list.html)
- [templates/transactions/admin_refund_detail.html](./templates/transactions/admin_refund_detail.html)

### Hàm chính cần học
- [transactions/views.py] `admin_dashboard(request)`: trang dashboard tổng quan của admin.
- [transactions/views.py] `admin_refund_list(request)`: danh sách yêu cầu trả hàng/hoàn tiền.
- [transactions/views.py] `admin_refund_detail(request, refund_id)`: chi tiết một yêu cầu tranh chấp.
- [transactions/views.py] `admin_resolve_refund(request)`: cập nhật DB sau khi admin xử lý xong.
- [static/js/main.js] `adminResolveDispute(refundId, txId, favorBuyer, adminNote)`: gọi từ frontend để admin xử lý tranh chấp.
- [static/js/web3_integration.js] `resolveDisputeTx(txId, favorBuyer)`: gọi smart contract để phân xử tranh chấp.
- [static/js/web3_integration.js] `getFeePercent()`: đọc phí sàn hiện tại trên blockchain.
- [static/js/web3_integration.js] `setFeePercentTx(newFee)`: cập nhật phí sàn trên blockchain.

### Khi báo cáo nên nói
- Admin không chỉ quản lý dữ liệu mà còn tham gia xử lý phần blockchain quan trọng.
- Hai nhiệm vụ chính là chia phí sàn và xử lý tranh chấp.
- Mọi thay đổi quan trọng đều được đồng bộ giữa smart contract và database để tránh lệch trạng thái.

---

## Gợi ý chia báo cáo

- Thành viên 1: mở đầu, đăng nhập MetaMask.
- Thành viên 2: tạo sản phẩm, quản lý sản phẩm.
- Thành viên 3: mua hàng, checkout, confirm đơn hàng.
- Thành viên 4: admin dashboard, phí sàn, tranh chấp, trả hàng hoàn tiền.

## Ghi chú

- Nếu cần nói ngắn trước giảng viên, mỗi thành viên chỉ cần nắm 3 phần:
  - mục đích của luồng
  - file chính xử lý
  - các hàm quan trọng
- Nếu cần demo thực tế, nên chạy theo đúng thứ tự:
  - đăng nhập
  - tạo sản phẩm
  - mua hàng và confirm
  - admin xử lý tranh chấp
