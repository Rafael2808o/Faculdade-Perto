import { lazy,Suspense } from 'react';
import { Routes,Route } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout.jsx';

const page = (loader,name) => lazy(() => loader().then((module) => ({ default:module[name] })));
const HomePage=page(()=>import('./pages/HomePage.jsx'),'HomePage');
const SearchPage=page(()=>import('./pages/SearchPage.jsx'),'SearchPage');
const InstitutionPage=page(()=>import('./pages/InstitutionPage.jsx'),'InstitutionPage');
const RecordPage=page(()=>import('./pages/RecordPage.jsx'),'RecordPage');
const FaqPage=page(()=>import('./pages/FaqPage.jsx'),'FaqPage');
const ContactPage=page(()=>import('./pages/ContactPage.jsx'),'ContactPage');
const CorrectionPage=page(()=>import('./pages/CorrectionPage.jsx'),'CorrectionPage');
const ThanksPage=page(()=>import('./pages/ThanksPage.jsx'),'ThanksPage');
const EnemPage=page(()=>import('./pages/EnemPage.jsx'),'EnemPage');
const CityPage=page(()=>import('./pages/CityPage.jsx'),'CityPage');
const NotFoundPage=page(()=>import('./pages/NotFoundPage.jsx'),'NotFoundPage');
const AuthPage=page(()=>import('./pages/AuthPage.jsx'),'AuthPage');
const PlanPage=page(()=>import('./pages/PlanPage.jsx'),'PlanPage');
const ComparePage=page(()=>import('./pages/ComparePage.jsx'),'ComparePage');
const AdminPage=page(()=>import('./pages/AdminPage.jsx'),'AdminPage');
const PrivacyPage=page(()=>import('./pages/PrivacyPage.jsx'),'PrivacyPage');
const TermsPage=page(()=>import('./pages/TermsPage.jsx'),'TermsPage');

export function App(){return <Suspense fallback={<main className="section compact-section" aria-live="polite"><div className="skeleton"/><span className="sr-only">Carregando página…</span></main>}><Routes><Route element={<SiteLayout/>}>
  <Route index element={<HomePage/>}/><Route path="buscar" element={<SearchPage/>}/>
  <Route path="instituicoes/:slug" element={<InstitutionPage/>}/><Route path="ofertas/:id" element={<RecordPage/>}/>
  <Route path="br/:uf/:city" element={<CityPage/>}/><Route path="duvidas" element={<FaqPage/>}/>
  <Route path="contato" element={<ContactPage/>}/><Route path="corrigir" element={<CorrectionPage/>}/>
  <Route path="enem" element={<EnemPage/>}/><Route path="entrar" element={<AuthPage/>}/><Route path="meu-plano" element={<PlanPage/>}/>
  <Route path="comparar" element={<ComparePage/>}/><Route path="admin/correcoes" element={<AdminPage/>}/>
  <Route path="privacidade" element={<PrivacyPage/>}/><Route path="termos" element={<TermsPage/>}/>
  <Route path="obrigado" element={<ThanksPage/>}/><Route path="*" element={<NotFoundPage/>}/>
</Route></Routes></Suspense>}
