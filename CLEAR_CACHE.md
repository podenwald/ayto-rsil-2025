# Cache löschen für Wahrscheinlichkeits-Berechnung

## Sofort-Lösung im Browser:

1. **Browser-Console öffnen** (`F12` oder `Cmd + Option + I`)

2. **Im Console-Tab folgendes eingeben und Enter drücken:**

```javascript
// IndexedDB Cache löschen
(async () => {
  const dbRequest = indexedDB.open('aytoDB', 11);
  dbRequest.onsuccess = async (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['probabilityCache'], 'readwrite');
    const store = transaction.objectStore('probabilityCache');
    await store.clear();
    console.log('✅ Wahrscheinlichkeits-Cache gelöscht!');
    window.location.reload();
  };
})();
```

3. **Seite wird automatisch neu geladen**

4. **Gehe zum Wahrscheinlichkeits-Tab und klicke "Neu berechnen"**

---

## Alternative: Admin Panel nutzen

1. Gehe zu: **Admin Panel** (Menü links)
2. Suche nach **"Gefahrenzone"** oder **"Cache"**
3. Klicke auf **"Cache löschen"** oder ähnlich

---

## Nach dem Cache-Löschen:

Du solltest jetzt in der Console sehen:
```
🔍 Probability Calculation Input: { men: [...], women: [...] }
✅ Schritt 1: X Matchings generiert
✅ Schritt 2: Y gültige Matchings nach Zeremonien
...
```

