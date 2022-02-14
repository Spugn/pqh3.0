import React from 'react';
import ReactDOM from 'react-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Main from './pages/Main/Main';
import NotFound from './pages/NotFound/NotFound';
import { HashRouter, Route, Routes } from "react-router-dom";
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css'; // needed, otherwise page will look bad
import './index.css';
import './rc-input-number.css';

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/">
          <Route path="" element={<RouteMain />} />
          <Route path="*" element={<Route404 />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

function RouteMain() {
  const title = "Princess Connect! Re:Dive - Quest Helper | priconne-quest-helper";
  const description = "Quest Choosing Assistance and Project Management for the Game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）.";
  const image = "https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/public/logo128.png";
  const url = "https://spugn.github.io/priconne-quest-helper/";
  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{title}</title>
          <meta name="title" content={title} />
          <meta name="description" content={description} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={image} />
          <meta property="og:url" content={url} />
          <meta property="twitter:title" content={title} />
          <meta property="twitter:description" content={description} />
        </Helmet>
      </HelmetProvider>
      <Main />
    </>
  );
}

function Route404() {
  const title = "404 | priconne-quest-helper";
  const description = "Unknown Page | priconne-quest-helper";
  const image = "https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/public/logo128.png";
  const url = "https://spugn.github.io/priconne-quest-helper/";
  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{title}</title>
          <meta name="title" content={title} />
          <meta name="description" content={description} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={image} />
          <meta property="og:url" content={url} />
          <meta property="twitter:title" content={title} />
          <meta property="twitter:description" content={description} />
        </Helmet>
      </HelmetProvider>
      <NotFound />
    </>
  );
}