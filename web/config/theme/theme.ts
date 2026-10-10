import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

export const PALETTE_NAME = 'cirqueira' as const

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
        cirqueira: {
          brand: {
            50: { value: '#d8fff6' },
            100: { value: '#a3fdea' },
            200: { value: '#7aedd5' },
            300: { value: '#45d3b7' },
            400: { value: '#00ba9c' },
            500: { value: '#00977d' },
            600: { value: '#007c64' },
            700: { value: '#00624e' },
            800: { value: '#004636' },
            900: { value: '#003225' },
            950: { value: '#002117' },
          },
          grey: {
            0: { value: '#ffffff' },
            25: { value: '#f9fbfb' },
            50: { value: '#f2f6f5' },
            100: { value: '#e4eae8' },
            200: { value: '#cfd7d5' },
            300: { value: '#b2bbb8' },
            400: { value: '#99a29f' },
            500: { value: '#7b8381' },
            600: { value: '#656c69' },
            700: { value: '#4f5553' },
            800: { value: '#383c3b' },
            900: { value: '#272a29' },
            950: { value: '#191b1a' },
          },
          stone: {
            50: { value: '#f2f6f7' },
            100: { value: '#e4e9eb' },
            200: { value: '#d0d6d8' },
            300: { value: '#b3babc' },
            400: { value: '#9ba1a3' },
            500: { value: '#7d8284' },
            600: { value: '#666b6c' },
            700: { value: '#505455' },
            800: { value: '#383b3c' },
            900: { value: '#27292a' },
            950: { value: '#191b1b' },
          },
          blue: {
            50: { value: '#ecf7ff' },
            100: { value: '#d4ecff' },
            200: { value: '#addcff' },
            300: { value: '#69c2ff' },
            400: { value: '#00aaf9' },
            500: { value: '#008aca' },
            600: { value: '#0071a6' },
            700: { value: '#005983' },
            800: { value: '#00405e' },
            900: { value: '#002d44' },
            950: { value: '#001d2e' },
          },
          green: {
            50: { value: '#dcffec' },
            100: { value: '#aafed3' },
            200: { value: '#85eebb' },
            300: { value: '#56d49a' },
            400: { value: '#2ebb80' },
            500: { value: '#009a63' },
            600: { value: '#007e50' },
            700: { value: '#00643d' },
            800: { value: '#01472a' },
            900: { value: '#04321c' },
            950: { value: '#022111' },
          },
          red: {
            50: { value: '#fff2ef' },
            100: { value: '#ffe0da' },
            200: { value: '#ffc5ba' },
            300: { value: '#ff9887' },
            400: { value: '#ff6855' },
            500: { value: '#da4737' },
            600: { value: '#b6372b' },
            700: { value: '#902b23' },
            800: { value: '#681d18' },
            900: { value: '#4a1410' },
            950: { value: '#330b09' },
          },
          yellow: {
            50: { value: '#fff8bc' },
            100: { value: '#f7eb92' },
            200: { value: '#e9d764' },
            300: { value: '#cfba22' },
            400: { value: '#ceb700' },
            500: { value: '#ccb414' },
            600: { value: '#9b8700' },
            700: { value: '#605300' },
            800: { value: '#453b00' },
            900: { value: '#312900' },
            950: { value: '#211a00' },
          },
          orange: {
            50: { value: '#fff3e5' },
            100: { value: '#ffe3c3' },
            200: { value: '#ffca8b' },
            300: { value: '#f9a31c' },
            400: { value: '#db8c00' },
            500: { value: '#b37100' },
            600: { value: '#935b00' },
            700: { value: '#754700' },
            800: { value: '#553200' },
            900: { value: '#3d2200' },
            950: { value: '#291500' },
          },
          pink: {
            50: { value: '#ffeffe' },
            100: { value: '#ffdbfe' },
            200: { value: '#febaff' },
            300: { value: '#ed91f1' },
            400: { value: '#d476d9' },
            500: { value: '#b059b7' },
            600: { value: '#914898' },
            700: { value: '#723878' },
            800: { value: '#522757' },
            900: { value: '#3a1b3e' },
            950: { value: '#27102a' },
          },
          purple: {
            50: { value: '#f4f4ff' },
            100: { value: '#e6e5ff' },
            200: { value: '#d1cfff' },
            300: { value: '#b1aeff' },
            400: { value: '#978ffb' },
            500: { value: '#7972d5' },
            600: { value: '#625cb2' },
            700: { value: '#4c498d' },
            800: { value: '#353366' },
            900: { value: '#252448' },
            950: { value: '#171732' },
          },
          brown: {
            50: { value: '#fff3e7' },
            100: { value: '#ffe3c7' },
            200: { value: '#ffc994' },
            300: { value: '#eca863' },
            400: { value: '#d48f45' },
            500: { value: '#b17129' },
            600: { value: '#935b1d' },
            700: { value: '#744718' },
            800: { value: '#54320f' },
            900: { value: '#3b230a' },
            950: { value: '#281605' },
          },
          cyan: {
            50: { value: '#d5ffff' },
            100: { value: '#90feff' },
            200: { value: '#4eeff1' },
            300: { value: '#00d2d4' },
            400: { value: '#00b7b7' },
            500: { value: '#009494' },
            600: { value: '#007a79' },
            700: { value: '#00605f' },
            800: { value: '#004543' },
            900: { value: '#00302f' },
            950: { value: '#00201f' },
          },
          emerald: {
            50: { value: '#dcffec' },
            100: { value: '#aafed3' },
            200: { value: '#85eebb' },
            300: { value: '#56d49a' },
            400: { value: '#2ebb80' },
            500: { value: '#009a63' },
            600: { value: '#007e50' },
            700: { value: '#00643d' },
            800: { value: '#01472a' },
            900: { value: '#04321c' },
            950: { value: '#022111' },
          },
          teal: {
            50: { value: '#d9fff4' },
            100: { value: '#9cffe6' },
            200: { value: '#6df0d2' },
            300: { value: '#28d5b4' },
            400: { value: '#00ba9b' },
            500: { value: '#00977d' },
            600: { value: '#007c65' },
            700: { value: '#00624f' },
            800: { value: '#004637' },
            900: { value: '#003126' },
            950: { value: '#002118' },
          },
          indigo: {
            50: { value: '#f0f5ff' },
            100: { value: '#dce9ff' },
            200: { value: '#bed6ff' },
            300: { value: '#90b9ff' },
            400: { value: '#649eff' },
            500: { value: '#4880d9' },
            600: { value: '#3868b4' },
            700: { value: '#2b528e' },
            800: { value: '#1c3a67' },
            900: { value: '#122949' },
            950: { value: '#091b32' },
          },
          rose: {
            50: { value: '#fff1f1' },
            100: { value: '#ffe0df' },
            200: { value: '#ffc4c4' },
            300: { value: '#ff969a' },
            400: { value: '#ff6474' },
            500: { value: '#da4359' },
            600: { value: '#b53348' },
            700: { value: '#8f2839' },
            800: { value: '#671b28' },
            900: { value: '#4a121c' },
            950: { value: '#330a11' },
          },
          amber: {
            50: { value: '#fff4dd' },
            100: { value: '#ffe5af' },
            200: { value: '#fece61' },
            300: { value: '#e6af1a' },
            400: { value: '#e5ab00' },
            500: { value: '#e2a90c' },
            600: { value: '#ac7e00' },
            700: { value: '#6c4d00' },
            800: { value: '#4e3600' },
            900: { value: '#372500' },
            950: { value: '#251800' },
          },
          lime: {
            50: { value: '#e2ffde' },
            100: { value: '#c1fbb9' },
            200: { value: '#a4eb99' },
            300: { value: '#82cf73' },
            400: { value: '#67b755' },
            500: { value: '#4c9639' },
            600: { value: '#3d7b2a' },
            700: { value: '#316120' },
            800: { value: '#224514' },
            900: { value: '#18300d' },
            950: { value: '#0e2006' },
          },
          violet: {
            50: { value: '#f2f4ff' },
            100: { value: '#e2e7ff' },
            200: { value: '#c9d2ff' },
            300: { value: '#a4b3ff' },
            400: { value: '#8595ff' },
            500: { value: '#6877d9' },
            600: { value: '#5361b5' },
            700: { value: '#414c8f' },
            800: { value: '#2d3667' },
            900: { value: '#1e2649' },
            950: { value: '#121833' },
          },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.brand.700}',
              _dark: '{colors.cirqueira.brand.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.brand.100}',
              _dark: '{colors.cirqueira.brand.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.brand.200}',
              _dark: '{colors.cirqueira.brand.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.brand.300}',
              _dark: '{colors.cirqueira.brand.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.brand.600}',
              _dark: '{colors.cirqueira.brand.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.brand.500}' },
        },
        blue: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: { _light: '{colors.cirqueira.blue.700}', _dark: '{colors.cirqueira.blue.300}' },
          },
          subtle: {
            value: { _light: '{colors.cirqueira.blue.100}', _dark: '{colors.cirqueira.blue.900}' },
          },
          muted: {
            value: { _light: '{colors.cirqueira.blue.200}', _dark: '{colors.cirqueira.blue.800}' },
          },
          emphasized: {
            value: { _light: '{colors.cirqueira.blue.300}', _dark: '{colors.cirqueira.blue.700}' },
          },
          solid: {
            value: { _light: '{colors.cirqueira.blue.600}', _dark: '{colors.cirqueira.blue.500}' },
          },
          focusRing: { value: '{colors.cirqueira.blue.500}' },
        },
        green: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.green.700}',
              _dark: '{colors.cirqueira.green.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.green.100}',
              _dark: '{colors.cirqueira.green.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.green.200}',
              _dark: '{colors.cirqueira.green.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.green.300}',
              _dark: '{colors.cirqueira.green.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.green.600}',
              _dark: '{colors.cirqueira.green.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.green.500}' },
        },
        red: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: { _light: '{colors.cirqueira.red.700}', _dark: '{colors.cirqueira.red.300}' },
          },
          subtle: {
            value: { _light: '{colors.cirqueira.red.100}', _dark: '{colors.cirqueira.red.900}' },
          },
          muted: {
            value: { _light: '{colors.cirqueira.red.200}', _dark: '{colors.cirqueira.red.800}' },
          },
          emphasized: {
            value: { _light: '{colors.cirqueira.red.300}', _dark: '{colors.cirqueira.red.700}' },
          },
          solid: {
            value: { _light: '{colors.cirqueira.red.600}', _dark: '{colors.cirqueira.red.500}' },
          },
          focusRing: { value: '{colors.cirqueira.red.500}' },
        },
        yellow: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.yellow.700}',
              _dark: '{colors.cirqueira.yellow.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.yellow.100}',
              _dark: '{colors.cirqueira.yellow.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.yellow.200}',
              _dark: '{colors.cirqueira.yellow.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.yellow.300}',
              _dark: '{colors.cirqueira.yellow.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.yellow.600}',
              _dark: '{colors.cirqueira.yellow.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.yellow.500}' },
        },
        orange: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.orange.700}',
              _dark: '{colors.cirqueira.orange.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.orange.100}',
              _dark: '{colors.cirqueira.orange.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.orange.200}',
              _dark: '{colors.cirqueira.orange.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.orange.300}',
              _dark: '{colors.cirqueira.orange.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.orange.600}',
              _dark: '{colors.cirqueira.orange.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.orange.500}' },
        },
        pink: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: { _light: '{colors.cirqueira.pink.700}', _dark: '{colors.cirqueira.pink.300}' },
          },
          subtle: {
            value: { _light: '{colors.cirqueira.pink.100}', _dark: '{colors.cirqueira.pink.900}' },
          },
          muted: {
            value: { _light: '{colors.cirqueira.pink.200}', _dark: '{colors.cirqueira.pink.800}' },
          },
          emphasized: {
            value: { _light: '{colors.cirqueira.pink.300}', _dark: '{colors.cirqueira.pink.700}' },
          },
          solid: {
            value: { _light: '{colors.cirqueira.pink.600}', _dark: '{colors.cirqueira.pink.500}' },
          },
          focusRing: { value: '{colors.cirqueira.pink.500}' },
        },
        purple: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.purple.700}',
              _dark: '{colors.cirqueira.purple.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.purple.100}',
              _dark: '{colors.cirqueira.purple.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.purple.200}',
              _dark: '{colors.cirqueira.purple.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.purple.300}',
              _dark: '{colors.cirqueira.purple.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.purple.600}',
              _dark: '{colors.cirqueira.purple.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.purple.500}' },
        },
        brown: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.brown.700}',
              _dark: '{colors.cirqueira.brown.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.brown.100}',
              _dark: '{colors.cirqueira.brown.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.brown.200}',
              _dark: '{colors.cirqueira.brown.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.brown.300}',
              _dark: '{colors.cirqueira.brown.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.brown.600}',
              _dark: '{colors.cirqueira.brown.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.brown.500}' },
        },
        cyan: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: { _light: '{colors.cirqueira.cyan.700}', _dark: '{colors.cirqueira.cyan.300}' },
          },
          subtle: {
            value: { _light: '{colors.cirqueira.cyan.100}', _dark: '{colors.cirqueira.cyan.900}' },
          },
          muted: {
            value: { _light: '{colors.cirqueira.cyan.200}', _dark: '{colors.cirqueira.cyan.800}' },
          },
          emphasized: {
            value: { _light: '{colors.cirqueira.cyan.300}', _dark: '{colors.cirqueira.cyan.700}' },
          },
          solid: {
            value: { _light: '{colors.cirqueira.cyan.600}', _dark: '{colors.cirqueira.cyan.500}' },
          },
          focusRing: { value: '{colors.cirqueira.cyan.500}' },
        },
        emerald: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.emerald.700}',
              _dark: '{colors.cirqueira.emerald.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.emerald.100}',
              _dark: '{colors.cirqueira.emerald.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.emerald.200}',
              _dark: '{colors.cirqueira.emerald.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.emerald.300}',
              _dark: '{colors.cirqueira.emerald.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.emerald.600}',
              _dark: '{colors.cirqueira.emerald.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.emerald.500}' },
        },
        teal: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: { _light: '{colors.cirqueira.teal.700}', _dark: '{colors.cirqueira.teal.300}' },
          },
          subtle: {
            value: { _light: '{colors.cirqueira.teal.100}', _dark: '{colors.cirqueira.teal.900}' },
          },
          muted: {
            value: { _light: '{colors.cirqueira.teal.200}', _dark: '{colors.cirqueira.teal.800}' },
          },
          emphasized: {
            value: { _light: '{colors.cirqueira.teal.300}', _dark: '{colors.cirqueira.teal.700}' },
          },
          solid: {
            value: { _light: '{colors.cirqueira.teal.600}', _dark: '{colors.cirqueira.teal.500}' },
          },
          focusRing: { value: '{colors.cirqueira.teal.500}' },
        },
        indigo: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.indigo.700}',
              _dark: '{colors.cirqueira.indigo.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.indigo.100}',
              _dark: '{colors.cirqueira.indigo.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.indigo.200}',
              _dark: '{colors.cirqueira.indigo.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.indigo.300}',
              _dark: '{colors.cirqueira.indigo.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.indigo.600}',
              _dark: '{colors.cirqueira.indigo.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.indigo.500}' },
        },
        rose: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: { _light: '{colors.cirqueira.rose.700}', _dark: '{colors.cirqueira.rose.300}' },
          },
          subtle: {
            value: { _light: '{colors.cirqueira.rose.100}', _dark: '{colors.cirqueira.rose.900}' },
          },
          muted: {
            value: { _light: '{colors.cirqueira.rose.200}', _dark: '{colors.cirqueira.rose.800}' },
          },
          emphasized: {
            value: { _light: '{colors.cirqueira.rose.300}', _dark: '{colors.cirqueira.rose.700}' },
          },
          solid: {
            value: { _light: '{colors.cirqueira.rose.600}', _dark: '{colors.cirqueira.rose.500}' },
          },
          focusRing: { value: '{colors.cirqueira.rose.500}' },
        },
        amber: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.amber.700}',
              _dark: '{colors.cirqueira.amber.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.amber.100}',
              _dark: '{colors.cirqueira.amber.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.amber.200}',
              _dark: '{colors.cirqueira.amber.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.amber.300}',
              _dark: '{colors.cirqueira.amber.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.amber.600}',
              _dark: '{colors.cirqueira.amber.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.amber.500}' },
        },
        lime: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: { _light: '{colors.cirqueira.lime.700}', _dark: '{colors.cirqueira.lime.300}' },
          },
          subtle: {
            value: { _light: '{colors.cirqueira.lime.100}', _dark: '{colors.cirqueira.lime.900}' },
          },
          muted: {
            value: { _light: '{colors.cirqueira.lime.200}', _dark: '{colors.cirqueira.lime.800}' },
          },
          emphasized: {
            value: { _light: '{colors.cirqueira.lime.300}', _dark: '{colors.cirqueira.lime.700}' },
          },
          solid: {
            value: { _light: '{colors.cirqueira.lime.600}', _dark: '{colors.cirqueira.lime.500}' },
          },
          focusRing: { value: '{colors.cirqueira.lime.500}' },
        },
        violet: {
          contrast: { value: '{colors.cirqueira.grey.0}' },
          fg: {
            value: {
              _light: '{colors.cirqueira.violet.700}',
              _dark: '{colors.cirqueira.violet.300}',
            },
          },
          subtle: {
            value: {
              _light: '{colors.cirqueira.violet.100}',
              _dark: '{colors.cirqueira.violet.900}',
            },
          },
          muted: {
            value: {
              _light: '{colors.cirqueira.violet.200}',
              _dark: '{colors.cirqueira.violet.800}',
            },
          },
          emphasized: {
            value: {
              _light: '{colors.cirqueira.violet.300}',
              _dark: '{colors.cirqueira.violet.700}',
            },
          },
          solid: {
            value: {
              _light: '{colors.cirqueira.violet.600}',
              _dark: '{colors.cirqueira.violet.500}',
            },
          },
          focusRing: { value: '{colors.cirqueira.violet.500}' },
        },
      },
    },
  },
})

export const theme = createSystem(defaultConfig, config)
export const system = theme
