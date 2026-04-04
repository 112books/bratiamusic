import json, sys, re
from datetime import datetime, timezone

raw_file, out_file, start, end = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

with open(raw_file) as f:
    data = json.load(f)

# DEBUG temporal — esborra després de confirmar els camps
for key in ['browsers', 'systems', 'sizes', 'locations']:
    items = data.get(key, {}).get('stats', [])
    if items:
        print(f"DEBUG {key} keys:", list(items[0].keys()))

# raw_file conté tot el JSON amb hits + stats secundàries
hits = data.get('hits_data', {}).get('hits', [])
sections = ['about', 'the-band', 'music', 'concerts', 'videos', 'photos', 'contact']
langs = ['ca', 'es', 'en']

def normalize(path):
    return re.sub(r'^/bratiamusic', '', path).strip('/')

by_section = {s: 0 for s in sections}
by_lang = {l: 0 for l in langs}
total = 0

for h in hits:
    path = normalize(h.get('path', ''))
    count = h.get('count', 0)
    total += count
    parts = [p for p in path.split('/') if p]
    lang = parts[0] if parts else ''
    section = parts[1] if len(parts) > 1 else ''
    if lang in langs:
        by_lang[lang] += count
    if section in sections:
        by_section[section] += count

def parse_stats(key):
    return [{'id': s['id'], 'name': s.get('name') or s['id'], 'count': s['count']}
            for s in data.get(key, {}).get('stats', [])]

size_names = {
    'phone': 'Mòbil',
    'tablet': 'Tauleta',
    'desktop': 'Escriptori',
    'desktophd': 'Escriptori HD',
    'larger': 'Pantalla gran'
}

sizes_raw = parse_stats('sizes')
sizes = [{'id': s['id'], 'name': size_names.get(s['id'], s['id']), 'count': s['count']} for s in sizes_raw]

result = {
    "generated": datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    "period": {"start": start, "end": end},
    "total": total,
    "by_lang": by_lang,
    "by_section": by_section,
    "browsers": parse_stats('browsers'),
    "systems": parse_stats('systems'),
    "sizes": sizes,
    "locations": parse_stats('locations')
}

with open(out_file, 'w') as f:
    json.dump(result, f, indent=2)

print('Analytics processades:', result)