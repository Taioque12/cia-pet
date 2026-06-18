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

  // Não autenticado: site público + login
  if (!session) {
    return (
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route path="/" exact component={Site} />
            <Route path="/login" exact component={Login} />
            <Route render={() => <Redirect to="/" />} />
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    );
  }

  // Autenticado: site público + painel admin
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/" exact component={Site} />
          <Route render={() => (
            <IonSplitPane contentId="main">
              <Menu />
              <IonRouterOutlet id="main">
                <Route path="/dashboard" component={Dashboard} exact />
                <Route path="/agendamentos" component={Agendamentos} exact />
                <Route path="/pacientes" component={Pacientes} exact />
                <Route path="/pacientes/:petId/prontuarios" component={Prontuarios} exact />
                <Route path="/tutores" component={Tutores} exact />
                <Route path="/estoque" component={Estoque} exact />
                <Route path="/financeiro" component={Financeiro} exact />
                <Route path="/login" render={() => <Redirect to="/dashboard" />} exact />
                <Route render={() => <Redirect to="/dashboard" />} />
              </IonRouterOutlet>
            </IonSplitPane>
          )} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
