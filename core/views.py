import requests as http_requests
from django.http import JsonResponse

PROVINCES_API = 'https://provinces.open-api.vn/api'


def api_provinces(request):
    """Proxy: list all Vietnam provinces/cities."""
    try:
        resp = http_requests.get(f'{PROVINCES_API}/', params={'depth': 1}, timeout=10)
        return JsonResponse(resp.json(), safe=False)
    except Exception:
        return JsonResponse([], safe=False)


def api_districts(request, province_code):
    """Proxy: list districts of a province."""
    try:
        resp = http_requests.get(f'{PROVINCES_API}/p/{province_code}', params={'depth': 2}, timeout=10)
        data = resp.json()
        return JsonResponse({'districts': data.get('districts', [])})
    except Exception:
        return JsonResponse({'districts': []})


def api_wards(request, district_code):
    """Proxy: list wards of a district."""
    try:
        resp = http_requests.get(f'{PROVINCES_API}/d/{district_code}', params={'depth': 2}, timeout=10)
        data = resp.json()
        return JsonResponse({'wards': data.get('wards', [])})
    except Exception:
        return JsonResponse({'wards': []})
