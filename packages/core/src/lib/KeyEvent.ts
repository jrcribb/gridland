import type { KeyEventType, ParsedKey } from "./parse.keypress"

export type { KeyEventType, ParsedKey }

export class KeyEvent implements ParsedKey {
  name: string
  ctrl: boolean
  meta: boolean
  shift: boolean
  option: boolean
  sequence: string
  number: boolean
  raw: string
  eventType: KeyEventType
  source: "raw" | "kitty"
  code?: string
  super?: boolean
  hyper?: boolean
  capsLock?: boolean
  numLock?: boolean
  baseCode?: number
  repeated?: boolean

  private _defaultPrevented: boolean = false
  private _propagationStopped: boolean = false

  constructor(key: ParsedKey) {
    this.name = key.name
    this.ctrl = key.ctrl
    this.meta = key.meta
    this.shift = key.shift
    this.option = key.option
    this.sequence = key.sequence
    this.number = key.number
    this.raw = key.raw
    this.eventType = key.eventType
    this.source = key.source
    this.code = key.code
    this.super = key.super
    this.hyper = key.hyper
    this.capsLock = key.capsLock
    this.numLock = key.numLock
    this.baseCode = key.baseCode
    this.repeated = key.repeated
  }

  get defaultPrevented(): boolean {
    return this._defaultPrevented
  }

  get propagationStopped(): boolean {
    return this._propagationStopped
  }

  preventDefault(): void {
    this._defaultPrevented = true
  }

  stopPropagation(): void {
    this._propagationStopped = true
  }
}
