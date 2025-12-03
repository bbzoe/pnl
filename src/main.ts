import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

let app;
try {
  app = mount(App, {
    target: document.getElementById('app')!,
  })
} catch (e) {
  console.error("Failed to mount app:", e);
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>Error</h1><pre>${e}</pre></div>`;
}

export default app
