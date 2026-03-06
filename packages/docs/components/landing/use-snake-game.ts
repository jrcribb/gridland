import { useState, useEffect, useCallback, useRef } from "react"

interface Point {
  x: number
  y: number
}

type Direction = "up" | "down" | "left" | "right"

interface SnakeState {
  snake: Point[]
  food: Point
  direction: Direction
  score: number
  gameOver: boolean
  paused: boolean
}

function randomFood(width: number, height: number, snake: Point[]): Point {
  let p: Point
  do {
    p = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) }
  } while (snake.some((s) => s.x === p.x && s.y === p.y))
  return p
}

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
}

export function useSnakeGame(width: number, height: number) {
  const directionQueue = useRef<Direction[]>([])

  const initState = useCallback((): SnakeState => {
    const cx = Math.floor(width / 2)
    const cy = Math.floor(height / 2)
    const snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ]
    return {
      snake,
      food: randomFood(width, height, snake),
      direction: "right",
      score: 0,
      gameOver: false,
      paused: false,
    }
  }, [width, height])

  const [state, setState] = useState<SnakeState>(initState)

  const restart = useCallback(() => {
    directionQueue.current = []
    setState(initState())
  }, [initState])

  const togglePause = useCallback(() => {
    setState((s) => (s.gameOver ? s : { ...s, paused: !s.paused }))
  }, [])

  const changeDirection = useCallback(
    (dir: Direction) => {
      directionQueue.current.push(dir)
    },
    [],
  )

  useEffect(() => {
    if (state.gameOver || state.paused) return
    if (width < 4 || height < 4) return

    const id = setInterval(() => {
      setState((prev) => {
        let dir = prev.direction
        // Process queued directions
        while (directionQueue.current.length > 0) {
          const next = directionQueue.current.shift()!
          if (next !== OPPOSITE[dir]) {
            dir = next
            break
          }
        }

        const head = prev.snake[0]
        const deltas: Record<Direction, Point> = {
          up: { x: 0, y: -1 },
          down: { x: 0, y: 1 },
          left: { x: -1, y: 0 },
          right: { x: 1, y: 0 },
        }
        const d = deltas[dir]
        const newHead = { x: head.x + d.x, y: head.y + d.y }

        // Wall collision
        if (newHead.x < 0 || newHead.x >= width || newHead.y < 0 || newHead.y >= height) {
          return { ...prev, direction: dir, gameOver: true }
        }

        // Self collision
        if (prev.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
          return { ...prev, direction: dir, gameOver: true }
        }

        const ate = newHead.x === prev.food.x && newHead.y === prev.food.y
        const newSnake = [newHead, ...prev.snake]
        if (!ate) newSnake.pop()

        return {
          ...prev,
          snake: newSnake,
          direction: dir,
          score: ate ? prev.score + 1 : prev.score,
          food: ate ? randomFood(width, height, newSnake) : prev.food,
        }
      })
    }, 120)

    return () => clearInterval(id)
  }, [state.gameOver, state.paused, width, height])

  // Reset on size change
  useEffect(() => {
    directionQueue.current = []
    setState(initState())
  }, [width, height, initState])

  return { ...state, changeDirection, restart, togglePause }
}
