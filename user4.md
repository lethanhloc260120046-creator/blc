# User 4 - Luồng admin blockchain

## Mục tiêu cần học
- Admin theo dõi hệ thống ở đâu
- Cách chia phí sàn hoạt động thế nào
- Cách admin giải quyết tranh chấp và trả hàng hoàn tiền

## File chính cần học
- [transactions/views.py](./transactions/views.py)
- [static/js/main.js](./static/js/main.js)
- [static/js/web3_integration.js](./static/js/web3_integration.js)
- [templates/transactions/admin_dashboard.html](./templates/transactions/admin_dashboard.html)
- [templates/transactions/admin_refund_list.html](./templates/transactions/admin_refund_list.html)
- [templates/transactions/admin_refund_detail.html](./templates/transactions/admin_refund_detail.html)

## Hàm chính cần học
- [transactions/views.py] `admin_dashboard(request)`: trang dashboard tổng quan của admin.
- [transactions/views.py] `admin_refund_list(request)`: danh sách yêu cầu trả hàng/hoàn tiền.
- [transactions/views.py] `admin_refund_detail(request, refund_id)`: chi tiết một yêu cầu tranh chấp.
- [transactions/views.py] `admin_resolve_refund(request)`: cập nhật DB sau khi admin xử lý xong.
- [static/js/main.js] `adminResolveDispute(refundId, txId, favorBuyer, adminNote)`: gọi từ frontend để admin xử lý tranh chấp.
- [static/js/web3_integration.js] `resolveDisputeTx(txId, favorBuyer)`: gọi smart ontract để phân xử tranh chấp.
- [static/js/web3_integration.js] `getFeePercent()`: đọc phí sàn hiện tại trên blocckchain.
- [static/js/web3_integration.js] `setFeePercentTx(newFee)`: cập nhật phí sàn trên blockchain.

## Khi báo cáo nên nói
- Admin không chỉ quản lý dữ liệu mà còn tham gia xử lý phần blockchain quan trọng.
- Hai nhiệm vụ chính là chia phí sàn và xử lý tranh chấp.
- Mọi thay đổi quan trọng đều được đồng bộ giữa smart contract và database để tránh lệch trạng thái.

