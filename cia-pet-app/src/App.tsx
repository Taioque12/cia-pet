import {
  IonApp, IonRouterOutlet, IonSplitPane, IonSpinner, IonContent,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
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

function AdminRoute({ component: Component, session, loading, ...rest }: any) {
  if (loading) return null;
  return (
    <Route {...rest} render={() =>
      session ? <Component /> : <Redirect to="/login" />
    } />
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <IonApp>
        <IonContent className="ion-text-center">
          <IonSpinner style={{ marginTop: 80 }} />
        </IonContent>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main" when={session ? 'md' : 'false'}>
          {session && <Menu />}
          <IonRouterOutlet id="main">
            <Route path="/" exact component={Site} />
            <Route path="/login" exact render={() =>
              session ? <Redirect to="/dashboard" /> : <Login />
            } />
            <AdminRoute path="/dashboard" component={Dashboard} session={session} loading={loading} exact />
            <AdminRoute path="/agendamentos" component={Agendamentos} session={session} loading={loading} exact />
            <AdminRoute path="/pacientes" component={Pacientes} session={session} loading={loading} exact />
            <AdminRoute path="/pacientes/:petId/prontuarios" component={Prontuarios} session={session} loading={loading} exact />
            <AdminRoute path="/tutores" component={Tutores} session={session} loading={loading} exact />
            <AdminRoute path="/estoque" component={Estoque} session={session} loading={loading} exact />
            <AdminRoute path="/financeiro" component={Financeiro} session={session} loading={loading} exact />
            <Route render={() => <Redirect to={session ? '/dashboard' : '/'} />} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
}
