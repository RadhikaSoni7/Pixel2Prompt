import type { CaptureFrame, SectionSnapshot } from "../analyzer/snapshot.ts"

export type EnsureContentRequest = {
  type: "ENSURE_CONTENT"
  tabId: number
}

export type PingRequest = {
  type: "PING"
}

export type PongResponse = {
  type: "PONG"
}

export type StartSelectionRequest = {
  type: "START_SELECTION"
}

export type StopSelectionRequest = {
  type: "STOP_SELECTION"
}

export type AdjustSelectionRequest = {
  type: "ADJUST_SELECTION"
  direction: "parent" | "smaller"
}

export type CaptureTabRequest = {
  type: "CAPTURE_TAB"
  windowId: number
}

export type SectionCapturedMessage = {
  type: "SECTION_CAPTURED"
  snapshot: SectionSnapshot
  frame: CaptureFrame
}

export type SelectionCancelledMessage = {
  type: "SELECTION_CANCELLED"
}

export type EnsureContentResponse =
  | { ok: true }
  | { ok: false; error: string }

export type AckResponse = { ok: true } | { ok: false; error: string }

export type AdjustSelectionResponse =
  | { ok: true; snapshot: SectionSnapshot; frame: CaptureFrame }
  | { ok: false; error: string }

export type CaptureTabResponse =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string }

export function isEnsureContentRequest(value: unknown): value is EnsureContentRequest {
  if (!isRecord(value)) return false
  return value.type === "ENSURE_CONTENT" && typeof value.tabId === "number"
}

export function isPingRequest(value: unknown): value is PingRequest {
  return isRecord(value) && value.type === "PING"
}

export function isPongResponse(value: unknown): value is PongResponse {
  return isRecord(value) && value.type === "PONG"
}

export function isStartSelectionRequest(value: unknown): value is StartSelectionRequest {
  return isRecord(value) && value.type === "START_SELECTION"
}

export function isStopSelectionRequest(value: unknown): value is StopSelectionRequest {
  return isRecord(value) && value.type === "STOP_SELECTION"
}

export function isAdjustSelectionRequest(value: unknown): value is AdjustSelectionRequest {
  if (!isRecord(value)) return false
  return value.type === "ADJUST_SELECTION" && (value.direction === "parent" || value.direction === "smaller")
}

export function isCaptureTabRequest(value: unknown): value is CaptureTabRequest {
  if (!isRecord(value)) return false
  return value.type === "CAPTURE_TAB" && typeof value.windowId === "number"
}

export function isSectionCapturedMessage(value: unknown): value is SectionCapturedMessage {
  if (!isRecord(value) || value.type !== "SECTION_CAPTURED") return false
  return isSnapshot(value.snapshot) && isFrame(value.frame)
}

export function isSelectionCancelledMessage(value: unknown): value is SelectionCancelledMessage {
  return isRecord(value) && value.type === "SELECTION_CANCELLED"
}

export function isEnsureContentResponse(value: unknown): value is EnsureContentResponse {
  if (!isRecord(value)) return false
  if (value.ok === true) return true
  return value.ok === false && typeof value.error === "string"
}

export function isAdjustSelectionResponse(value: unknown): value is AdjustSelectionResponse {
  if (!isRecord(value)) return false
  if (value.ok === true) return isSnapshot(value.snapshot) && isFrame(value.frame)
  return value.ok === false && typeof value.error === "string"
}

export function isCaptureTabResponse(value: unknown): value is CaptureTabResponse {
  if (!isRecord(value)) return false
  if (value.ok === true) return typeof value.dataUrl === "string"
  return value.ok === false && typeof value.error === "string"
}

function isSnapshot(value: unknown): value is SectionSnapshot {
  if (!isRecord(value)) return false
  return (
    typeof value.tag === "string" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.elementCount === "number" &&
    isRecord(value.style)
  )
}

function isFrame(value: unknown): value is CaptureFrame {
  if (!isRecord(value)) return false
  return (
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.viewportWidth === "number" &&
    typeof value.viewportHeight === "number"
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
