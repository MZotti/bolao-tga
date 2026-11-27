import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

/**
 * Tema do bolão, inspirado na identidade visual do The Game Awards:
 * fundo preto, alto contraste, tipografia condensada em caixa alta
 * e um dourado "de premiação" como cor de destaque.
 *
 * Para ajustar o visual, mexa aqui: cores em `tokens.colors.gold` e
 * `semanticTokens`, fontes em `tokens.fonts`.
 */
const config = defineConfig({
  globalCss: {
    html: {
      // Paleta padrão de todos os componentes (Button, Badge, Spinner...)
      colorPalette: 'gold',
    },
    'html, body': {
      bg: 'bg',
      color: 'fg',
    },
    '::selection': {
      bg: 'gold.400',
      color: 'black',
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Oswald Variable', 'Arial Narrow', sans-serif" },
        body: { value: "'Inter Variable', system-ui, sans-serif" },
      },
      colors: {
        gold: {
          50: { value: '#FBF7E8' },
          100: { value: '#F5EBC6' },
          200: { value: '#ECD98F' },
          300: { value: '#E2C55E' },
          400: { value: '#D4AF37' },
          500: { value: '#B8952A' },
          600: { value: '#937521' },
          700: { value: '#6F581B' },
          800: { value: '#4D3D15' },
          900: { value: '#2E250E' },
          950: { value: '#1A1508' },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Tokens que os componentes usam com colorPalette="gold"
        gold: {
          solid: { value: '{colors.gold.400}' },
          contrast: { value: '#0A0A0A' },
          fg: { value: '{colors.gold.300}' },
          muted: { value: '{colors.gold.900}' },
          subtle: { value: '{colors.gold.950}' },
          emphasized: { value: '{colors.gold.800}' },
          focusRing: { value: '{colors.gold.400}' },
        },
        // Superfícies: preto profundo em vez do cinza-escuro padrão do Chakra
        bg: {
          DEFAULT: { value: { _dark: '#050505' } },
          subtle: { value: { _dark: '#0D0D0D' } },
          muted: { value: { _dark: '#151515' } },
          emphasized: { value: { _dark: '#1F1F1F' } },
          panel: { value: { _dark: '#0B0B0B' } },
        },
        border: {
          DEFAULT: { value: { _dark: '#262626' } },
          muted: { value: { _dark: '#1C1C1C' } },
          subtle: { value: { _dark: '#141414' } },
          emphasized: { value: { _dark: '#333333' } },
        },
        fg: {
          DEFAULT: { value: { _dark: '#F5F5F5' } },
          muted: { value: { _dark: '#A3A3A3' } },
          subtle: { value: { _dark: '#737373' } },
        },
      },
    },
    recipes: {
      // Títulos condensados em caixa alta, como no site do TGA
      heading: {
        base: {
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          fontWeight: '600',
          lineHeight: '1',
        },
      },
      // Botões retos, em caixa alta e com espaçamento entre letras
      button: {
        base: {
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: '600',
          borderRadius: 'sm',
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
