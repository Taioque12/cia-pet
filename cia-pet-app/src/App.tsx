import { IonApp, IonRouterOutlet, IonSplitPane, IonSpinner, IonContent } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import Menu from './components/Menu';
import Site from './pages/Site';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agendamentos from './pages/Agendamentos';
import Pacientes from './pages/Pacientes';
import Prontuarios from './pages/Prontuarios';
import Tutores from './pages/Tutores';
import Estoque from './pages/Estoque';
import Financeiro from './pages/Financeiro';
import Usuarios from './pages/Usuarios';

function AdminRoute({ component: Component, session, ...rest }: any) {
  return (
    <Route {...rest} render={() =>
      session ? <Component /> : <Redirect to="/login" />
    } />
  );
}

function AppContent() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const isSite = location.pathname === '/';
  const showSidebar = !!session && !isSite;

  if (loading) {
    return (
      <IonContent className="ion-text-center">
        <IonSpinner style={{ marginTop: 80 }} />
      </IonContent>
    );
  }

  return (
    <IonSplitPane contentId="main" when={showSidebar ? 'md' : 'false'}>
      {showSidebar && <Menu />}
      <IonRouterOutlet id="main">
        <Route path="/" exact component={Site} />
        <Route path="/login" exact render={() =>
          session ? <Redirect to="/dashboard" /> : <Login />
        } />
        <AdminRoute path="/dashboard" component={Dashboard} session={session} exact />
        <AdminRoute path="/agendamentos" component={Agendamentos} session={session} exact />
        <AdminRoute path="/pacientes" component={Pacientes} session={session} exact />
        <AdminRoute path="/pacientes/:petId/prontuarios" component={Prontuarios} session={session} exact />
        <AdminRoute path="/tutores" component={Tutores} session={session} exact />
        <AdminRoute path="/estoque" component={Estoque} session={session} exact />
        <AdminRoute path="/financeiro" component={Financeiro} session={session} exact />
        <AdminRoute path="/usuarios" component={Usuarios} session={session} exact />
        <Route render={() => <Redirect to={session ? '/dashboard' : '/'} />} />
      </IonRouterOutlet>
    </IonSplitPane>
  );
}

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <AppContent />
      </IonReactRouter>
    </IonApp>
  );
}
