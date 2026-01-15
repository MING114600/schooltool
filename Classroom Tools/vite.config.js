import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 重要：請將 'your-repo-name' 改成您在 GitHub 上建立的儲存庫名稱 (Repository Name)
  // 例如：如果您的網址是 https://username.github.io/my-classroom/
  // 這裡就要填 '/my-classroom/'
  base: '/schooltool/', 

})
