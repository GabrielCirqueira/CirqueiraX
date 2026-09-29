import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

export const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#f5f3ff' },
          100: { value: '#ede9fe' },
          200: { value: '#ddd6fe' },
          300: { value: '#c4b5fd' },
          400: { value: '#a78bfa' },
          500: { value: '#8b5cf6' },
          600: { value: '#7c3aed' },
          700: { value: '#6d28d9' },
          800: { value: '#5b21b6' },
          900: { value: '#4c1d95' },
          950: { value: '#2e1065' },
        },
      },
      fonts: {
        heading: { value: "'Poppins', system-ui, sans-serif" },
        body: { value: "'Lato', system-ui, sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: '{colors.brand.600}' },
          contrast: { value: '#ffffff' },
          fg: { value: '{colors.brand.400}' },
          muted: { value: '{colors.brand.100}' },
          subtle: { value: '{colors.brand.200}' },
          emphasized: { value: '{colors.brand.700}' },
          focusRing: { value: '{colors.brand.500}' },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
