import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import SchoolRoute from './routes/school.route';
import BusRoute from './routes/bus.route';
import AdminRoute from './routes/admin.route';
import BoardRoute from './routes/board.route';
import AskedRoute from './routes/asked.route';
import CommentRoute from './routes/comment.route';

validateEnv();

const app = new App([
  new IndexRoute(),
  new AuthRoute(),
  new SchoolRoute(),
  new BusRoute(),
  new AdminRoute(),
  new AskedRoute(),
  new BoardRoute(),
  new CommentRoute(),
]);

app.listen();
