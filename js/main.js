import { BovedaApp } from './BovedaApp.js';

// Inicializar la aplicación y exponerla globalmente para que funcionen los eventos onclick en el HTML
const app = new BovedaApp();
window.app = app;