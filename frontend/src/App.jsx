import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Overview from './pages/Overview'
import Portfolio from './pages/Portfolio'
import CompanySheet from './pages/CompanySheet'
import PredictionsLab from './pages/PredictionsLab'
import FundAnalytics from './pages/FundAnalytics'
import SurvivalAnalysis from './pages/SurvivalAnalysis'
import Explainability from './pages/Explainability'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<CompanySheet />} />
        <Route path="/predictions" element={<PredictionsLab />} />
        <Route path="/fund-analytics" element={<FundAnalytics />} />
        <Route path="/survival" element={<SurvivalAnalysis />} />
        <Route path="/explainability" element={<Explainability />} />
      </Routes>
    </Layout>
  )
}
