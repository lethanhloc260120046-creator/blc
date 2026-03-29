from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_POST
from django.http import Http404
from django.db.models import Q
from .models import Product, Category, Cart, CartItem
from users.models import UserProfile


def product_list(request):
    """Display all AVAILABLE products with optional category filtering and search."""
    products = Product.objects.filter(status='AVAILABLE')
    categories = Category.objects.all()

    category_slug = request.GET.get('category')
    if category_slug:
        products = products.filter(category__slug=category_slug)

    query = request.GET.get('q')
    if query:
        products = products.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )

    context = {
        'products': products,
        'categories': categories,
    }
    return render(request, 'marketplace/product_list.html', context)


def product_detail(request, product_id):
    """Display a single product's detail along with the seller's wallet address."""
    product = get_object_or_404(Product, pk=product_id)

    is_owner = request.user.is_authenticated and request.user == product.seller
    is_admin = request.user.is_authenticated and request.user.is_staff

    if product.status == 'HIDDEN' and not is_admin:
        raise Http404
    if product.status == 'PENDING_APPROVAL' and not (is_owner or is_admin):
        raise Http404

    can_edit = is_owner or is_admin

    seller_wallet = None
    try:
        seller_profile = UserProfile.objects.get(user=product.seller)
        seller_wallet = seller_profile.wallet_address
    except UserProfile.DoesNotExist:
        seller_wallet = None

    context = {
        'product': product,
        'seller_wallet': seller_wallet,
        'can_edit': can_edit,
        'is_owner': is_owner,
    }
    return render(request, 'marketplace/product_detail.html', context)


@login_required
@require_POST
def add_to_cart(request, product_id):
    """Add a product to the logged-in user's cart."""
    product = get_object_or_404(Product, pk=product_id)
    cart, created = Cart.objects.get_or_create(user=request.user)
    CartItem.objects.get_or_create(cart=cart, product=product)
    return redirect('marketplace:cart')


@login_required
@require_POST
def remove_from_cart(request, item_id):
    """Remove a CartItem from the logged-in user's cart."""
    cart_item = get_object_or_404(CartItem, pk=item_id, cart__user=request.user)
    cart_item.delete()
    return redirect('marketplace:cart')


@login_required
def cart_view(request):
    """Display the logged-in user's cart items."""
    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_items = CartItem.objects.filter(cart=cart).select_related('product')

    context = {
        'cart_items': cart_items,
    }
    return render(request, 'marketplace/cart.html', context)


@login_required
def sell_item(request):
    """Allow a logged-in user to list a new product for sale."""
    categories = Category.objects.all()

    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description', '')
        price = request.POST.get('price')
        condition = request.POST.get('condition')
        category_id = request.POST.get('category')
        image_url = request.POST.get('image_url', '')
        image = request.FILES.get('image')

        category = None
        if category_id:
            try:
                category = Category.objects.get(pk=category_id)
            except Category.DoesNotExist:
                category = None

        status = 'AVAILABLE' if request.user.is_staff else 'PENDING_APPROVAL'

        product = Product(
            seller=request.user,
            category=category,
            name=name,
            description=description,
            price=price,
            condition=condition,
            image_url=image_url,
            status=status,
        )
        if image:
            product.image = image
        product.save()
        return redirect('marketplace:product_detail', product_id=product.id)

    context = {
        'categories': categories,
    }
    return render(request, 'marketplace/sell_item.html', context)


@login_required
def edit_product(request, product_id):
    """Allow the seller (or admin) to edit an existing product's info."""
    product = get_object_or_404(Product, pk=product_id)

    if request.user != product.seller and not request.user.is_staff:
        return redirect('marketplace:product_detail', product_id=product.id)

    categories = Category.objects.all()

    if request.method == 'POST':
        product.name = request.POST.get('name', product.name)
        product.description = request.POST.get('description', '')
        product.price = request.POST.get('price', product.price)
        product.condition = request.POST.get('condition', product.condition)

        category_id = request.POST.get('category')
        if category_id:
            try:
                product.category = Category.objects.get(pk=category_id)
            except Category.DoesNotExist:
                pass
        else:
            product.category = None

        image = request.FILES.get('image')
        if image:
            product.image = image

        image_url = request.POST.get('image_url', '')
        if image_url:
            product.image_url = image_url

        product.save()
        return redirect('marketplace:product_detail', product_id=product.id)

    context = {
        'product': product,
        'categories': categories,
    }
    return render(request, 'marketplace/edit_product.html', context)


@login_required
def my_products(request):
    """Display the logged-in user's own products (all statuses)."""
    products = Product.objects.filter(seller=request.user).order_by('-created_at')
    context = {
        'products': products,
    }
    return render(request, 'marketplace/my_products.html', context)


# ═══════════════════════════════════════════════════════════════════════
# Admin: Product Management
# ═══════════════════════════════════════════════════════════════════════

@staff_member_required
def admin_product_list(request):
    """Admin page: list all products with status filtering, approve/hide actions."""
    status_filter = request.GET.get('status', 'all')
    products = Product.objects.select_related('seller', 'category').order_by('-created_at')

    if status_filter != 'all':
        products = products.filter(status=status_filter)

    counts = {
        'all': Product.objects.count(),
        'PENDING_APPROVAL': Product.objects.filter(status='PENDING_APPROVAL').count(),
        'AVAILABLE': Product.objects.filter(status='AVAILABLE').count(),
        'HIDDEN': Product.objects.filter(status='HIDDEN').count(),
        'SOLD': Product.objects.filter(status='SOLD').count(),
    }

    context = {
        'products': products,
        'status_filter': status_filter,
        'counts': counts,
    }
    return render(request, 'marketplace/admin_product_list.html', context)


@staff_member_required
@require_POST
def admin_product_approve(request, product_id):
    """Admin approves a PENDING_APPROVAL product → AVAILABLE."""
    product = get_object_or_404(Product, pk=product_id)
    product.status = 'AVAILABLE'
    product.save()
    return redirect('marketplace:admin_product_list')


@staff_member_required
@require_POST
def admin_product_reject(request, product_id):
    """Admin rejects a PENDING_APPROVAL product → HIDDEN."""
    product = get_object_or_404(Product, pk=product_id)
    product.status = 'HIDDEN'
    product.save()
    return redirect('marketplace:admin_product_list')


@staff_member_required
@require_POST
def admin_product_toggle_hide(request, product_id):
    """Admin toggles a product between AVAILABLE ↔ HIDDEN."""
    product = get_object_or_404(Product, pk=product_id)
    if product.status == 'HIDDEN':
        product.status = 'AVAILABLE'
    elif product.status == 'AVAILABLE':
        product.status = 'HIDDEN'
    product.save()
    return redirect('marketplace:admin_product_list')
