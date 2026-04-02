import json
import uuid
from decimal import Decimal
from urllib import request as urllib_request

from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from eth_account.messages import encode_defunct
from eth_account import Account
from eth_utils import to_checksum_address
from django.conf import settings
from .models import UserProfile


def login_page(request):
    return render(request, 'users/login.html')


@csrf_exempt
@require_POST
def get_nonce_api(request):
    """
    POST endpoint that receives JSON {"wallet_address": "0x..."}.
    Normalizes the address to checksum format, finds or creates a
    UserProfile (and backing User), generates a new UUID nonce,
    and returns it as JSON.
    """
    try:
        body = json.loads(request.body)
        wallet_address = body.get('wallet_address', '')

        # Normalize to EIP-55 checksum address
        wallet_address = to_checksum_address(wallet_address)

        # Find or create the UserProfile (and User)
        try:
            profile = UserProfile.objects.get(wallet_address=wallet_address)
        except UserProfile.DoesNotExist:
            # Create a new Django User with the wallet address as the username
            user = User.objects.create_user(
                username=wallet_address,
                password=None,  # No password – authentication is via signature
            )
            profile = UserProfile.objects.create(
                user=user,
                wallet_address=wallet_address,
                nonce='',
            )

        # Generate a fresh nonce and persist it
        nonce = str(uuid.uuid4())
        profile.nonce = nonce
        profile.save()

        return JsonResponse({'nonce': nonce})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_POST
def verify_signature_api(request):
    """
    POST endpoint that receives JSON {"wallet_address": "0x...", "signature": "0x..."}.
    Recovers the signer from the stored nonce message and, if it matches the
    wallet address, logs the user in and returns a success response.
    The nonce is regenerated after a successful login to prevent replay attacks.
    """
    try:
        body = json.loads(request.body)
        wallet_address = body.get('wallet_address', '')
        signature = body.get('signature', '')

        # Normalize to checksum address
        wallet_address = to_checksum_address(wallet_address)

        # Look up the profile
        try:
            profile = UserProfile.objects.get(wallet_address=wallet_address)
        except UserProfile.DoesNotExist:
            return JsonResponse({'error': 'Wallet not found'}, status=404)

        # Reconstruct the message that was signed (the nonce stored in DB)
        message = encode_defunct(text=profile.nonce)

        # Recover the address that produced the signature
        recovered_address = Account.recover_message(message, signature=signature)

        # Compare addresses (both should already be checksum format)
        if recovered_address.lower() != wallet_address.lower():
            return JsonResponse({'error': 'Signature verification failed'}, status=401)

        # Check if account is locked
        if profile.is_locked:
            return JsonResponse({
                'error': 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.',
            }, status=403)

        # Signature is valid – log the user in
        login(request, profile.user)

        # Regenerate nonce to prevent replay attacks
        profile.nonce = str(uuid.uuid4())
        profile.save()

        return JsonResponse({
            'success': True,
            'message': 'Login successful',
            'is_staff': profile.user.is_staff,
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def logout_view(request):
    """Log the user out and redirect to the login page."""
    logout(request)
    return redirect('users:login')


@login_required
def profile_page(request):
    """
    Render the user profile page with the user's profile data
    and their transactions (as both buyer and seller).
    """
    profile = UserProfile.objects.get(user=request.user)

    # Import here to avoid circular imports
    from transactions.models import Transaction

    # Transactions where the user is the buyer or the seller
    transactions = Transaction.objects.filter(
        buyer=request.user
    ) | Transaction.objects.filter(
        seller=request.user
    )
    transactions = transactions.order_by('-created_at')

    context = {
        'profile': profile,
        'transactions': transactions,
    }
    return render(request, 'users/profile.html', context)


@login_required
def wallet_balance_api(request):
    """
    Read the logged-in user's wallet balance from the configured RPC node.
    This works in production without requiring MetaMask in the browser.
    """
    rpc_url = getattr(settings, 'ETH_RPC_URL', '')
    if not rpc_url:
        return JsonResponse({
            'success': False,
            'error': 'ETH_RPC_URL chưa được cấu hình trên server.',
        }, status=503)

    try:
        profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Người dùng chưa liên kết ví.',
        }, status=404)

    try:
        payload = json.dumps({
            'jsonrpc': '2.0',
            'method': 'eth_getBalance',
            'params': [profile.wallet_address, 'latest'],
            'id': 1,
        }).encode('utf-8')

        req = urllib_request.Request(
            rpc_url,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )

        with urllib_request.urlopen(req, timeout=10) as response:
            body = json.loads(response.read().decode('utf-8'))

        if body.get('error'):
            raise ValueError(body['error'].get('message', 'RPC error'))

        wei_hex = body.get('result', '0x0')
        wei_int = int(wei_hex, 16)
        eth_balance = Decimal(wei_int) / Decimal('1000000000000000000')

        return JsonResponse({
            'success': True,
            'wallet_address': profile.wallet_address,
            'eth_balance': format(eth_balance.quantize(Decimal('0.00000001')), 'f'),
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Không đọc được số dư ví: {e}',
        }, status=502)


# ═══════════════════════════════════════════════════════════════════════
# Admin: User Management
# ═══════════════════════════════════════════════════════════════════════

@staff_member_required
def admin_user_list(request):
    """Admin page: list all users with product/transaction counts, lock/unlock."""
    from marketplace.models import Product
    from transactions.models import Transaction
    from django.db.models import Q

    profiles = UserProfile.objects.select_related('user').order_by('-user__date_joined')

    user_data = []
    for profile in profiles:
        product_count = Product.objects.filter(seller=profile.user).count()
        tx_count = Transaction.objects.filter(
            Q(buyer=profile.user) | Q(seller=profile.user)
        ).count()
        user_data.append({
            'profile': profile,
            'product_count': product_count,
            'tx_count': tx_count,
        })

    context = {
        'user_data': user_data,
    }
    return render(request, 'users/admin_user_list.html', context)


@staff_member_required
@require_POST
def admin_toggle_lock(request, user_id):
    """Admin toggles lock status of a user account."""
    profile = get_object_or_404(UserProfile, user_id=user_id)
    profile.is_locked = not profile.is_locked
    profile.save()
    return redirect('users:admin_user_list')
