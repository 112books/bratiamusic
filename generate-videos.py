#!/usr/bin/env python3
"""
Executa aquest script localment per generar static/data/videos.json inicial.
Després el GitHub Action ho farà automàticament cada nit.

Ús: python3 generate-videos.py
"""
import xml.etree.ElementTree as ET
import json
import re
import urllib.request

CHANNEL_ID = "UCXqrXtF9DiXVmfB4X8RX6gA"
RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
OUTPUT = "static/data/videos.json"

print(f"Descarregant RSS de {RSS_URL}...")
with urllib.request.urlopen(RSS_URL) as r:
    xml_data = r.read()

with open('/tmp/yt-feed.xml', 'wb') as f:
    f.write(xml_data)

tree = ET.parse('/tmp/yt-feed.xml')
root = tree.getroot()
ns = {
    'atom':  'http://www.w3.org/2005/Atom',
    'yt':    'http://www.youtube.com/xml/schemas/2015',
    'media': 'http://search.yahoo.com/mrss/',
}

videos = []
for entry in root.findall('atom:entry', ns):
    title      = entry.find('atom:title', ns).text or ''
    video_id   = entry.find('yt:videoId', ns).text or ''
    published  = entry.find('atom:published', ns).text or ''
    desc_el    = entry.find('.//media:description', ns)
    desc       = desc_el.text if desc_el is not None else ''
    link       = entry.find('atom:link', ns)
    url        = link.get('href', '') if link is not None else ''
    thumb_el   = entry.find('.//media:thumbnail', ns)
    thumb      = thumb_el.get('url', '') if thumb_el is not None else ''

    # Filtra Shorts
    if re.search(r'#[Ss]horts?', title + desc):
        continue
    if '/shorts/' in url:
        continue

    videos.append({
        'id':        video_id,
        'title':     title,
        'published': published[:10],
        'thumb':     thumb,
        'url':       f'https://www.youtube.com/watch?v={video_id}',
        'embed':     f'https://www.youtube.com/embed/{video_id}?rel=0&modestbranding=1',
    })

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(videos, f, ensure_ascii=False, indent=2)

print(f"✓ {len(videos)} vídeos guardats a {OUTPUT}")