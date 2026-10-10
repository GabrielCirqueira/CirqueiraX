import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

export const PALETTE_NAME = 'catalist' as const

export function paletteToken(scale: string, shade: number | string) {
  return `${PALETTE_NAME}.${scale}.${shade}`
}

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: 'Poppins, ui-sans-serif, system-ui, sans-serif' },
        body: { value: 'Lato, ui-sans-serif, system-ui, sans-serif' },
      },
      colors: {
        catalist: {
          brand: {
            50: { value: '#f6f3ff' },
            100: { value: '#ebe3ff' },
            200: { value: '#d9ccff' },
            300: { value: '#bea8ff' },
            400: { value: '#a787ff' },
            500: { value: '#8b5cf6' },
            600: { value: '#7145d6' },
            700: { value: '#5833b0' },
            800: { value: '#3e2184' },
            900: { value: '#2a1660' },
            950: { value: '#1a0d43' },
          },
          grey: {
            0: { value: '#ffffff' },
            25: { value: '#fbfafc' },
            50: { value: '#f5f4f9' },
            100: { value: '#e8e7ee' },
            200: { value: '#d5d4dc' },
            300: { value: '#b8b7c1' },
            400: { value: '#a09eaa' },
            500: { value: '#82808c' },
            600: { value: '#6a6973' },
            700: { value: '#53525b' },
            800: { value: '#3b3a41' },
            900: { value: '#29282e' },
            950: { value: '#1b1a1e' },
          },
          stone: {
            50: { value: '#f7f4f6' },
            100: { value: '#ebe7e9' },
            200: { value: '#d8d3d7' },
            300: { value: '#bdb6ba' },
            400: { value: '#a49da2' },
            500: { value: '#867f84' },
            600: { value: '#6e686c' },
            700: { value: '#575255' },
            800: { value: '#3e3a3c' },
            900: { value: '#2b282a' },
            950: { value: '#1c1a1b' },
          },
          blue: {
            50: { value: '#f2f5ff' },
            100: { value: '#e0e8ff' },
            200: { value: '#c6d3ff' },
            300: { value: '#9eb5ff' },
            400: { value: '#7c98ff' },
            500: { value: '#5976ec' },
            600: { value: '#445ecc' },
            700: { value: '#3249a7' },
            800: { value: '#20327c' },
            900: { value: '#14235a' },
            950: { value: '#0b163e' },
          },
          green: {
            50: { value: '#dcffec' },
            100: { value: '#b5fbd7' },
            200: { value: '#8decbe' },
            300: { value: '#57d39b' },
            400: { value: '#07bd7e' },
            500: { value: '#009a65' },
            600: { value: '#007e51' },
            700: { value: '#00643e' },
            800: { value: '#00472a' },
            900: { value: '#00331c' },
            950: { value: '#002211' },
          },
          red: {
            50: { value: '#fff2f1' },
            100: { value: '#ffe0de' },
            200: { value: '#ffc4c1' },
            300: { value: '#ff9695' },
            400: { value: '#ff656c' },
            500: { value: '#e53349' },
            600: { value: '#c41136' },
            700: { value: '#9e0029' },
            800: { value: '#73001c' },
            900: { value: '#530012' },
            950: { value: '#3a000a' },
          },
          yellow: {
            50: { value: '#fff5d6' },
            100: { value: '#fee7a0' },
            200: { value: '#f3d270' },
            300: { value: '#ddb424' },
            400: { value: '#dcb000' },
            500: { value: '#daad00' },
            600: { value: '#a68300' },
            700: { value: '#685000' },
            800: { value: '#4a3800' },
            900: { value: '#352700' },
            950: { value: '#231900' },
          },
          orange: {
            50: { value: '#fff2ed' },
            100: { value: '#ffe1d5' },
            200: { value: '#ffc6b1' },
            300: { value: '#ff9a75' },
            400: { value: '#f9713c' },
            500: { value: '#d94d06' },
            600: { value: '#b53c00' },
            700: { value: '#912d00' },
            800: { value: '#691d00' },
            900: { value: '#4c1200' },
            950: { value: '#350900' },
          },
          pink: {
            50: { value: '#ffeffe' },
            100: { value: '#ffdbfe' },
            200: { value: '#ffb9ff' },
            300: { value: '#ec92ee' },
            400: { value: '#d773dc' },
            500: { value: '#b751be' },
            600: { value: '#9a3aa3' },
            700: { value: '#7c2984' },
            800: { value: '#5a1962' },
            900: { value: '#401046' },
            950: { value: '#2b0930' },
          },
          purple: {
            50: { value: '#f7f3ff' },
            100: { value: '#ede3ff' },
            200: { value: '#ddcaff' },
            300: { value: '#c7a4ff' },
            400: { value: '#b184f6' },
            500: { value: '#9364d8' },
            600: { value: '#7a4dba' },
            700: { value: '#603a97' },
            800: { value: '#452771' },
            900: { value: '#301a51' },
            950: { value: '#1f1038' },
          },
          brown: {
            50: { value: '#fff2ee' },
            100: { value: '#ffe1d8' },
            200: { value: '#ffc6b5' },
            300: { value: '#fa9c83' },
            400: { value: '#e67f64' },
            500: { value: '#c75e44' },
            600: { value: '#a94731' },
            700: { value: '#893522' },
            800: { value: '#652215' },
            900: { value: '#48170d' },
            950: { value: '#310d07' },
          },
          cyan: {
            50: { value: '#e9f8ff' },
            100: { value: '#cbefff' },
            200: { value: '#99e1ff' },
            300: { value: '#1ecaff' },
            400: { value: '#00b0df' },
            500: { value: '#008fb5' },
            600: { value: '#007695' },
            700: { value: '#005d75' },
            800: { value: '#004254' },
            900: { value: '#002e3c' },
            950: { value: '#001f28' },
          },
          emerald: {
            50: { value: '#d9fff5' },
            100: { value: '#aafbe7' },
            200: { value: '#7aedd3' },
            300: { value: '#2cd5b5' },
            400: { value: '#00ba9c' },
            500: { value: '#00987e' },
            600: { value: '#007c66' },
            700: { value: '#006250' },
            800: { value: '#004638' },
            900: { value: '#003227' },
            950: { value: '#002118' },
          },
          teal: {
            50: { value: '#d5fffd' },
            100: { value: '#a3fbf7' },
            200: { value: '#6fede7' },
            300: { value: '#00d3cd' },
            400: { value: '#00b7b1' },
            500: { value: '#009590' },
            600: { value: '#007b75' },
            700: { value: '#00615c' },
            800: { value: '#004541' },
            900: { value: '#00312e' },
            950: { value: '#00201e' },
          },
          indigo: {
            50: { value: '#f2f4ff' },
            100: { value: '#e2e7ff' },
            200: { value: '#c9d2ff' },
            300: { value: '#a5b2ff' },
            400: { value: '#8695ff' },
            500: { value: '#6674e7' },
            600: { value: '#505cc7' },
            700: { value: '#3d47a3' },
            800: { value: '#293179' },
            900: { value: '#1b2258' },
            950: { value: '#10153d' },
          },
          rose: {
            50: { value: '#fff1f3' },
            100: { value: '#ffdfe3' },
            200: { value: '#ffc3cb' },
            300: { value: '#ff94a7' },
            400: { value: '#ff6087' },
            500: { value: '#e13169' },
            600: { value: '#c11055' },
            700: { value: '#9c0042' },
            800: { value: '#71002f' },
            900: { value: '#520021' },
            950: { value: '#380015' },
          },
          amber: {
            50: { value: '#fff3e4' },
            100: { value: '#ffe4c0' },
            200: { value: '#ffcb85' },
            300: { value: '#f3a731' },
            400: { value: '#f5a200' },
            500: { value: '#f29f00' },
            600: { value: '#b97700' },
            700: { value: '#744900' },
            800: { value: '#543300' },
            900: { value: '#3c2300' },
            950: { value: '#291600' },
          },
          lime: {
            50: { value: '#e1ffde' },
            100: { value: '#c7f8c1' },
            200: { value: '#a9e9a0' },
            300: { value: '#82cf75' },
            400: { value: '#61b850' },
            500: { value: '#3f9927' },
            600: { value: '#2a7f05' },
            700: { value: '#216400' },
            800: { value: '#174700' },
            900: { value: '#0f3200' },
            950: { value: '#082100' },
          },
          violet: {
            50: { value: '#f5f3ff' },
            100: { value: '#e8e4ff' },
            200: { value: '#d5ceff' },
            300: { value: '#b9abff' },
            400: { value: '#a18afe' },
            500: { value: '#836ae0' },
            600: { value: '#6b53c1' },
            700: { value: '#543f9e' },
            800: { value: '#3b2b75' },
            900: { value: '#291d55' },
            950: { value: '#1a123b' },
          },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.brand.700}', _dark: '{colors.catalist.brand.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.brand.100}', _dark: '{colors.catalist.brand.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.brand.200}', _dark: '{colors.catalist.brand.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.brand.300}', _dark: '{colors.catalist.brand.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.brand.600}', _dark: '{colors.catalist.brand.500}' },
          },
          focusRing: { value: '{colors.catalist.brand.500}' },
        },
        blue: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.blue.700}', _dark: '{colors.catalist.blue.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.blue.100}', _dark: '{colors.catalist.blue.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.blue.200}', _dark: '{colors.catalist.blue.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.blue.300}', _dark: '{colors.catalist.blue.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.blue.600}', _dark: '{colors.catalist.blue.500}' },
          },
          focusRing: { value: '{colors.catalist.blue.500}' },
        },
        green: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.green.700}', _dark: '{colors.catalist.green.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.green.100}', _dark: '{colors.catalist.green.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.green.200}', _dark: '{colors.catalist.green.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.green.300}', _dark: '{colors.catalist.green.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.green.600}', _dark: '{colors.catalist.green.500}' },
          },
          focusRing: { value: '{colors.catalist.green.500}' },
        },
        red: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.red.700}', _dark: '{colors.catalist.red.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.red.100}', _dark: '{colors.catalist.red.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.red.200}', _dark: '{colors.catalist.red.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.red.300}', _dark: '{colors.catalist.red.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.red.600}', _dark: '{colors.catalist.red.500}' },
          },
          focusRing: { value: '{colors.catalist.red.500}' },
        },
        yellow: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: {
              _light: '{colors.catalist.yellow.700}',
              _dark: '{colors.catalist.yellow.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.catalist.yellow.100}',
              _dark: '{colors.catalist.yellow.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.catalist.yellow.200}',
              _dark: '{colors.catalist.yellow.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.catalist.yellow.300}',
              _dark: '{colors.catalist.yellow.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.catalist.yellow.600}',
              _dark: '{colors.catalist.yellow.500}',
            },
          },
          focusRing: { value: '{colors.catalist.yellow.500}' },
        },
        orange: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: {
              _light: '{colors.catalist.orange.700}',
              _dark: '{colors.catalist.orange.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.catalist.orange.100}',
              _dark: '{colors.catalist.orange.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.catalist.orange.200}',
              _dark: '{colors.catalist.orange.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.catalist.orange.300}',
              _dark: '{colors.catalist.orange.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.catalist.orange.600}',
              _dark: '{colors.catalist.orange.500}',
            },
          },
          focusRing: { value: '{colors.catalist.orange.500}' },
        },
        pink: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.pink.700}', _dark: '{colors.catalist.pink.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.pink.100}', _dark: '{colors.catalist.pink.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.pink.200}', _dark: '{colors.catalist.pink.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.pink.300}', _dark: '{colors.catalist.pink.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.pink.600}', _dark: '{colors.catalist.pink.500}' },
          },
          focusRing: { value: '{colors.catalist.pink.500}' },
        },
        purple: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: {
              _light: '{colors.catalist.purple.700}',
              _dark: '{colors.catalist.purple.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.catalist.purple.100}',
              _dark: '{colors.catalist.purple.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.catalist.purple.200}',
              _dark: '{colors.catalist.purple.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.catalist.purple.300}',
              _dark: '{colors.catalist.purple.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.catalist.purple.600}',
              _dark: '{colors.catalist.purple.500}',
            },
          },
          focusRing: { value: '{colors.catalist.purple.500}' },
        },
        brown: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.brown.700}', _dark: '{colors.catalist.brown.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.brown.100}', _dark: '{colors.catalist.brown.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.brown.200}', _dark: '{colors.catalist.brown.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.brown.300}', _dark: '{colors.catalist.brown.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.brown.600}', _dark: '{colors.catalist.brown.500}' },
          },
          focusRing: { value: '{colors.catalist.brown.500}' },
        },
        cyan: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.cyan.700}', _dark: '{colors.catalist.cyan.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.cyan.100}', _dark: '{colors.catalist.cyan.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.cyan.200}', _dark: '{colors.catalist.cyan.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.cyan.300}', _dark: '{colors.catalist.cyan.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.cyan.600}', _dark: '{colors.catalist.cyan.500}' },
          },
          focusRing: { value: '{colors.catalist.cyan.500}' },
        },
        emerald: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: {
              _light: '{colors.catalist.emerald.700}',
              _dark: '{colors.catalist.emerald.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.catalist.emerald.100}',
              _dark: '{colors.catalist.emerald.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.catalist.emerald.200}',
              _dark: '{colors.catalist.emerald.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.catalist.emerald.300}',
              _dark: '{colors.catalist.emerald.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.catalist.emerald.600}',
              _dark: '{colors.catalist.emerald.500}',
            },
          },
          focusRing: { value: '{colors.catalist.emerald.500}' },
        },
        teal: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.teal.700}', _dark: '{colors.catalist.teal.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.teal.100}', _dark: '{colors.catalist.teal.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.teal.200}', _dark: '{colors.catalist.teal.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.teal.300}', _dark: '{colors.catalist.teal.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.teal.600}', _dark: '{colors.catalist.teal.500}' },
          },
          focusRing: { value: '{colors.catalist.teal.500}' },
        },
        indigo: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: {
              _light: '{colors.catalist.indigo.700}',
              _dark: '{colors.catalist.indigo.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.catalist.indigo.100}',
              _dark: '{colors.catalist.indigo.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.catalist.indigo.200}',
              _dark: '{colors.catalist.indigo.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.catalist.indigo.300}',
              _dark: '{colors.catalist.indigo.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.catalist.indigo.600}',
              _dark: '{colors.catalist.indigo.500}',
            },
          },
          focusRing: { value: '{colors.catalist.indigo.500}' },
        },
        rose: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.rose.700}', _dark: '{colors.catalist.rose.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.rose.100}', _dark: '{colors.catalist.rose.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.rose.200}', _dark: '{colors.catalist.rose.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.rose.300}', _dark: '{colors.catalist.rose.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.rose.600}', _dark: '{colors.catalist.rose.500}' },
          },
          focusRing: { value: '{colors.catalist.rose.500}' },
        },
        amber: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.amber.700}', _dark: '{colors.catalist.amber.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.amber.100}', _dark: '{colors.catalist.amber.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.amber.200}', _dark: '{colors.catalist.amber.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.amber.300}', _dark: '{colors.catalist.amber.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.amber.600}', _dark: '{colors.catalist.amber.500}' },
          },
          focusRing: { value: '{colors.catalist.amber.500}' },
        },
        lime: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: { _light: '{colors.catalist.lime.700}', _dark: '{colors.catalist.lime.300}' },
          },
          subtle: {
            value: { _light: '{colors.catalist.lime.100}', _dark: '{colors.catalist.lime.900}' },
          },
          muted: {
            value: { _light: '{colors.catalist.lime.200}', _dark: '{colors.catalist.lime.800}' },
          },
          emphasized: {
            value: { _light: '{colors.catalist.lime.300}', _dark: '{colors.catalist.lime.700}' },
          },
          solid: {
            value: { _light: '{colors.catalist.lime.600}', _dark: '{colors.catalist.lime.500}' },
          },
          focusRing: { value: '{colors.catalist.lime.500}' },
        },
        violet: {
          contrast: { value: '{colors.catalist.grey.0}' },
          fg: {
            value: {
              _light: '{colors.catalist.violet.700}',
              _dark: '{colors.catalist.violet.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.catalist.violet.100}',
              _dark: '{colors.catalist.violet.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.catalist.violet.200}',
              _dark: '{colors.catalist.violet.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.catalist.violet.300}',
              _dark: '{colors.catalist.violet.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.catalist.violet.600}',
              _dark: '{colors.catalist.violet.500}',
            },
          },
          focusRing: { value: '{colors.catalist.violet.500}' },
        },
      },
    },
  },
})

export const theme = createSystem(defaultConfig, config)
export const system = theme
