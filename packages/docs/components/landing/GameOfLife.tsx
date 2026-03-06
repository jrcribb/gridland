// @ts-nocheck
import { useMemo } from "react"
import { textStyle, useTheme } from "@gridland/ui"
import { useKeyboard } from "@opentui/react"
import { useGameOfLife } from "./use-game-of-life"

interface GameOfLifeProps {
  width: number
  height: number
}

export function GameOfLife({ width, height }: GameOfLifeProps) {
  const theme = useTheme()
  const game = useGameOfLife(width, height)

  useKeyboard((event: any) => {
    switch (event.name) {
      case "r":
        game.restart()
        break
      case "p":
      case "space":
        game.togglePause()
        break
      case "n":
        game.stepOnce()
        break
      case "c":
        game.clear()
        break
    }
  })

  const rows = useMemo(() => {
    return game.grid.map((row) =>
      row.map((cell) => (cell ? "\u2588" : " ")),
    )
  }, [game.grid])

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
          <span style={textStyle({ bold: true })}>Life</span>
          <span style={textStyle({ dim: true })}>{" \u2502 "}</span>
          <span style={textStyle({ fg: theme.accent })}>
            Gen: {game.generation}
          </span>
          <span style={textStyle({ dim: true })}>{" \u2502 "}</span>
          <span style={textStyle({ fg: theme.accent })}>
            Pop: {game.population}
          </span>
          {game.paused && (
            <span style={textStyle({ fg: "#ffcc00", bold: true })}> [PAUSED]</span>
          )}
        </text>
      </box>
      {rows.map((row, y) => (
        <text key={y}>
          {row.map((cell, x) => {
            if (cell === "\u2588") {
              return (
                <span key={x} style={{ fg: "#44ff44" }}>
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
