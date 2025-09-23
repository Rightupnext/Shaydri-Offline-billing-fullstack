import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { HashRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux' // ✅ Correct import
import { store } from './store/store' // ✅ Make sure this path is correct
import 'antd/dist/reset.css' // ✅ Ant Design styles
import '@ant-design/v5-patch-for-react-19'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  </StrictMode>
)
