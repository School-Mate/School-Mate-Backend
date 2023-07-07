import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import SchoolRoute from './routes/school.route';
import BusRoute from './routes/bus.route';
import AdminRoute from './routes/admin.route';

validateEnv();

const app = new App([new IndexRoute(), new AuthRoute(), new SchoolRoute(), new BusRoute(), new AdminRoute()]);

app.listen();
