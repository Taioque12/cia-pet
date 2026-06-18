import {
  IonApp, IonRouterOutlet, IonSplitPane, IonSpinner, IonContent,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { useAuth } from './auth';
import Menu from './components/Menu';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agendamentos from './pages/Agendamentos';
import Pacientes from './pages/Pacientes';
import Tutores from './pages/Tutores';
import Estoque from './pages/Estoque';
import Financeiro from './pages/Financeiro';

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

  if (!session) {
    return (
      <IonApp>
        <Login />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main">
          <Menu />
          <IonRouterOutlet id="main">
            <Route path="/dashboard" component={Dashboard} exact />
            <Route path="/agendamentos" component={Agendamentos} exact />
            <Route path="/pacientes" component={Pacientes} exact />
            <Route path="/tutores" component={Tutores} exact />
            <Route path="/estoque" component={Estoque} exact />
            <Route path="/financeiro" component={Financeiro} exact />
            <Route exact path="/">
              <Redirect to="/dashboard" />
            </Route>
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
}
