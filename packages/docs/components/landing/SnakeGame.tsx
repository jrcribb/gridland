// @ts-nocheck
import { useMemo } from "react"
import { textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"
import { useSnakeGame } from "./use-snake-game"

interface SnakeGameProps {
  width: number
  height: number
}

export function SnakeGame({ width, height }: SnakeGameProps) {
  const theme = useTheme()
  const game = useSnakeGame(width, height)

  useKeyboard((event: any) => {
    switch (event.name) {
      case "up":
      case "k":
        game.changeDirection("up")
        break
      case "down":
      case "j":
        game.changeDirection("down")
        break
      case "left":
      case "h":
        game.changeDirection("left")
        break
      case "right":
      case "l":
        game.changeDirection("right")
        break
      case "r":
        game.restart()
        break
      case "p":
      case "space":
        game.togglePause()
        break
    }
  })

  const rows = useMemo(() => {
    const grid: string[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => " "),
    )

    // Place food
    grid[game.food.y][game.food.x] = "\u2605"

    // Place snake
    game.snake.forEach((p, i) => {
      if (p.y >= 0 && p.y < height && p.x >= 0 && p.x < width) {
        grid[p.y][p.x] = i === 0 ? "\u25CF" : "\u25CB"
      }
    })

    return grid
  }, [game.snake, game.food, width, height])

  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={theme.border}
      flexGrow={1}
    >
      <box paddingX={1} marginBottom={0}>
        <text>
          <span style={textStyle({ bold: true })}>Snake</span>
          <span style={textStyle({ dim: true })}>{" \u2502 "}</span>
          <span style={textStyle({ fg: theme.accent })}>Score: {game.score}</span>
          {game.paused && (
            <span style={textStyle({ fg: "#ffcc00", bold: true })}> [PAUSED]</span>
          )}
          {game.gameOver && (
            <span style={textStyle({ fg: "#ff4444", bold: true })}> [GAME OVER]</span>
          )}
        </text>
      </box>
      {rows.map((row, y) => (
        <text key={y}>
          {row.map((cell, x) => {
            if (cell === "\u25CF") {
              return (
                <span key={x} style={{ fg: "#44ff44" }}>
                  {cell}
                </span>
              )
            }
            if (cell === "\u25CB") {
              return (
                <span key={x} style={{ fg: "#22aa22" }}>
                  {cell}
                </span>
              )
            }
            if (cell === "\u2605") {
              return (
                <span key={x} style={{ fg: "#ff4444" }}>
                  {cell}
                </span>
              )
            }
            return <span key={x}>{cell}</span>
          })}
        </text>
      ))}
    </box>
  )
}
