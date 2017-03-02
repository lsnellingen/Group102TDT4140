//Libs
import React from 'react';
import ReactDOM from 'react-dom';

// Bootstrap
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

// CSS
import './css/index.css';
import './css/App.css';

// Routes
import routes from './routes';

ReactDOM.render(
  <routes />,
  document.getElementById('root')
);
