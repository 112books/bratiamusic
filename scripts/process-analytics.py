import json
import sys
from datetime import datetime

def safe_get(data, key, default=None):
    """Retorna el valor o default si és None o no existeix."""
    if data is None:
        return default
    return data.get(key, default)

def main():
    if len(sys.argv) < 5:
        print("Ús: process-analytics.py <input.json> <output.json> <start> <end>")
        sys.exit(1)

    input_file  = sys.argv[1]
    output_file = sys.argv[2]
    start_date  = sys.argv[3]
    end_date    = sys.argv[4]

    # Llegir i validar JSON d'entrada
    try:
        with open(input_file) as f:
            content = f.read().strip()
        if not content:
            print("⚠️  Fitxer d'entrada buit, generant analytics buit.")
            raw = {}
        else:
            raw = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"❌ JSON invàlid: {e}")
        print(f"   Contingut: {content[:200]}")
        sys.exit(1)

    # Processar hits (defensiu: pot ser null si l'API va fallar)
    hits_data = safe_get(raw, "hits_data") or {}
    hits = safe_get(hits_data, "hits") or []

    # Processar la resta
    browsers  = safe_get(safe_get(raw, "browsers")  or {}, "browsers")  or []
    systems   = safe_get(safe_get(raw, "systems")   or {}, "systems")   or []
    sizes     = safe_get(safe_get(raw, "sizes")     or {}, "sizes")     or []
    locations = safe_get(safe_get(raw, "locations") or {}, "locations") or []

    output = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "period": {"start": start_date, "end": end_date},
        "hits": hits,
        "browsers": browsers,
        "systems": systems,
        "sizes": sizes,
        "locations": locations,
        "total_pageviews": sum(
            sum(h.get("count", 0) for h in day.get("stats", []))
            for day in hits
        ) if hits else 0
    }

    with open(output_file, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ Analytics processats: {output['total_pageviews']} pageviews")
    print(f"   Browsers: {len(browsers)} | Sistemes: {len(systems)} | Ubicacions: {len(locations)}")

if __name__ == "__main__":
    main()