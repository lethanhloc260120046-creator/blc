# User 1 - Luồng đăng nhập bằng MetaMask

## Mục tiêu cần học
- Người dùng đăng nhập bằng ví MetaMask như thế nào
- Backend xác thực chữ ký ra sao
- Sau khi đăng nhập thì hệ thống lưu session như thế nào

## File chính cần học
- [users/views.py](./users/views.py)
- [static/js/auth.js](./static/js/auth.js)
- [static/js/main.js](./static/js/main.js)

## Hàm chính cần học
- [users/views.py] `login_page(request)`: hiển thị trang đăng nhập.
- [users/views.py] `get_nonce_api(request)`: cấp nonce để ký xác thực.
- [users/views.py] `verify_signature_api(request)`: kiểm tra chữ ký MetaMask và tạo phiên đăng nhập.
- [users/views.py] `logout_view(request)`: đăng xuất người dùng.
- [static/js/auth.js] `loginWithMetaMask()`: kết nối MetaMask, lấy nonce, ký message và gửi lên backend để đăng nhập.

## Khi báo cáo nên nói
- Hệ thống không đăng nhập bằng mật khẩu truyền thống.
- Người dùng ký một message bằng MetaMask để xác thực quyền sở hữu ví.
- Backend dùng nonce để tránh giả mạo đăng nhập lại bằng chữ ký cũ.

