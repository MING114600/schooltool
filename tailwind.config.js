/** @type {import('tailwindcss').Config} */
export default {
  // 🚀 關鍵修正：必須開啟 class 模式，才能透過程式碼切換深色模式
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-subtle': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(4px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}