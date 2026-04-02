function initGlobalSearchAutocomplete() {
    var shell = document.getElementById('global-search-shell');
    var input = document.getElementById('global-search-input');
    var panel = document.getElementById('global-search-suggestions');

    if (!shell || !input || !panel) return;

    var debounceTimer = null;
    var activeIndex = -1;
    var currentSuggestions = [];

    function formatPrice(price) {
        var amount = parseFloat(price);
        if (isNaN(amount)) return '';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    }

    function hidePanel() {
        panel.classList.add('hidden');
        panel.innerHTML = '';
        activeIndex = -1;
        currentSuggestions = [];
    }

    function renderSuggestions(items, query) {
        currentSuggestions = items || [];
        activeIndex = -1;

        if (!currentSuggestions.length) {
            panel.innerHTML = '<div class="px-4 py-4 text-xs text-on-surface-variant font-body">Không thấy sản phẩm phù hợp. Thử gõ tên gần đúng hoặc từ khóa ngắn hơn.</div>';
            panel.classList.remove('hidden');
            return;
        }

        panel.innerHTML = currentSuggestions.map(function(item, index) {
            var imageHtml = item.image_url
                ? '<img src="' + item.image_url + '" alt="" class="w-full h-full object-cover" />'
                : '<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-outline/30 text-xl">inventory_2</span></div>';

            return '' +
                '<a href="' + item.url + '" class="search-suggestion-item" data-index="' + index + '">' +
                    '<div class="search-thumb">' + imageHtml + '</div>' +
                    '<div class="min-w-0 flex-1">' +
                        '<div class="text-sm font-headline font-bold text-on-surface truncate">' + item.name + '</div>' +
                        '<div class="text-[11px] text-on-surface-variant font-body truncate">' +
                            (item.category || 'Danh mục khác') + ' · ' + item.condition +
                        '</div>' +
                    '</div>' +
                    '<div class="text-right flex-shrink-0">' +
                        '<div class="text-xs font-headline font-extrabold text-primary">' + formatPrice(item.price) + '</div>' +
                    '</div>' +
                '</a>';
        }).join('');

        panel.classList.remove('hidden');
    }

    function highlightActiveItem() {
        var items = panel.querySelectorAll('.search-suggestion-item');
        items.forEach(function(item) {
            item.classList.remove('is-active');
        });

        if (activeIndex >= 0 && items[activeIndex]) {
            items[activeIndex].classList.add('is-active');
        }
    }

    function fetchSuggestions(query) {
        fetch('/marketplace/api/search-suggestions/?q=' + encodeURIComponent(query))
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (!data.success) {
                    hidePanel();
                    return;
                }
                renderSuggestions(data.suggestions || [], query);
            })
            .catch(function(error) {
                console.warn('search suggestions error:', error);
                hidePanel();
            });
    }

    input.addEventListener('input', function() {
        var query = input.value.trim();

        clearTimeout(debounceTimer);

        if (query.length < 2) {
            hidePanel();
            return;
        }

        debounceTimer = setTimeout(function() {
            fetchSuggestions(query);
        }, 180);
    });

    input.addEventListener('keydown', function(event) {
        if (panel.classList.contains('hidden') || !currentSuggestions.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            activeIndex = Math.min(activeIndex + 1, currentSuggestions.length - 1);
            highlightActiveItem();
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            highlightActiveItem();
            return;
        }

        if (event.key === 'Enter' && activeIndex >= 0 && currentSuggestions[activeIndex]) {
            event.preventDefault();
            window.location.href = currentSuggestions[activeIndex].url;
        }

        if (event.key === 'Escape') {
            hidePanel();
        }
    });

    document.addEventListener('click', function(event) {
        if (!shell.contains(event.target)) {
            hidePanel();
        }
    });
}

initGlobalSearchAutocomplete();
