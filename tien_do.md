# 📋 Tiến Độ Dự Án — TechEscrow P2P Marketplace

## 🏗️ Tổng Quan Kiến Trúc

| Thành phần | Công nghệ | Trạng thái |
|---|---|---|
| Backend | Django 5.2 | ✅ Hoàn thành |
| Database | PostgreSQL (Supabase) | ✅ Hoàn thành |
| Frontend | HTML/TailwindCSS/Vanilla JS | ✅ Hoàn thành |
| Media Storage | Cloudinary | ✅ Hoàn thành |
| Smart Contract | Solidity (EscrowMarketplace) | ✅ Deployed |
| Web3 Integration | ethers.js v6 | ✅ Hoàn thành |
| Authentication | MetaMask (Web3 Auth) | ✅ Hoàn thành |

---

## 📂 Cấu Trúc Project

```
p2p_escrow_project/
├── core/              # Django project settings
│   ├── settings.py    # Cloudinary, DB, app config
│   ├── urls.py        # Root URL routing
│   └── wsgi.py
├── users/             # App xác thực (MetaMask Web3 Auth)
│   ├── models.py      # UserProfile (wallet_address, nonce)
│   ├── views.py       # get_nonce_api, verify_signature_api, profile
│   └── urls.py
├── marketplace/       # App marketplace (sản phẩm, giỏ hàng)
│   ├── models.py      # Product (CloudinaryField), Category, Cart
│   ├── views.py       # product_list, product_detail, sell_item, cart
│   └── urls.py
├── transactions/      # App giao dịch (escrow)
│   ├── models.py      # Transaction (status, tx_hash)
│   ├── views.py       # checkout, history, update_status API
│   └── urls.py
├── static/
│   ├── css/style.css
│   └── js/
│       ├── auth.js              # MetaMask login + getCsrfToken()
│       ├── web3_integration.js  # Smart contract interaction
│       └── main.js              # Checkout/confirm/cancel flows
├── templates/
│   ├── base.html                # Layout chung (nav, footer, scripts)
│   ├── users/
│   │   ├── login.html           # Trang đăng nhập MetaMask
│   │   └── profile.html         # Trang hồ sơ người dùng
│   ├── marketplace/
│   │   ├── product_list.html    # Trang chủ marketplace
│   │   ├── product_detail.html  # Chi tiết sản phẩm
│   │   ├── cart.html            # Giỏ hàng
│   │   └── sell_item.html       # Đăng bán sản phẩm
│   └── transactions/
│       ├── checkout.html        # Thanh toán escrow
│       └── history.html         # Lịch sử giao dịch (dashboard)
└── stitch/                      # Thiết kế UI gốc
    ├── nexus_ledger/DESIGN.md
    ├── marketplace_home/code.html
    ├── product_detail_checkout/code.html
    └── transaction_dashboard/code.html
```

---

## ✅ Danh Sách Công Việc

### Phase 1: Khung Sườn Backend
- [x] Tạo Django project + 3 apps (users, marketplace, transactions)
- [x] Cấu hình PostgreSQL (Supabase)
- [x] Cấu hình Cloudinary cho media storage
- [x] Tạo Models: UserProfile, Product, Category, Cart, CartItem, Transaction
- [x] Tạo Views + URLs cho tất cả các app
- [x] Cấu hình Admin panel

### Phase 2: Web3 Authentication (MetaMask Login)
- [x] Backend API: `get_nonce_api` — sinh nonce, lưu DB
- [x] Backend API: `verify_signature_api` — verify chữ ký, login session
- [x] Frontend: `auth.js` — loginWithMetaMask() + getCsrfToken()
- [x] Template: `login.html` — giao diện đăng nhập MetaMask

### Phase 3: Smart Contract Integration (Escrow)
- [x] Deploy smart contract `EscrowMarketplace` trên blockchain
- [x] Contract Address (v1): `0x8AC38019B23445CeDd3e499fAe519aAE81b81aec`
- [x] Contract Address (v2 — có phí sàn 3%): `0x35F481cE890d00b58AF788494beE2b81D7eE6E54`
- [x] Frontend: `web3_integration.js` — initContract, createEscrowTx, payEscrowTx, confirmEscrowTx, cancelEscrowTx
- [x] Frontend: `main.js` — initiateCheckout, confirmTransaction, cancelTransaction, payTransaction

### Phase 4: Frontend Templates (Stitch Design System)
- [x] `base.html` — Layout chung (TopNav, Footer, TailwindCSS config)
- [x] `product_list.html` — Trang chủ marketplace + sidebar categories
- [x] `product_detail.html` — Chi tiết sản phẩm + image gallery
- [x] `cart.html` — Giỏ hàng + order summary
- [x] `checkout.html` — Thanh toán escrow + web3 integration
- [x] `history.html` — Transaction dashboard + escrow stepper + blockchain actions
- [x] `login.html` — MetaMask login page
- [x] `profile.html` — User profile + transaction stats
- [x] `sell_item.html` — Đăng bán sản phẩm + Cloudinary upload

### Phase 5: Tích Hợp & Hoàn Thiện
- [x] Tích hợp Cloudinary cho Product image upload
- [x] Fix checkout.html dùng web3 flow thật (main.js)
- [x] Fix history.html dùng blockchain thật (web3_integration.js + main.js)
- [x] Chạy migrations (Phase 1-4)
- [x] Chuyển đổi hệ thống giá sang VND (hiển thị VND chính, ETH phụ via CoinGecko API)
- [x] Cập nhật form đăng bán nhập giá bằng VND
- [x] Cập nhật dữ liệu demo 10 sản phẩm sang giá VND thực tế
- [ ] Test toàn bộ luồng: Login → Browse → Checkout → Pay → Confirm
- [ ] Kiểm tra responsive design

### Phase 9: Quản lý sản phẩm, người dùng & duyệt sản phẩm
- [x] Product model thêm STATUS_CHOICES (AVAILABLE, PENDING_APPROVAL, HIDDEN, SOLD)
- [x] UserProfile model thêm is_locked field
- [x] User: Trang "Sản phẩm của tôi" (my_products) — xem tất cả SP đã đăng
- [x] User: Chức năng sửa thông tin sản phẩm (edit_product) — tất cả fields
- [x] User: Nút "Sửa sản phẩm" floating trên trang product detail (chỉ hiện cho seller/admin)
- [x] User: Status badge trên product detail (Pending/Hidden)
- [x] Flow đăng bán: User đăng → status = PENDING_APPROVAL → Admin duyệt → AVAILABLE
- [x] Admin đăng sản phẩm → tự động AVAILABLE (không cần duyệt)
- [x] Admin: Trang quản lý sản phẩm — filter theo status, thống kê counts
- [x] Admin: Duyệt sản phẩm (PENDING_APPROVAL → AVAILABLE)
- [x] Admin: Từ chối sản phẩm (PENDING_APPROVAL → HIDDEN)
- [x] Admin: Ẩn/Hiện sản phẩm (AVAILABLE ↔ HIDDEN)
- [x] Admin: Sửa thông tin bất kỳ sản phẩm nào
- [x] Admin: Trang quản lý người dùng — danh sách users + stats
- [x] Admin: Khóa/Mở khóa tài khoản user
- [x] Login flow: Check is_locked → hiện thông báo "Tài khoản đã bị khóa"
- [x] Admin Dashboard: Thêm cards quản lý sản phẩm + quản lý người dùng
- [x] Access control: HIDDEN products chỉ admin thấy, PENDING chỉ seller+admin thấy
- [x] Navbar: Thêm link "My Products" cho users
- [x] Tạo migrations (marketplace 0002 + users 0002)
- [ ] Chạy migrations

### Phase 6: Hệ thống Yêu cầu Trả hàng / Hoàn tiền (Refund via Admin)
- [x] Model `RefundRequest` (reason choices, evidence CloudinaryField x3, status Pending/Approved/Rejected)
- [x] Thêm status `Disputed` vào Transaction model
- [x] View `create_refund_request` — Buyer gửi yêu cầu trả hàng
- [x] View `admin_refund_list` — Admin xem danh sách yêu cầu (filter theo status)
- [x] View `admin_refund_detail` — Admin xem chi tiết yêu cầu + ảnh chứng minh
- [x] View `admin_resolve_refund` — Admin duyệt/từ chối → gọi `resolveDispute()` on-chain
- [x] Template `admin_refund_list.html` — Dashboard admin: stats cards, filter chips, danh sách yêu cầu
- [x] Template `admin_refund_detail.html` — Chi tiết: lý do, ảnh lightbox, thông tin GD, nút Approve/Reject
- [x] Template `history.html` — Modal "Yêu cầu trả hàng" (5 lý do + upload 3 ảnh), badge Disputed, stepper Disputed
- [x] JS `web3_integration.js` — Thêm `resolveDisputeTx(txId, favorBuyer)`
- [x] JS `main.js` — Thêm `submitRefundRequest()` + `adminResolveDispute()`
- [x] `base.html` — Thêm link Admin trong navbar cho staff users
- [x] `transactions/urls.py` — 4 URL patterns mới
- [x] `transactions/admin.py` — Đăng ký RefundRequest
- [x] Migration `0002_refundrequest_transaction_disputed.py`
- [x] Fix bug: Modal refund nằm ngoài block content
- [x] Fix bug: Disputes counter hardcoded = 0
- [ ] Chạy migration 0002 (cần kết nối Supabase)

### Phase 8: Admin Dashboard + Fix Refund Bug
- [x] Fix bug: Thêm `@csrf_exempt` vào `create_refund_request` và `admin_resolve_refund` (lỗi JSON.parse)
- [x] Tạo view `admin_dashboard` — thống kê phí sàn (VND + ETH), giao dịch, volume
- [x] Tạo template `admin_dashboard.html` — dashboard admin với fee cards, contract info, Etherscan links
- [x] Thêm URL `/transactions/admin/dashboard/`
- [x] Cập nhật navbar Admin → trỏ tới dashboard thay vì refund list
- [x] Cập nhật breadcrumb navigation: dashboard → refund list → refund detail
- [x] Tính năng đồng bộ phí sàn từ blockchain (nút đọc `feePercent()` on-chain)
- [x] Hiển thị recent completed transactions + link Etherscan cho mỗi tx hash

### Phase 7: Phí Sàn (Platform Fee 3%)
- [x] Deploy Smart Contract v2 có phí sàn (`0x35F481cE890d00b58AF788494beE2b81D7eE6E54`)
- [x] Cập nhật `web3_integration.js` — CONTRACT_ADDRESS + ABI mới (thêm `setFeePercent`, `feePercent`)
- [x] Thêm hàm JS `getFeePercent()` — đọc % phí sàn hiện tại từ contract
- [x] Thêm hàm JS `setFeePercentTx(newFee)` — admin thay đổi % phí sàn on-chain
- [x] Cập nhật `tien_do.md`

---

## 🔗 Thông Tin Smart Contract

- **Network:** Ethereum (hoặc testnet)
- **Contract Address (v2):** `0x35F481cE890d00b58AF788494beE2b81D7eE6E54`
- **Platform Fee:** 3% (admin có thể thay đổi, tối đa 20%)
- **Functions:**
  - `createTransaction(txId, seller, amount)` — Tạo giao dịch
  - `pay(txId)` — Thanh toán (gửi ETH vào escrow)
  - `confirm(txId)` — Xác nhận nhận hàng (trừ 3% phí sàn → admin, 97% → seller)
  - `cancel(txId)` — Hủy giao dịch (hoàn 100% tiền buyer, không trừ phí)
  - `resolveDispute(txId, favorBuyer)` — Admin giải quyết tranh chấp
  - `setFeePercent(newFee)` — Admin thay đổi % phí sàn (0–20%)
  - `feePercent()` — Đọc % phí sàn hiện tại

## ☁️ Cloudinary Config

- **Cloud Name:** `dddpqvxzg`
- **Storage:** `django-cloudinary-storage` (MediaCloudinaryStorage)
- **Product images** tự động upload lên Cloudinary khi seller đăng bán

---

## 📝 Ghi Chú

- Design System: "The Kinetic Ledger" — dark theme, Manrope + Inter fonts
- Không dùng username/password — chỉ MetaMask Web3 Auth
- Tất cả giao dịch đều qua Smart Contract Escrow
- Frontend dùng TailwindCSS CDN + Vanilla JS (không framework)
