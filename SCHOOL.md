# Estoc — Six doctorats + matrice
Lock 28 août 2026. Une page par doctorat. Pas de tourisme.

## D1 — Stores & conformité
**Thèse.** Estoc v1 = iPhone premium. Les autres stores traduisent le même rituel. Ils ne le dédoublent pas.

**5 lois**
1. Apple 3.1.1 : tout déblocage payant passe par StoreKit. Crypto / wallet / token = rejet.
2. Apple 4.2 : un WKWebView d’un site n’est pas un jeu. Le natif doit avoir input, haptics, état hors écran.
3. Apple 4.3(b) 2026 : les apps « déjà vues » et basses sont sorties. Un proto de rectangles ne survit pas à la review.
4. Play Data safety + Loi 25 QC : v1 = local-first, zéro compte, zéro PII.
5. Xbox / PS5 / Steam : achievements et saves plus tard. Même bout, autre coque.

**3 pièges**
- Vendre Pages comme IPA.
- Ajouter un IAP « skip rust ».
- Compte forcé avant Game Center.

**Estoc garde.** Premium $7.99 CAD, 0 IAP v1, pas de login.
**Estoc refuse.** Token, battle pass, wrapper présenté comme produit fini.

## D2 — Combat tactile
**Thèse.** Le skill est *voir la lame*, pas tapper plus vite.

**5 lois**
1. Infinity Blade : le tell est une pose, pas un mot.
2. Punch-Out : chaque adversaire a un tic nommé.
3. Hades : l’échec paie une phrase, pas un écran de stats.
4. Dead Cells : le coup a un poids (shake, spark, audio court).
5. Silhouette > label. Si on coupe le texte, le coup reste lisible.

**3 pièges**
- Trois boutons + deux rectangles (c’était le live).
- Fenêtre plus courte que le temps de lire.
- Sim FIE blanche sans mythe.

**Estoc garde.** Line / Measure / Opening. 1200 ms puis 850 ms.
**Estoc refuse.** Combo à 12 inputs. HUD qui nomme le coup pendant le tell.

## D3 — Rituel & addiction éthique
**Thèse.** Addictif = « je reviens à l’aube parce que la halle se souvient ».

**5 lois**
1. Wordle : un rendez-vous, pas une ferme.
2. Streak sans honte horaire.
3. Variable reward = quel bot, pas quel loot.
4. Bloodline : mourir n’efface pas le nom.
5. Une phrase au mur > trois actes de lore.

**3 pièges**
- Energy gate.
- Pay-to-skip-rust.
- « Juste un de plus » qui tue l’aube.

**Estoc garde.** Un bout sacré. Echo optionnel plus tard.
**Estoc refuse.** Gacha, FOMO social avant J14. (Rust notée, pas codée pendant le test 14 jours.)

## D4 — Audio / haptique / UI
**Thèse.** Pendant 850 ms, l’UI n’existe presque plus.

**5 lois**
1. Clash d’acier < 120 ms.
2. Cibles ≥ 44 pt (88 px proto).
3. Safe-area iPhone en bas.
4. Haptics Core plus tard, beep maintenant.
5. La barre de fenêtre est le seul HUD du tell.

**3 pièges**
- OST qui recommence.
- Dynamic Type dans le duel.
- Label du coup adverse à l’écran.

**Estoc garde.** Beep + shake + sparks. Hint A/S/D hors tell.
**Estoc refuse.** Menu pendant l’échange.

## D5 — Connectivité
**Thèse.** La première connexion est humaine (amis de Carl), pas un serveur.

**5 lois**
1. Porte 14 jours : ouvrir Estoc avant le mail.
2. PvP temps réel casse un rituel de 8 minutes.
3. Send = défi asynchrone, plus tard.
4. Game Center / iCloud après GO iOS.
5. localStorage v10 aujourd’hui.

**3 pièges**
- Chat.
- Leaderboard public avant J14.
- Compte Apple obligatoire pour jouer le proto.

**Estoc garde.** Ladder local. Noms des fers.
**Estoc refuse.** Serveur, PvP, login.

## D6 — Ingénierie
**Thèse.** Le proto enseigne le jeu. Le natif enseigne le store.

**5 lois**
1. State machine : salute → tell → resolve → mask.
2. Un fichier Pages qui n’a pas besoin d’app.js pour vivre.
3. Cible native : Swift + SpriteKit + SwiftData local.
4. Godot / Unity = corpus, pas pile imposée à Carl.
5. Determinism du duel : bias du bot + RNG local, pas le cloud.

**3 pièges**
- Deux moteurs en parallèle.
- SHA d’app.js fantôme qui casse le live.
- Promettre Xcode depuis le chat.

**Estoc garde.** HTML canvas self-contained.
**Estoc refuse.** Installer un éditeur chez Carl.
