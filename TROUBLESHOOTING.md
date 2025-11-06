# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Stuck on Tuning Guitars" / Loading Screen Won't Disappear

**Cause**: JavaScript error preventing game initialization

**Solution**:
1. Open browser console (F12)
2. Check for error messages
3. Refresh the page (Ctrl+R or Cmd+R)
4. Clear browser cache and hard reload (Ctrl+Shift+R)

**Fixed in latest version**: PixiJS v7 initialization updated

---

### Issue: Game Window is Black

**Symptoms**: Canvas loads but shows only black screen

**Solutions**:
1. **Check WebGL support**: Open browser console and type:
   ```javascript
   document.createElement('canvas').getContext('webgl')
   ```
   If null, your browser doesn't support WebGL

2. **Update graphics drivers** (desktop)

3. **Try a different browser**: Chrome, Firefox, Edge (all modern versions)

4. **Check GPU acceleration**:
   - Chrome: `chrome://gpu` - ensure not software-rendered
   - Firefox: about:support - check for graphics errors

---

### Issue: Ball Doesn't Throw

**Symptoms**: Click "Throw Ball" but nothing happens

**Solutions**:
1. **Check ball count**: Ensure "Balls: X" shows > 0
2. **Check game state**: Should show level name in HUD
3. **Try adjusting sliders**: Make sure angle and power are set
4. **Console errors**: Open F12 and check for JavaScript errors

---

### Issue: Physics Seems Off / Ball Behaves Strangely

**Symptoms**: Ball doesn't follow expected arc, bounces weirdly

**Solutions**:
1. **Check frame rate**: Open F12 > Performance tab
   - Should be stable 60 FPS
   - If < 30 FPS, performance issue

2. **Close other tabs/applications**: Free up resources

3. **Adjust constants** (developers):
   - Edit `src/config/constants.js`
   - Modify `PHYSICS_CONFIG` values
   - Reload page

---

### Issue: Sliders Don't Work

**Symptoms**: Can't drag or click sliders to change angle/power

**Solutions**:
1. **Click directly on slider**: Don't drag outside the bar
2. **Try different input method**: Click at different positions
3. **Check browser console**: Look for event listener errors
4. **Zoom level**: Ensure browser zoom is 100%

---

### Issue: Build Fails

**Error**: `npm run build` fails

**Solutions**:

1. **Node version too old**:
   ```bash
   node --version  # Should be v18+
   ```
   Update Node.js if needed

2. **Missing dependencies**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

4. **Check disk space**: Ensure enough space for build

---

### Issue: Dev Server Won't Start

**Error**: Port already in use

**Solution**:
1. **Kill existing process** (Windows):
   ```bash
   netstat -ano | findstr :3000
   taskkill /PID [PID_NUMBER] /F
   ```

2. **Kill existing process** (Mac/Linux):
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **Use different port**:
   ```bash
   npm run dev -- --port 3005
   ```

---

### Issue: Game Runs Slow / Laggy

**Symptoms**: Low frame rate, stuttering, delayed input

**Solutions**:

1. **Close other tabs**: Free up memory and GPU

2. **Disable browser extensions**: Some can interfere

3. **Check system resources**:
   - Task Manager (Windows)
   - Activity Monitor (Mac)
   - Ensure < 80% CPU/Memory usage

4. **Reduce particle count** (developers):
   Edit `src/config/constants.js`:
   ```javascript
   export const PARTICLES = {
     splash: { count: 10 },    // Was 20
     confetti: { count: 25 },  // Was 50
     spark: { count: 8 },      // Was 15
   };
   ```

5. **Disable animations** (temporary test):
   Comment out screen shake in `game.js`:
   ```javascript
   // Animations.screenShake(this.gameContainer, 5);
   ```

---

### Issue: Mobile Browser Issues

**Symptoms**: Game doesn't work on phone/tablet

**Current Status**: Desktop-only (Phase 1)

**Workarounds**:
1. Use desktop browser
2. Landscape orientation on tablet
3. Rotate phone to landscape

**Future**: Touch controls in Phase 2

---

### Issue: Crowd Bumps Too Frequent/Infrequent

**Solution** (developers):

Edit `src/config/constants.js`:
```javascript
export const GAME_BALANCE = {
  crowdBumpInterval: 5000,    // Increase for less frequent
  crowdBumpVariance: 2000,    // Reduce for more predictable
  crowdBumpStrength: 0.3,     // Reduce for less impact
};
```

Or edit level-specific in `src/config/levelData.js`:
```javascript
{
  id: 1,
  crowdBumpFrequency: 1.5,    // Higher = less frequent
  crowdBumpStrength: 0.5,     // Lower = less impact
}
```

---

### Issue: Singer Moves Too Fast

**Solution** (developers):

Edit `src/config/levelData.js`:
```javascript
{
  id: 1,
  singerSpeed: 0.5,    // Lower value = slower (was 0.8)
}
```

Or edit base speed in `src/config/constants.js`:
```javascript
singer: {
  baseSpeed: 1.5,    // Lower value = slower (was 2)
}
```

---

### Issue: Glass Target Too Small

**Solution** (developers):

Edit `src/config/levelData.js`:
```javascript
{
  id: 1,
  glassSize: 1.5,    // Larger value = bigger target (was 1.0)
}
```

---

### Issue: Not Enough Balls

**Solution** (developers):

Edit `src/config/levelData.js`:
```javascript
{
  id: 1,
  startingBalls: 15,    // More balls (was 10)
}
```

Or globally in `src/config/constants.js`:
```javascript
export const GAME_BALANCE = {
  startingBalls: 15,    // Default for all levels
}
```

---

## Developer Debug Tools

### Browser Console Commands

While game is running, open console (F12) and try:

```javascript
// View current game state
window.game.state

// View current level
window.game.currentLevel

// View score
window.game.score

// View balls remaining
window.game.ballsRemaining

// Force level complete (testing)
window.game.shotsMade = window.game.goalShots;
window.game.levelComplete();

// Add more balls (testing)
window.game.ballsRemaining = 999;
window.game.updateUI();

// Skip to level 5
window.game.loadLevel(5);

// Get physics bodies
window.game.physics.getAllBodies()

// Pause physics
window.game.physics.stop()

// Resume physics
window.game.physics.start()
```

---

## Performance Monitoring

### Check Frame Rate

```javascript
// Add to console
setInterval(() => {
  console.log('FPS:', Math.round(1000 / window.game.deltaTime));
}, 1000);
```

### Memory Usage

Chrome DevTools:
1. F12 → Performance
2. Click Record
3. Play game for 30 seconds
4. Stop recording
5. Check memory graphs

---

## Getting Help

### Report a Bug

1. **Gather information**:
   - Browser version
   - OS version
   - Console errors (screenshot)
   - Steps to reproduce

2. **Create issue**:
   - Describe expected vs actual behavior
   - Include error messages
   - Attach screenshots

### Enable Verbose Logging

Add to `src/main.js`:
```javascript
window.DEBUG = true;
```

Add debug logs throughout code:
```javascript
if (window.DEBUG) console.log('Debug info:', data);
```

---

## Still Having Issues?

1. **Check browser compatibility**:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

2. **Verify installation**:
   ```bash
   npm list pixi.js matter-js gsap
   ```

3. **Fresh install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

4. **Check for conflicts**:
   - Disable ad blockers
   - Disable privacy extensions
   - Try incognito/private mode

---

**Most issues are resolved by refreshing the page or clearing cache!** 🔄
