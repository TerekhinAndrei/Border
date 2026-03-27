# BORDER

**A real-time tug-of-war about the human cost of war.**

Two nations. One border. Every button press costs lives.

### 🎮 [Play Now](https://terekhinandrei.github.io/Border/)

## About

**Border** is a browser-based real-time tug-of-war where two fictional nations fight over a shared border. Population grows continuously, attacks happen in real time, and every push of the frontline costs human lives on both sides. The game deliberately confronts the player with the consequences of escalation: casualty counters, micro-stories of individual lives lost, news tickers describing a collapsing society, and a memorial screen where you can name the dead.

It's not a power fantasy. It's a mirror.

## Features

- **Real-Time Tug-of-War** — Population grows continuously; push the frontline left or right by spending lives. Every attack costs human lives on both sides.
- **Three Strategic Modes** per side:
  - 📈 **Develop** — Accelerated population growth, no attacks allowed
  - ⚔️ **Attack** — Full offensive power, zero growth
  - 🛡️ **Defend** — Reduced casualties, moderate offense
- **AI Opponent** with Easy / Medium / Hard difficulty, featuring adaptive strategy that reads and counters your mode
- **Local 2-Player Mode** — Split keyboard controls for head-to-head matches
- **Procedurally Generated Maps** with terrain, rivers, and cities drawn on canvas
- **Casus Belli System** — Each match begins with a randomly generated diplomatic justification (à la government propaganda), presented with a typewriter effect
- **Micro-Stories** — Short, gut-punch narratives flash on screen during combat: *"Barely turned eighteen"*, *"The uniform returned. He did not"*
- **Casualty Threshold Alerts** — Contextual messages at 100K, 500K, and 1M dead
- **News Ticker** — Periodic headlines reflecting societal collapse
- **Post-Game Memorial** — Name one of the fallen. Their name is remembered for the session.
- **End-Game Reflection** — Demographic breakdowns (children, women, elderly), anti-war quotes, and the original casus belli shown in hindsight
- **Full Bilingual Support** — Russian 🇷🇺 and English 🇬🇧, switchable at any time (menu, in-game, casus belli screen)
- **Sound Design** — Procedural audio via Web Audio API: ambient war music, attack sounds, growth ticks, alarm signals, victory/defeat themes
- **Settings** — Sound toggle, growth speed (slow/normal/fast), language preference — all saved to localStorage

## Tech Stack

| Layer | Technology |
|---|---|
| **Rendering** | HTML5 Canvas (dual-layer: map + UI overlay) |
| **Logic** | Vanilla JavaScript (ES Modules) |
| **Styling** | Vanilla CSS with CSS custom properties |
| **Audio** | Web Audio API (procedural synthesis, no audio files) |
| **State** | In-memory class-based state management |
| **Persistence** | localStorage (settings only) |
| **Dependencies** | **None** — zero npm packages, zero build tools |

## Project Structure

```
Border/
├── index.html              # Single-page app shell
├── css/
│   └── styles.css          # Full design system with CSS variables
└── js/
    ├── main.js             # Entry point — boots the game
    ├── game/
    │   ├── BorderGame.js   # Main game facade: screens, loop, input, AI
    │   └── GameState.js    # Mutable session state (border, population, map)
    ├── ai/
    │   └── AiController.js # AI opponent with difficulty-based strategy
    ├── config/
    │   └── GameConfig.js   # Balance constants and mode registry
    ├── content/
    │   └── GameContent.js  # All narrative content: names, casus belli, stories, quotes
    ├── i18n/
    │   └── I18n.js         # Bilingual label system (RU/EN)
    ├── rendering/
    │   └── GameRenderer.js # Canvas rendering: map, frontline, particles, UI
    ├── systems/
    │   ├── CombatSystem.js # Attack resolution and cost calculation
    │   ├── BattleEffects.js# Particle spawning and frontline wiggle
    │   ├── MapGenerator.js # Procedural terrain, rivers, and cities
    │   └── SoundManager.js # Web Audio API sound synthesis
    └── utils/
        └── helpers.js      # DOM shortcuts, formatting, shuffle
```

## How to Play

### Quick Start

1. Clone the repo
2. Open `index.html` in any modern browser — **no build step, no server required**
3. Or serve locally for best results:
   ```bash
   npx -y serve .
   ```

### Controls

| Action | Player 1 (Left) | Player 2 (Right) |
|---|---|---|
| **Attack** | `A` key or ◀ button | `L` key or ▶ button |
| **Switch to Develop** | `1` | `9` |
| **Switch to Attack** | `2` | `8` |
| **Switch to Defend** | `3` | `7` |
| **Pause** | `Esc` | `Esc` |

### Strategy Tips

- **Develop mode** gives 5.5× population growth — use it when you have a territorial buffer
- **Attacks cost population** — reckless aggression depletes your own people
- **Mode switches** have a 3-second cooldown — plan transitions carefully
- **Defend mode** doubles the cost for the enemy to push your border
- The game ends when a nation's border is pushed to 0% or its population drops to 1

## Game Design

Border draws inspiration from the "tug of war" genre but subverts the typical victory celebration. The design pillars:

1. **Every number is a person** — Population isn't a resource, it's lives
2. **No clean victories** — Win or lose, the end screen shows what it cost
3. **The casus belli is absurd in retrospect** — The propaganda that started the war is re-shown after the carnage
4. **Naming the dead** — The memorial screen makes it personal

## Browser Support

Any modern browser with ES Module and Canvas support:
- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

## Author

Designed and developed by **Andy Terekhin**, CEO of [Terekhin Digital Crew](https://terekhindt.com).

This game was created in support of world peace and as a statement against militarism. War is not a game — but sometimes a game can remind us why.

## License

All rights reserved. This is a concept / portfolio project.

---

*"The victor in war is the one who lost less. But they still lost."*
