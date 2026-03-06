import { useState, useEffect, useCallback, useRef } from "react"

type Grid = boolean[][]

function createEmpty(width: number, height: number): Grid {
  return Array.from({ length: height }, () => Array(width).fill(false))
}

function randomize(width: number, height: number, density = 0.3): Grid {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => Math.random() < density),
  )
}

function countNeighbors(grid: Grid, x: number, y: number, w: number, h: number): number {
  let count = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const ny = (y + dy + h) % h
      const nx = (x + dx + w) % w
      if (grid[ny][nx]) count++
    }
  }
  return count
}

function step(grid: Grid, w: number, h: number): Grid {
  return grid.map((row, y) =>
    row.map((cell, x) => {
      const n = countNeighbors(grid, x, y, w, h)
      return cell ? n === 2 || n === 3 : n === 3
    }),
  )
}

interface GameOfLifeState {
  grid: Grid
  generation: number
  population: number
  paused: boolean
}

export function useGameOfLife(width: number, height: number) {
  const initState = useCallback((): GameOfLifeState => {
    const grid = randomize(width, height)
    return {
      grid,
      generation: 0,
      population: grid.flat().filter(Boolean).length,
      paused: false,
    }
  }, [width, height])

  const [state, setState] = useState<GameOfLifeState>(initState)
  const stateRef = useRef(state)
  stateRef.current = state

  const restart = useCallback(() => {
    setState(initState())
  }, [initState])

  const clear = useCallback(() => {
    setState({
      grid: createEmpty(width, height),
      generation: 0,
      population: 0,
      paused: true,
    })
  }, [width, height])

  const togglePause = useCallback(() => {
    setState((s) => ({ ...s, paused: !s.paused }))
  }, [])

  const stepOnce = useCallback(() => {
    setState((s) => {
      const newGrid = step(s.grid, width, height)
      return {
        ...s,
        grid: newGrid,
        generation: s.generation + 1,
        population: newGrid.flat().filter(Boolean).length,
      }
    })
  }, [width, height])

  useEffect(() => {
    if (state.paused) return
    if (width < 4 || height < 4) return

    const id = setInterval(() => {
      setState((prev) => {
        const newGrid = step(prev.grid, width, height)
        return {
          ...prev,
          grid: newGrid,
          generation: prev.generation + 1,
          population: newGrid.flat().filter(Boolean).length,
        }
      })
    }, 150)

    return () => clearInterval(id)
  }, [state.paused, width, height])

  // Reset on size change
  useEffect(() => {
    setState(initState())
  }, [width, height, initState])

  return { ...state, restart, clear, togglePause, stepOnce }
}
