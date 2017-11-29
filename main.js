const SCREEN_WIDTH = 640
const SCREEN_HEIGHT = 400
const KEY_UP = 38
const KEY_DOWN = 40
const KEY_LEFT = 37
const KEY_RIGHT = 39

const game = {
  canvas: undefined,

  

  init () {
    game.score = 0
    game.input = {
      keys: {}
    }
    
    window.addEventListener('keydown', event => {
      game.input.keys[event.keyCode] = true
    }, true)
  
    window.addEventListener('keyup', event =>  {
      delete game.input.keys[event.keyCode]
    }, true)

    game.scoreTimer = {
      time: 0,

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
        renderingContext.fillText(`SCORE: ${game.score}`, SCREEN_WIDTH * 0.5, 16)
      }
    }

    game.spawnBox = ({ x, y, vx, vy, width, height }) => {
      const box = {
        x,
        y,
        vx,
        vy,
        width,
        height,
        get halfWidth () { return box.width / 2},
        get halfHeight () { return box.height / 2},

        update (deltaTime) {
          box.y += box.vy * deltaTime
          box.x += box.vx * deltaTime
        },

        render (renderingContext) {
          renderingContext.translate(box.x, box,y)
          renderingContext.fillRect(
            -box.halfWidth,
            -box.halfHeight,
            box.width,
            box.height
          )
          renderingContext.translate(-box.x, -box.y)
        }
      }
      return box
    }

    game.boxes = [
      game.spawnBox({
        x: 100,
        y: 100,
        vx: 60,
        vy: 60,
        width: 48,
        height: 48
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
      x: 16,
      y: 16,
      width: 32,
      height: 32,
      halfWidth: 16,
      halfHeight: 16,
      speed: 150,
      vx: 0, // velocity of 'x'
      vy: 0, // velocity of 'y'
    
      update (deltaTime) {
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
    game.player.update(deltaTime)
    game.scoreTimer.update(deltaTime) 
    game.updateBoxes(deltaTime)
  },

  render (renderingContext) {
    renderingContext.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    game.player.render(renderingContext)
    game.scoreTimer.render(renderingContext)
    game.renderBoxes(renderingContext)
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

  let lastTime = 0
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
