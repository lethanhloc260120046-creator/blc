import json
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db.models import Sum
from .models import Transaction, RefundRequest
from marketplace.models import Product
from users.models import UserProfile
from django.contrib.auth.models import User

CONTRACT_ADDRESS = '0x35F481cE890d00b58AF788494beE2b81D7eE6E54'
ETHERSCAN_BASE_URL = 'https://sepolia.etherscan.io'


@login_required
def checkout(request, product_id):
    """
    GET:  Show checkout page with product info, seller wallet, and buyer wallet.
    POST: Create a Transaction record, mark the product as SOLD, return JSON with the transaction id.
    """
    product = get_object_or_404(Product, pk=product_id)

    # Retrieve wallet addresses for seller and buyer
    seller_wallet = None
    try:
        seller_profile = UserProfile.objects.get(user=product.seller)
        seller_wallet = seller_profile.wallet_address
    except UserProfile.DoesNotExist:
        seller_wallet = None

    buyer_wallet = None
    try:
        buyer_profile = UserProfile.objects.get(user=request.user)
        buyer_wallet = buyer_profile.wallet_address
    except UserProfile.DoesNotExist:
        buyer_wallet = None

    if request.method == 'POST':
        # Create the Transaction record
        transaction = Transaction.objects.create(
            buyer=request.user,
            seller=product.seller,
            product=product,
            amount=product.price,
            status='Created',
        )

        # Mark the product as SOLD
        product.status = 'SOLD'
        product.save()

        return JsonResponse({
            'success': True,
            'transaction_id': transaction.id,
        })

    # GET request – render the checkout page
    context = {
        'product': product,
        'seller_wallet': seller_wallet,
        'buyer_wallet': buyer_wallet,
    }
    return render(request, 'transactions/checkout.html', context)


@login_required
def transaction_history(request):
    """
    Show all transactions where the logged-in user is the buyer OR the seller.
    Passes separate querysets for buyer and seller transactions.
    """
    as_buyer = Transaction.objects.filter(buyer=request.user).select_related('product', 'seller')
    as_seller = Transaction.objects.filter(seller=request.user).select_related('product', 'buyer')

    context = {
        'as_buyer': as_buyer,
        'as_seller': as_seller,
    }
    return render(request, 'transactions/history.html', context)


@csrf_exempt
@require_POST
def update_transaction_status(request):
    """
    Receives JSON body: {"transaction_id": id, "status": new_status, "tx_hash": optional_hash}
    Updates the transaction status and optionally the smart_contract_tx_hash.
    Returns JSON success or error response.
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)

    transaction_id = data.get('transaction_id')
    new_status = data.get('status')
    tx_hash = data.get('tx_hash')

    if not transaction_id or not new_status:
        return JsonResponse({'success': False, 'error': 'Missing transaction_id or status.'}, status=400)

    valid_statuses = [choice[0] for choice in Transaction.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return JsonResponse({'success': False, 'error': f'Invalid status. Must be one of: {valid_statuses}'}, status=400)

    try:
        transaction = Transaction.objects.get(pk=transaction_id)
    except Transaction.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Transaction not found.'}, status=404)

    transaction.status = new_status
    if tx_hash:
        transaction.smart_contract_tx_hash = tx_hash
    transaction.save()

    return JsonResponse({
        'success': True,
        'transaction_id': transaction.id,
        'status': transaction.status,
    })


@csrf_exempt
@require_POST
def create_refund_request(request):
    """
    Buyer submits a refund/return request for a Funded transaction.
    Accepts multipart form data (images + fields).
    Creates RefundRequest and updates Transaction status to 'Disputed'.
    Always returns JSON — never redirects to HTML.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Bạn cần đăng nhập để thực hiện thao tác này.'}, status=401)

    try:
        transaction_id = request.POST.get('transaction_id')
        reason = request.POST.get('reason', '')
        reason_detail = request.POST.get('reason_detail', '')

        if not transaction_id or not reason:
            return JsonResponse({'success': False, 'error': 'Thiếu thông tin bắt buộc.'}, status=400)

        try:
            transaction = Transaction.objects.get(pk=transaction_id, buyer=request.user)
        except Transaction.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Giao dịch không tồn tại.'}, status=404)

        if transaction.status != 'Funded':
            return JsonResponse({'success': False, 'error': 'Chỉ có thể yêu cầu trả hàng khi đã thanh toán (Funded).'}, status=400)

        if transaction.refund_requests.filter(status='Pending').exists():
            return JsonResponse({'success': False, 'error': 'Bạn đã gửi yêu cầu trả hàng rồi. Vui lòng chờ Admin duyệt.'}, status=400)

        refund = RefundRequest(
            transaction=transaction,
            reason=reason,
            reason_detail=reason_detail,
        )

        if request.FILES.get('evidence_image_1'):
            refund.evidence_image_1 = request.FILES['evidence_image_1']
        if request.FILES.get('evidence_image_2'):
            refund.evidence_image_2 = request.FILES['evidence_image_2']
        if request.FILES.get('evidence_image_3'):
            refund.evidence_image_3 = request.FILES['evidence_image_3']

        refund.save()

        transaction.status = 'Disputed'
        transaction.save()

        return JsonResponse({
            'success': True,
            'message': 'Yêu cầu trả hàng đã được gửi. Vui lòng chờ Admin duyệt.',
            'refund_id': refund.id,
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@staff_member_required
def admin_dashboard(request):
    """
    Admin dashboard: platform fee stats, contract info, quick links.
    """
    completed_txs = Transaction.objects.filter(status='Completed')
    completed_count = completed_txs.count()
    completed_volume = completed_txs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    fee_percent = Decimal('3')
    total_fees_vnd = completed_volume * fee_percent / Decimal('100')

    all_txs = Transaction.objects.all()
    total_count = all_txs.count()
    funded_count = all_txs.filter(status='Funded').count()
    disputed_count = all_txs.filter(status='Disputed').count()
    cancelled_count = all_txs.filter(status='Cancelled').count()
    total_volume = all_txs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    pending_refunds = RefundRequest.objects.filter(status='Pending').count()
    pending_products = Product.objects.filter(status='PENDING_APPROVAL').count()
    total_users = User.objects.count()

    recent_completed = completed_txs.select_related(
        'product', 'buyer', 'seller'
    ).order_by('-updated_at')[:10]

    context = {
        'completed_count': completed_count,
        'completed_volume': completed_volume,
        'fee_percent': fee_percent,
        'total_fees_vnd': total_fees_vnd,
        'total_count': total_count,
        'funded_count': funded_count,
        'disputed_count': disputed_count,
        'cancelled_count': cancelled_count,
        'total_volume': total_volume,
        'pending_refunds': pending_refunds,
        'pending_products': pending_products,
        'total_users': total_users,
        'recent_completed': recent_completed,
        'contract_address': CONTRACT_ADDRESS,
        'etherscan_base_url': ETHERSCAN_BASE_URL,
        'etherscan_url': f'{ETHERSCAN_BASE_URL}/address/{CONTRACT_ADDRESS}',
    }
    return render(request, 'transactions/admin_dashboard.html', context)


@staff_member_required
def admin_refund_list(request):
    """
    Admin page: list all refund requests, filterable by status.
    """
    status_filter = request.GET.get('status', 'all')

    refunds = RefundRequest.objects.select_related(
        'transaction', 'transaction__buyer', 'transaction__seller', 'transaction__product'
    ).order_by('-created_at')

    if status_filter != 'all':
        refunds = refunds.filter(status=status_filter)

    counts = {
        'all': RefundRequest.objects.count(),
        'pending': RefundRequest.objects.filter(status='Pending').count(),
        'approved': RefundRequest.objects.filter(status='Approved').count(),
        'rejected': RefundRequest.objects.filter(status='Rejected').count(),
    }

    context = {
        'refunds': refunds,
        'status_filter': status_filter,
        'counts': counts,
    }
    return render(request, 'transactions/admin_refund_list.html', context)


@staff_member_required
def admin_refund_detail(request, refund_id):
    """
    Admin page: view full details of a refund request.
    """
    refund = get_object_or_404(
        RefundRequest.objects.select_related(
            'transaction', 'transaction__buyer', 'transaction__seller', 'transaction__product'
        ),
        pk=refund_id
    )

    buyer_wallet = ''
    try:
        buyer_wallet = UserProfile.objects.get(user=refund.transaction.buyer).wallet_address
    except UserProfile.DoesNotExist:
        pass

    seller_wallet = ''
    try:
        seller_wallet = UserProfile.objects.get(user=refund.transaction.seller).wallet_address
    except UserProfile.DoesNotExist:
        pass

    context = {
        'refund': refund,
        'tx': refund.transaction,
        'buyer_wallet': buyer_wallet,
        'seller_wallet': seller_wallet,
        'evidence_urls': refund.get_evidence_urls(),
    }
    return render(request, 'transactions/admin_refund_detail.html', context)


@csrf_exempt
@require_POST
def admin_resolve_refund(request):
    """
    Admin resolves a refund request after calling resolveDispute on-chain.
    Receives JSON: {"refund_id": id, "action": "approve"|"reject", "admin_note": "...", "tx_hash": "..."}
    Always returns JSON — never redirects to HTML.
    """
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'success': False, 'error': 'Bạn không có quyền thực hiện thao tác này.'}, status=403)

    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)

        refund_id = data.get('refund_id')
        action = data.get('action')  # 'approve' or 'reject'
        admin_note = data.get('admin_note', '')
        tx_hash = data.get('tx_hash', '')

        if not refund_id or action not in ('approve', 'reject'):
            return JsonResponse({'success': False, 'error': 'Missing refund_id or invalid action.'}, status=400)

        try:
            refund = RefundRequest.objects.select_related('transaction').get(pk=refund_id)
        except RefundRequest.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Refund request not found.'}, status=404)

        if refund.status != 'Pending':
            return JsonResponse({'success': False, 'error': 'Yêu cầu này đã được xử lý rồi.'}, status=400)

        refund.admin_note = admin_note

        if action == 'approve':
            refund.status = 'Approved'
            refund.transaction.status = 'Cancelled'
        else:
            refund.status = 'Rejected'
            refund.transaction.status = 'Completed'

        if tx_hash:
            refund.transaction.smart_contract_tx_hash = tx_hash

        refund.save()
        refund.transaction.save()

        return JsonResponse({
            'success': True,
            'message': 'Đã duyệt thành công.' if action == 'approve' else 'Đã từ chối yêu cầu.',
            'refund_status': refund.status,
            'transaction_status': refund.transaction.status,
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
