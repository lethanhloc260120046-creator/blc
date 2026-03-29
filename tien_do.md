# Tiến độ dự án P2P Escrow Marketplace

## Smart Contract
- **Address (v2):** `0x35F481cE890d00b58AF788494beE2b81D7eE6E54`
- **Network:** Sepolia Testnet
- **Phí sàn:** 3% (có thể điều chỉnh qua `setFeePercent()`)
- **Functions:** createTransaction, pay, confirm, cancel, resolveDispute, setFeePercent, feePercent

## Các Phase đã hoàn thành

### Phase 1-4: Core Setup
- [x] Django project + PostgreSQL (Supabase)
- [x] User authentication via MetaMask (sign nonce)
- [x] Marketplace: product list, detail, cart, sell item
- [x] Transactions: checkout, escrow payment flow, history
- [x] Cloudinary image upload
- [x] Chạy migrations

### Phase 5: Hệ thống giá VND
- [x] Giá lưu bằng VND trong DB
- [x] Hiển thị VND chính, ETH phụ (quy đổi real-time CoinGecko)
- [x] Form đăng bán nhập giá VND
- [x] Dữ liệu demo 10 sản phẩm giá VND thực tế

### Phase 6: Yêu cầu trả hàng / Hoàn tiền
- [x] Model RefundRequest (reason, evidence images, status)
- [x] Buyer submit refund request (modal form + Cloudinary upload)
- [x] Admin refund list + detail pages
- [x] Admin resolve dispute (on-chain resolveDispute + DB update)
- [x] Fix JSON.parse error (manual auth check thay @login_required)

### Phase 7: Phí sàn (Platform Fee)
- [x] Smart Contract v2: confirm() trừ 3% phí → admin wallet
- [x] resolveDispute(favorSeller) cũng trừ phí
- [x] cancel/refund hoàn 100% cho buyer
- [x] JS: getFeePercent(), setFeePercentTx()
- [x] Deploy contract mới, cập nhật ABI + address

### Phase 8: Admin Dashboard
- [x] Thống kê phí sàn (VND + ETH)
- [x] Transaction stats (tổng, funded, disputed, cancelled)
- [x] Giao dịch hoàn tất gần đây + Etherscan links
- [x] Smart Contract info card + đồng bộ feePercent on-chain
- [x] Quick actions: Quản lý SP, Quản lý users, Duyệt trả hàng

### Phase 9: Quản lý sản phẩm + User
- [x] Product status: AVAILABLE, PENDING_APPROVAL, HIDDEN, SOLD
- [x] User đăng bán → PENDING_APPROVAL → Admin duyệt → AVAILABLE
- [x] Seller/Admin sửa thông tin sản phẩm (edit_product)
- [x] My Products page
- [x] Admin product list (filter, approve/reject/hide/edit)
- [x] Admin user list (lock/unlock account)
- [x] Login check is_locked → thông báo tài khoản bị khóa
- [x] Admin login → redirect admin dashboard

### Phase 10: Bảo mật & Cấu hình
- [x] Chuyển API keys / DB credentials sang .env (python-dotenv)
- [x] .env.example template
- [x] .gitignore

### Phase 11: Nâng cấp checkout + Chi tiết đơn hàng + Admin quản lý đơn hàng
- [x] Ẩn nút Mua khi xem sản phẩm của chính mình
- [x] Checkout: form thông tin giao hàng (Tên, SĐT, Tỉnh/Quận/Phường/Địa chỉ)
- [x] API proxy tỉnh thành VN (provinces.open-api.vn) → cascading dropdown
- [x] Validate shipping form trước khi checkout
- [x] Lưu shipping info vào Transaction model
- [x] Trang chi tiết đơn hàng (user): full thông tin buyer/seller, shipping, refund
- [x] History: Order # clickable → chi tiết, hiện trạng thái khóa
- [x] Admin: Quản lý đơn hàng (list + filter theo status)
- [x] Admin: Chi tiết đơn hàng (full info + shipping + refund management)
- [x] Admin: Khóa/mở khóa đơn hàng (is_locked → ngăn update state)
- [x] Admin Dashboard: thêm card Quản lý đơn hàng
- [x] Transaction model: thêm receiver_name, receiver_phone, shipping_city/district/ward/address, is_locked

## Còn lại
- [ ] Test toàn bộ luồng: Login → Browse → Checkout → Pay → Confirm
- [ ] Kiểm tra responsive design
