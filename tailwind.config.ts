import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          base:  '#EDE8DF',
          card:  '#E5DFD5',
          modal: '#F0EBE1',
          deep:  '#D6D0C7',
        },
        dark: '#0D0D0D',
        green: {
          DEFAULT: '#1D9E75',
          light:   '#25c48a',
          dim:     'rgba(29,158,117,0.12)',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        'card-lg': '18px',
        hero: '20px',
      },
    },
  },
  plugins: [],
}
export default config
