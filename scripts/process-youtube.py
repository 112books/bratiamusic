import xml.etree.ElementTree as ET
import json
import re
import sys
import os

feed_file = sys.argv[1]
out_file  = sys.argv[2]

# Validar que el fitxer conté XML vàlid
with open(feed_file, 'r', encoding='utf-8') as f:
    content = f.read()

if content.strip().startswith('<!DOCTYPE html') or content.strip().startswith('<html'):
    print("ERROR: YouTube ha retornat HTML en lloc de XML RSS", file=sys.stderr)
    print(f"Primers 200 chars: {content[:200]}", file=sys.stderr)
    sys.exit(1)

tree = ET.parse(feed_file)
root = tree.getroot()
ns = {
    'atom':  'http://www.w3.org/2005/Atom',
    'yt':    'http://www.youtube.com/xml/schemas/2015',
    'media': 'http://search.yahoo.com/mrss/',
}

# Carrega vídeos existents per preservar l'historial
existing = {}
if os.path.exists(out_file):
    try:
        with open(out_file, 'r', encoding='utf-8') as f:
            for v in json.load(f):
                existing[v['id']] = v
    except Exception:
        pass

new_videos = []
for entry in root.findall('atom:entry', ns):
    title    = entry.find('atom:title', ns).text or ''
    video_id = entry.find('yt:videoId', ns).text or ''
    published = entry.find('atom:published', ns).text or ''
    desc_el  = entry.find('.//media:description', ns)
    desc     = (desc_el.text or '') if desc_el is not None else ''

    if re.search(r'#[Ss]horts?', title + desc):
        continue
    link = entry.find('atom:link', ns)
    url  = link.get('href', '') if link is not None else ''
    if '/shorts/' in url:
        continue

    thumb_el = entry.find('.//media:thumbnail', ns)
    thumb    = thumb_el.get('url', '') if thumb_el is not None else ''

    new_videos.append({
        'id':        video_id,
        'title':     title,
        'published': published[:10],
        'thumb':     thumb,
        'url':       f'https://www.youtube.com/watch?v={video_id}',
        'embed':     f'https://www.youtube.com/embed/{video_id}?rel=0&modestbranding=1',
    })

# Fusiona: prioritza dades noves, manté els vídeos antics que no surten al feed
merged = {v['id']: v for v in new_videos}
for vid_id, v in existing.items():
    if vid_id not in merged:
        merged[vid_id] = v

# Ordena per data de publicació descendent
videos = sorted(merged.values(), key=lambda v: v['published'], reverse=True)

with open(out_file, 'w', encoding='utf-8') as f:
    json.dump(videos, f, ensure_ascii=False, indent=2)

print(f"Vídeos guardats: {len(videos)} ({len(new_videos)} nous del feed, {len(existing)} existents)")
