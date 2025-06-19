# Aktuelle Aufgaben 19.06.2025

## Caretaker Profil - Zusammenfassung der anstehenden Tasks

### 📝 Neue Profil-Felder für Betreuer

#### 1. **Sprachen-Feld** 
- [✅] Betreuer sollte Sprachen hinterlegen können, in denen er sich verständigen kann
- **Umsetzung**: Multi-Select oder Tag-basiertes Eingabefeld
- **Beispiele**: Deutsch, Englisch, Französisch, Spanisch, etc.
- **Integration in Anmeldung**: ✅ **JA** - Sinnvoll in Schritt 3 (Erfahrung & Qualifikationen)

#### 2. **Steuernummer-Feld**
- [ ] Steuernummer hinterlegbar für gewerbliche Betreuer
- [ ] Farbliche Umrahmung/Badge auf der Profilsuch-Seite für "Gewerblich" Status
- **Umsetzung**: Optionales Eingabefeld + visueller Indikator - Mit ein Check, falls das Gesetzt wird, kann eine Steuernummer und optinal eine USid hinterkegt werden
- **Integration in Anmeldung**: ✅ **JA** - Sinnvoll in Schritt 1 (Kontaktdaten) als optionales Feld

#### 3. **Firmenname**
- [ ] Separate Zeile für Firmennamen (für gewerbliche Betreuer)
- **Umsetzung**: Optionales Textfeld, erscheint wenn Steuernummer eingegeben wird
- **Integration in Anmeldung**: ✅ **JA** - Sinnvoll gekoppelt mit Steuernummer-Feld

#### 4. **Firmenlogo**

- [ ] Zusätzliches Bild für Firmenlogo (neben Profilbild)
- [ ] Nur wenn in Schritt 1 als Gewerbilcher Betruer angemeldet wurde.
- **Umsetzung**: Separater Upload-Bereich für gewerbliche Betreuer
- **Integration in Anmeldung**: 🤔 **BEDINGT** - Könnte in Schritt 4 (Fotos) optional hinzugefügt werden

## 💭 Bewertung: Integration in Caretaker-Anmeldung

### ✅ **Eindeutig sinnvoll für Registrierung:**
1. **Sprachen** → Schritt 3 (Erfahrung & Qualifikationen)
2. **Steuernummer** → Schritt 1 (Kontaktdaten) 
3. **Firmenname** → Schritt 1 (gekoppelt mit Steuernummer)

### 🤔 **Diskussionswürdig:**
- **Firmenlogo** → Könnte die Registrierung überladen, eventuell später im Dashboard nachrüstbar

### 🎯 **Vorgeschlagene Implementierung:**

#### Schritt 1 - Erweiterte Kontaktdaten:
```
[ ] Vorname*
[ ] Nachname*  
[ ] E-Mail*
[ ] Passwort*
[ ] PLZ*, Ort*, Straße*
[ ] Telefonnummer*
[ ] Steuernummer (optional) → triggert "Gewerblich"-Badge
[ ] Firmenname (nur sichtbar wenn Steuernummer eingegeben)
```

#### Schritt 3 - Erweiterte Qualifikationen:
```
[ ] Qualifikationen (bestehend)
[ ] Sprachen (neu) → Multi-Select
[ ] Erfahrungsbeschreibung (bestehend)
```

### 🔄 **Nächste Schritte:**
1. User-Feedback einholen zu Firmenlogo-Notwendigkeit
2. UI-Design für Sprachen-Auswahl entwickeln
3. Gewerblich-Badge-Design erstellen
4. Database-Schema für neue Felder anpassen
