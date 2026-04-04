import xml.etree.ElementTree as ET
import json
import re
import sys

feed_file = sys.argv[1]
out_file  = sys.argv[2]

tree = ET.parse(feed_file)
root = tree.getroot()
ns = {
    'atom':  'http://www.w3.org/2005/Atom',
    'yt':    'http://www.youtube.com/xml/schemas/2015',
    'media': 'http://search.yahoo.com/mrss/',
}

videos = []
for entry in root.findall('atom:entry', ns):
    title    = entry.find('atom:title', ns).text or ''
    video_id = entry.find('yt:videoId', ns).text or ''
    published = entry.find('atom:published', ns).text or ''
    desc_el  = entry.find('.//media:description', ns)
    desc     = desc_el.text if desc_el is not None else ''

    if re.search(r'#[Ss]horts?', title + desc):
        continue
    link = entry.find('atom:link', ns)
    url  = link.get('href', '') if link is not None else ''
    if '/shorts/' in url:
        continue

    thumb_el = entry.find('.//media:thumbnail', ns)
    thumb    = thumb_el.get('url', '') if thumb_el is not None else ''

    videos.append({
        'id':        video_id,
        'title':     title,
        'published': published[:10],
        'thumb':     thumb,
        'url':       f'https://www.youtube.com/watch?v={video_id}',
        'embed':     f'https://www.youtube.com/embed/{video_id}?rel=0&modestbranding=1',
    })

with open(out_file, 'w', encoding='utf-8') as f:
    json.dump(videos, f, ensure_ascii=False, indent=2)

print(f"Vídeos guardats: {len(videos)}")