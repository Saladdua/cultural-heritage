"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"

interface HexColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

export function HexColorPicker({ color, onChange, className = "" }: HexColorPickerProps) {
  const [internalColor, setInternalColor] = useState(color)
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sliderRef = useRef<HTMLCanvasElement>(null)
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(1)
  const [value, setValue] = useState(1)

  // Convert hex to HSV on initial load
  useEffect(() => {
    const { h, s, v } = hexToHsv(color)
    setHue(h)
    setSaturation(s)
    setValue(v)
  }, [color])

  // Draw color picker canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw saturation-value gradient
    for (let s = 0; s <= 100; s++) {
      for (let v = 0; v <= 100; v++) {
        ctx.fillStyle = hsvToHex(hue, s / 100, 1 - v / 100)
        ctx.fillRect(s * (canvas.width / 100), v * (canvas.height / 100), canvas.width / 100, canvas.height / 100)
      }
    }

    // Draw selection circle
    const x = saturation * canvas.width
    const y = (1 - value) * canvas.height

    ctx.beginPath()
    ctx.arc(x, y, 6, 0, 2 * Math.PI)
    ctx.strokeStyle = value > 0.5 ? "#000" : "#fff"
    ctx.lineWidth = 2
    ctx.stroke()
  }, [hue, saturation, value])

  // Draw hue slider
  useEffect(() => {
    const canvas = sliderRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw hue gradient
    for (let h = 0; h <= 360; h++) {
      ctx.fillStyle = hsvToHex(h, 1, 1)
      ctx.fillRect(h * (canvas.width / 360), 0, canvas.width / 360, canvas.height)
    }

    // Draw selection marker
    const x = (hue / 360) * canvas.width

    ctx.beginPath()
    ctx.rect(x - 2, 0, 4, canvas.height)
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.stroke()
  }, [hue])

  // Handle color picker canvas interactions
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    handleCanvasMouseMove(e)
  }, [])

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging && e.type !== "mousedown") return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      let s = (e.clientX - rect.left) / rect.width
      let v = 1 - (e.clientY - rect.top) / rect.height

      // Clamp values
      s = Math.max(0, Math.min(1, s))
      v = Math.max(0, Math.min(1, v))

      setSaturation(s)
      setValue(v)

      const newColor = hsvToHex(hue, s, v)
      setInternalColor(newColor)
      onChange(newColor)
    },
    [hue, isDragging, onChange],
  )

  // Handle hue slider interactions
  const handleSliderMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = sliderRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      let h = ((e.clientX - rect.left) / rect.width) * 360

      // Clamp value
      h = Math.max(0, Math.min(360, h))

      setHue(h)

      const newColor = hsvToHex(h, saturation, value)
      setInternalColor(newColor)
      onChange(newColor)
    },
    [saturation, value, onChange],
  )

  // Handle mouse up event
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value

    // Ensure hex starts with #
    if (!hex.startsWith("#")) {
      hex = "#" + hex
    }

    // Validate hex format
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
      setInternalColor(hex)
      onChange(hex)

      // Update HSV values
      const { h, s, v } = hexToHsv(hex)
      setHue(h)
      setSaturation(s)
      setValue(v)
    } else {
      setInternalColor(hex)
    }
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative mb-2 rounded-md overflow-hidden" style={{ height: "150px" }}>
        <canvas
          ref={canvasRef}
          width={200}
          height={150}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
        />
      </div>

      <div className="mb-2 h-6 rounded-md overflow-hidden">
        <canvas
          ref={sliderRef}
          width={360}
          height={24}
          className="w-full h-full cursor-pointer"
          onMouseDown={handleSliderMouseDown}
        />
      </div>

      <div className="flex items-center">
        <div className="w-8 h-8 rounded-md mr-2 border border-slate-200" style={{ backgroundColor: internalColor }} />
        <input
          type="text"
          value={internalColor}
          onChange={handleHexChange}
          className="flex-1 px-3 py-1 border border-slate-200 rounded-md text-sm"
        />
      </div>
    </div>
  )
}

// Utility functions for color conversion
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  // Remove # if present
  hex = hex.replace(/^#/, "")

  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  // Parse hex values
  const r = Number.parseInt(hex.substring(0, 2), 16) / 255
  const g = Number.parseInt(hex.substring(2, 4), 16) / 255
  const b = Number.parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  const s = max === 0 ? 0 : delta / max
  const v = max

  if (delta === 0) {
    h = 0
  } else if (max === r) {
    h = ((g - b) / delta) % 6
  } else if (max === g) {
    h = (b - r) / delta + 2
  } else {
    h = (r - g) / delta + 4
  }

  h = Math.round(h * 60)
  if (h < 0) h += 360

  return { h, s, v }
}

function hsvToHex(h: number, s: number, v: number): string {
  h = h % 360

  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  const toHex = (c: number) => {
    const hex = c.toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
