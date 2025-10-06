import React, { useEffect, useState } from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'


import Landing from './components/Landing/Landing';
import Login from './components/Login/Login';
import Profile from './components/profile/profile'
import Cibil from './components/cibil/cibil'
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cibil" element={<Cibil />} />
      </Routes>
    </Router>
  )
}

export default App;