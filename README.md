# 🎸 Iggy Pop Tennis Ball Riot 🎸

A chaotic rock concert tennis ball throwing game built with PixiJS, Matter.js, and GSAP.

## 🎮 Game Description

You're in the audience at a wild rock concert, trying to toss tennis balls into the drummer's glass while navigating obstacles, moving band members, and rowdy crowd bumps!

## ✨ Features

- **5 Progressive Levels** - From "Sound Check" to "Legendary Show"
- **Physics-Based Gameplay** - Realistic ball throwing mechanics with Matter.js
- **Dynamic Obstacles** - Singer moves across stage with different patterns
- **Crowd Interactions** - Random crowd bumps affect your aim
- **Scoring System** - Combos, bonuses, and trick shots
- **Smooth Animations** - GSAP-powered visual effects

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Play the Game

1. Open the game in your browser (default: http://localhost:3000)
2. Click "Start Game"
3. Adjust angle and power sliders
4. Click "Throw Ball" to launch
5. Make successful shots to progress through levels!

## 🎯 Gameplay Tips

- **Angle**: Aim higher for longer shots, lower for direct shots
- **Power**: More power = faster/farther, but harder to control
- **Timing**: Watch the singer's movement pattern
- **Combos**: Consecutive successful shots multiply your score
- **Crowd Bumps**: Expect random crowd bumps that shake your aim!

## 🛠️ Tech Stack

- **PixiJS** - 2D rendering engine
- **Matter.js** - 2D physics engine
- **GSAP** - Animation library
- **Vite** - Build tool and dev server

## 📦 Project Structure

```
tennis-ball-gig/
├── src/
│   ├── config/          # Game configuration
│   │   ├── constants.js
│   │   └── levelData.js
│   ├── entities/        # Game entities
│   │   ├── Ball.js
│   │   ├── Singer.js
│   │   ├── Glass.js
│   │   └── Drummer.js
│   ├── animations.js    # GSAP animation helpers
│   ├── particles.js     # Particle effects system
│   ├── physics.js       # Matter.js physics wrapper
│   ├── ui.js           # UI management
│   ├── utils.js        # Utility functions
│   ├── game.js         # Main game logic
│   └── main.js         # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Game Architecture

### Phase 1 (Current) - Core Prototype
- ✅ Basic throwing mechanics
- ✅ Singer obstacle movement
- ✅ Crowd bump system
- ✅ Win/loss detection
- ✅ UI controls (angle, power, balls)
- ✅ 5 progressive levels
- ✅ Scoring system
- ✅ Particle effects

### Future Phases
- Phase 2: Enhanced visual effects and polish
- Phase 3: Special ball types and power-ups
- Phase 4: Additional game modes (Endless, Practice)
- Phase 5: Sound effects and music

## 🎮 Controls

- **Mouse**: Click and drag sliders to adjust angle and power
- **Click "Throw Ball"**: Launch the ball
- **Pause Button**: Pause the game anytime

## 🏆 Scoring

- **Successful Shot**: 100 points
- **No-Bounce Shot**: +50 bonus
- **Bank Shot (1 bounce)**: +25 bonus
- **Trick Shot (2+ bounces)**: +100 bonus
- **Combos**: 1.5x → 2x → 3x multiplier
- **Efficient Bonus**: +100 for using less than 5 balls

## 🌐 Deployment

This game is ready to deploy on Vercel, Netlify, or any static hosting:

```bash
# Build for production
npm run build

# The dist/ folder contains the production build
```

## 📝 License

This project is created for educational and entertainment purposes.

## 🎪 Credits

Designed and developed as a playable web game showcasing:
- Modern JavaScript game development
- Physics-based gameplay mechanics
- Responsive UI design
- Particle effects and animations

---

**Have fun and rock on!** 🎸🎾
