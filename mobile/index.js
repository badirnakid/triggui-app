import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent llama a AppRegistry.registerComponent('main', App)
// y asegura que la app corra en Expo Go y en un build nativo.
registerRootComponent(App);
