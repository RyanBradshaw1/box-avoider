const SCREEN_WIDTH = 640
const SCREEN_HEIGHT = 400

const GS_TITLE = 'title'
const GS_PLAY = 'play'
const GS_GAMEOVER = 'gameover'

const KEY_UP = 38
const KEY_DOWN = 40
const KEY_LEFT = 37
const KEY_RIGHT = 39
const KEY_SPACE = 32
const KEY_ESCAPE = 27

const game = {
  canvas: undefined,

  saveHighScore (score) {
    game.highScore = score
    window.localStorage.setItem('highScore', `${score}`)
  },

  loadHighScore () {
    return ~~(window.localStorage.getItem('highScore')) || 0
  },

  spawnBox ({ x, y, vx, vy, width, height, ai }) {
    const box = {
      x,
      y,
      vx,
      vy,
      width,
      height,
      get halfWidth () { return box.width / 2},
      get halfHeight () { return box.height / 2},

      reset () {
        box.x = x
        box.y = y
        box.vx = vx
        box.vy = vy
        box.width = width,
        box.height = height
      },

      update (deltaTime) {
        ai && ai.update && ai.update(deltaTime)
      },

      render (renderingContext) {
        renderingContext.translate(box.x, box.y)
        renderingContext.fillRect(
          -box.halfWidth,
          -box.halfHeight,
          box.width,
          box.height
        )
        renderingContext.translate(-box.x, -box.y)
      }
    }

    ai && ai.attach && ai.attach(box)

    return box
  },
  
  init () {
    game.state = GS_TITLE
    game.score = 0
    game.highScore = game.loadHighScore()
    

    const bouncingBoxAI = () => {
      const ai = {
        box: undefined,

        attach(box) {
          ai.box = box
        },

        update (deltaTime) {
          const { box } = ai
          if (!box) {
            return
          }

          const offBottomEdge = (box.y + box.halfHeight) > SCREEN_HEIGHT
          const offTopEdge = (box.y - box.halfHeight) < 0
          const offLeftEdge = (box.x - box.halfWidth) < 0
          const offRightEdge = (box.x + box.halfWidth) > SCREEN_WIDTH

          box.y += box.vy * deltaTime
          box.x += box.vx * deltaTime

          if(offBottomEdge || offTopEdge) {
            box.vy = -box.vy
            box.y += box.vy * deltaTime
            box.y += box.vy * deltaTime
          }

          if(offLeftEdge || offRightEdge) {
            box.vx = -box.vx
            box.x += box.vx * deltaTime
            box.x += box.vx * deltaTime
          }
        }
      }
      return ai
    }

    game.input = {
      keys: {},
      keysPressed: {}
    }
    
    window.addEventListener('keydown', event => {
      game.input.keys[event.keyCode] = true
    }, true)
  
    window.addEventListener('keyup', event =>  {
      delete game.input.keys[event.keyCode]
    }, true)

    game.scoreTimer = {
      time: 0,
      paused: false,

      update (deltaTime) {
        // add elapsed time to total time
        game.scoreTimer.time += deltaTime

        // when accumulated time reaches 1 second, reset time and increment score
        if (game.scoreTimer.time >= 1) {
          game.scoreTimer.time -= 1
          game.score += 1
        }
      },

      render (renderingContext) {
        // render score at top of screen
        renderingContext.fillStyle = 'lime'
        renderingContext.font = '24px "Kelly Slab"'
        renderingContext.fillText(`SCORE: ${game.score}`, SCREEN_WIDTH * 0.5, 16)
      }
    }

    game.boxes = [
      game.spawnBox({
        x: SCREEN_WIDTH * 0.25,
        y: SCREEN_HEIGHT * 0.25,
        vx: 200,
        vy: 200,
        width: 48,
        height: 48,
        ai: bouncingBoxAI()
      }),
      game.spawnBox({
        x: SCREEN_WIDTH * 0.75,
        y: SCREEN_HEIGHT * 0.45,
        vx: -200,
        vy: 200,
        width: 48,
        height: 48,
        ai: bouncingBoxAI()
      }),
      game.spawnBox({
        x: SCREEN_WIDTH * 0.35,
        y: SCREEN_HEIGHT * 0.94,
        vx: 300,
        vy: -300,
        width: 24,
        height: 24,
        ai: bouncingBoxAI()
      })
    ]

    game.updateBoxes = deltaTime => {
      game.boxes.forEach(box => box.update(deltaTime))
    }
    
    game.renderBoxes = renderingContext => {
      renderingContext.save()
      renderingContext.fillStyle = 'crimson'
      game.boxes.forEach(box => box.render(renderingContext))
      renderingContext.restore()
    }

    game.player = {
      x: SCREEN_WIDTH * 0.01,
      y: SCREEN_HEIGHT * 0.01,
      width: 32,
      height: 32,
      halfWidth: 16,
      halfHeight: 16,
      speed: 150,
      vx: 0, // velocity of 'x'
      vy: 0, // velocity of 'y'

      reset (player) {
        player.x = SCREEN_WIDTH * 0.01,
        player.y = SCREEN_HEIGHT * 0.01
      },

      checkCollisionAgainstBoxes () {
        const playerLeft = game.player.x - game.player.halfWidth
        const playerTop = game.player.y - game.player.halfHeight
        const playerRight = game.player.x + game.player.halfWidth
        const playerBottom = game.player.y + game.player.halfHeight

        const boxCount = game.boxes.length
        let collision = false

        for (let i = 0; i < boxCount; i++) {
          const box = game.boxes[i]

          const boxLeft = box.x - box.halfWidth
          const boxTop = box.y - box.halfHeight
          const boxRight = box.x + box.halfWidth
          const boxBottom = box.y + box.halfHeight

          if (!(
            (playerBottom < boxTop) || // player bottom above box top
            (playerTop > boxBottom) || // player top under box bottom
            (playerLeft > boxRight) || // player left to the right of box right
            (playerRight < boxLeft)    // player right to the left of box left
          )) {
            collision = true
            break
          }
        }
        return collision
      },

      
      /*
      another way to write the same thing
      if (
        (playerBottom >= boxTop) && // player bottom under box top
        (playerTop <= boxBottom) && // player top above box bottom
        (playerLeft <= boxRight) && // player left to the left of box right
        (playerRight >= boxLeft)     // player right to the right of box left
        ) {
          collision = true
          break
        }
      }
      return collision
    },
    */
    
      update (deltaTime) {
        const collision = game.player.checkCollisionAgainstBoxes()

        if (collision) {
          game.state = GS_GAMEOVER
        }
        
        // reset player velocity
        game.player.vx = 0
        game.player.vy = 0
    
        // if up arrow key is being pressed, use upward velocity
        // if down arrow key is pressed, use downward velocity
        if (game.input.keys[KEY_UP]) {
          game.player.vy = -1
        } else if (game.input.keys[KEY_DOWN]) {
          game.player.vy = 1
        }
    
        // if left arrow is pressed, use a left velocity
        // if right arrow is pressed, use a right velocity
        if (game.input.keys[KEY_LEFT]) {
          game.player.vx = -1
        } else if (game.input.keys[KEY_RIGHT]) {
          game.player.vx = 1
        }
    
        // if moving along the 'x' or 'y' axis
        if (game.player.vx !== 0 || game.player.vy !== 0) {
          // get length of player's velocity vector
          // distance formula: d = √ x² + y²
          const x2 = game.player.vx * game.player.vx
          const y2 = game.player.vy * game.player.vy
          const magnitude = Math.sqrt(x2 + y2)
    
          // if there is a non-zero length, normalize the vector
          // scale normalized vector by player's speed
          // scale by deltaTime to get # of units player should move this update
          if (magnitude) {
            // normalize the velocity vector
            const vx = game.player.vx / magnitude
            const vy = game.player.vy / magnitude
    
            // scale by player's speed
            const moveX = game.player.speed * vx
            const moveY = game.player.speed * vy
    
            // scale by deltaTime and apply to the position
            game.player.x += moveX * deltaTime
            game.player.y += moveY * deltaTime
          }
        }
    
        // if the left edge of the player goes off the left edge of screen
        // then move player so its left edge is equal to left edge of screen
        // if the right edge of the player goes off the right edge of screen
        // move player so its right edge is equal to right edge of screen
        if (game.player.x - game.player.halfWidth < 0) {
          game.player.x = game.player.halfWidth
        } else if (game.player.x + game.player.halfWidth > SCREEN_WIDTH) {
          game.player.x = SCREEN_WIDTH - game.player.halfWidth
        }
    
        // if the top edge of the player goes off the top edge of screen
        // move player so it's top edge is equal to top edge of screen
        // if bottom edge of player goes off the bottom edge of screen
        // move player so it's bottom edge is equal to bottom edge of screen
        if (game.player.y - game.player.halfHeight < 0) {
          game.player.y = game.player.halfHeight
        } else if (game.player.y + game.player.halfHeight > SCREEN_HEIGHT) {
          game.player.y = SCREEN_HEIGHT - game.player.halfHeight
        }
    
      },
    
      render (renderingContext) {
        // save current context transformation
        renderingContext.save()
    
        // translate the context coordinate system to place the player 'x' and 'y' at origin of '0, 0'
        renderingContext.translate(game.player.x, game.player.y)
    
        // draw a filled rectangle with upper-left corner offset
        // to the left and above the origin by half the player's size
        // and is the player's full size. This renders the rectangle
        // so the center is at the origin.
        renderingContext.fillRect(
          -game.player.halfWidth,
          -game.player.halfHeight,
          game.player.width,
          game.player.height
        )
    
        // restore previous context transformation
        renderingContext.restore()
      }
    }

  },

  update (deltaTime) {
    if (game.state === GS_TITLE) {
      if (game.input.keys[KEY_SPACE] && !game.input.keysPressed[KEY_SPACE]) {
        game.input.keysPressed[KEY_SPACE] = true
      } else if (!game.input.keys[KEY_SPACE] && game.input.keysPressed[KEY_SPACE]) {
        game.input.keysPressed[KEY_SPACE] = false
        game.player.reset.bind(null, game.player)()
        game.boxes.forEach(box => box.reset.bind(null, box)())
        game.score = 0
        game.state = GS_PLAY
      }
    } else if (game.state === GS_PLAY) {
      if (game.scoreTimer.paused) {
        // unpause when space is pressed while score is paused
        if (game.input.keys[KEY_SPACE] && !game.input.keysPressed[KEY_SPACE]) {
          game.input.keysPressed[KEY_SPACE] = true
        } else if (!game.input.keys[KEY_SPACE] && game.input.keysPressed[KEY_SPACE]) {
          game.input.keysPressed[KEY_SPACE] = false
          game.scoreTimer.paused = false
        }
        
        // quit to title when esc is pressed while score is paused
        if (game.input.keys[KEY_ESCAPE] && !game.input.keysPressed[KEY_ESCAPE]) {
          game.input.keysPressed[KEY_ESCAPE] = true
        } else if (!game.input.keys[KEY_ESCAPE] && game.input.keysPressed[KEY_ESCAPE]) {
          game.input.keysPressed[KEY_ESCAPE] = false
          game.state = GS_TITLE
        }
      } else {
        game.player.update(deltaTime)
        game.scoreTimer.update(deltaTime)
        game.updateBoxes(deltaTime)
        
        //pause game when space is pressed
        if (game.input.keys[KEY_SPACE] && !game.input.keysPressed[KEY_SPACE]) {
          game.input.keysPressed[KEY_SPACE] = true
        } else if (!game.input.keys[KEY_SPACE] && game.input.keysPressed[KEY_SPACE]) {
          game.input.keysPressed[KEY_SPACE] = false
          game.scoreTimer.paused = true
        }
      }

      game.player.update(deltaTime)
      game.scoreTimer.update(deltaTime)
      game.updateBoxes(deltaTime)
    } else if (game.state === GS_GAMEOVER) {
      if (game.input.keys[KEY_SPACE] && !game.input.keysPressed[KEY_SPACE]) {
        game.input.keysPressed[KEY_SPACE] = true
      } else if (!game.input.keys[KEY_SPACE] && game.input.keysPressed[KEY_SPACE]) {
        game.input.keysPressed[KEY_SPACE] = false
        if(game.score > game.highScore) {
          game.saveHighScore(game.score)
        }
        game.state = GS_TITLE
      }
    }
  },

  render (renderingContext) {
    renderingContext.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    if (game.state === GS_TITLE) {
      if (game.highScore) {
        renderingContext.font = '18px "Kelly Slab"'
        renderingContext.fillText(
          `HIGH SCORE: ${game.highScore}`, SCREEN_WIDTH * 0.1, SCREEN_HEIGHT * 0.95
        )
      }
      renderingContext.fillStyle = 'lime'
      renderingContext.font = '24px "Kelly Slab"'

      renderingContext.fillText(
        'Press SPACE to play',
        SCREEN_WIDTH * 0.5,
        SCREEN_HEIGHT * 0.5
      )
    } else if (game.state === GS_PLAY) {
      if (game.highScore) {
        renderingContext.font = '18px "Kelly Slab"'
        renderingContext.fillText(
          `HIGH SCORE: ${game.highScore}`, SCREEN_WIDTH * 0.1, SCREEN_HEIGHT * 0.95
        )
      }
      game.player.render(renderingContext)
      game.scoreTimer.render(renderingContext)
      game.renderBoxes(renderingContext)

    } else if (game.state === GS_GAMEOVER) {
      if (game.highScore) {
        renderingContext.font = '18px "Kelly Slab"'
        renderingContext.fillStyle = 'lime'
        renderingContext.fillText(
          `HIGH SCORE: ${game.highScore}`, SCREEN_WIDTH * 0.1, SCREEN_HEIGHT * 0.95
        )
      }
      // render game elements
      game.scoreTimer.render(renderingContext)
      game.renderBoxes(renderingContext)
      game.player.render(renderingContext)

      //dim the screen
      renderingContext.save()
      renderingContext.globalAlpha = 0.5
      renderingContext.fillStyle = 'black'
      renderingContext.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
      renderingContext.restore()

      // write the text
      const oldFont = renderingContext.font
      renderingContext.fillStyle = 'red'
      renderingContext.font = '42px "Kelly Slab"'
      renderingContext.fillText(
        'GAME OVER',
        SCREEN_WIDTH * 0.5,
        SCREEN_HEIGHT * 0.5
      )
      renderingContext.font = '24px "Kelly Slab"'
      renderingContext.fillText(
        'Press SPACE to return to main menu',
        SCREEN_WIDTH * 0.5,
        SCREEN_HEIGHT * 0.65
      )
    }
  }
}



const boot = () => {
  console.clear()
  game.canvas = document.querySelector('.game-canvas')
  const renderingContext = game.canvas.getContext('2d')
  renderingContext.textAlign = 'center'
  renderingContext.textBaseline = 'middle'
  renderingContext.font = '16px "Kelly Slab"'
  renderingContext.fillStyle = 'lime'
  renderingContext.strokeStyle = 'lime'

  game.init && game.init()

  let lastTime = Date.now()
  const mainLoop = elapsedTime => {
    const currentTime = Date.now()
    const deltaTime = (currentTime - lastTime) * 0.001
    lastTime = currentTime
    game.update && game.update(deltaTime)
    game.render && game.render(renderingContext)
    window.requestAnimationFrame(mainLoop)
  }

  mainLoop(0)
}

document.addEventListener('DOMContentLoaded', boot, false)