import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import SchoolRoute from './routes/school.route';
import BusRoute from './routes/bus.route';
import AdminRoute from './routes/admin.route';
import BoardRoute from './routes/board.route';
import AskedRoute from './routes/asked.route';
import ReportRoute from './routes/report.route';

validateEnv();

const app = new App([
  new AdminRoute(),
  new AskedRoute(),
  new AuthRoute(),
  new BoardRoute(),
  new BusRoute(),
  new IndexRoute(),
  new ReportRoute(),
  new SchoolRoute(),
]);

app.listen();
