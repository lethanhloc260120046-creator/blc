# User 2 - Luồng tạo sản phẩm để đăng bán

## Mục tiêu cần học
- Người bán tạo sản phẩm ở đâu
- Dữ liệu sản phẩm được lưu và sửa như thế nào
- Trang nào hiển thị sản phẩm cho người bán quản lý
- Trang chi tiết sản phẩm là điểm bắt đầu để người mua đi sang luồng blockchain checkout
- Phần này cũng có cầu nối sang blockchain để người mua bắt đầu thanh toán escrow từ trang chi tiết sản phẩm

## File chính cần học
- [marketplace/views.py](./marketplace/views.py)
- [templates/marketplace/sell_item.html](./templates/marketplace/sell_item.html)
- [templates/marketplace/edit_product.html](./templates/marketplace/edit_product.html)
- [templates/marketplace/product_detail.html](./templates/marketplace/product_detail.html)
- [static/js/main.js](./static/js/main.js)

## Hàm chính cần học
- [marketplace/views.py] `sell_item(request)`: mở form đăng sản phẩm.
- [marketplace/views.py] `create_product(request)`: nhận dữ liệu và tạo sản phẩm mới.
- [marketplace/views.py] `edit_product(request, product_id)`: mở form sửa sản phẩm.
- [marketplace/views.py] `update_product(request, product_id)`: lưu thay đổi của sản phẩm.
- [marketplace/views.py] `my_products(request)`: xem danh sách sản phẩm của chính mình.
- [marketplace/views.py] `product_detail(request, product_id)`: hiển thị chi tiết sản phẩm, seller wallet và nút sang checkout blockchain.
- [static/js/main.js] `initiateCheckout(productId, sellerWallet, priceInVnd, shippingData)`: bắt đầu checkout escrow từ trang chi tiết sản phẩm.

## Khi báo cáo nên nói
- Người bán nhập thông tin sản phẩm qua form.
- Sau khi lưu, sản phẩm sẽ xuất hiện trong hệ thống để chờ duyệt hoặc hiển thị.
- Trang chi tiết sản phẩm là nơi người mua xem thông tin và bấm sang checkout bằng smart contract escrow.
- Từ trang này, người mua bắt đầu bước giao dịch blockchain đầu tiên trước khi sang phần thanh toán và xác nhận.
- Đây là phần dữ liệu nền tảng để luồng mua bán và blockchain hoạt động tiếp theo.

