var ROUTES_INDEX = {"name":"<root>","kind":"module","className":"AdminAppModule","children":[{"name":"AppRoutes","filename":"src/admin-app/app/app-routing.module.ts","module":"AppRoutingModule","children":[{"path":"","redirectTo":"app","pathMatch":"full"},{"path":"app","canActivate":["AuthGuard"],"loadChildren":"./layout/layout.module#LayoutModule","children":[{"kind":"module","children":[],"module":"LayoutModule"}]},{"path":"login","loadChildren":"./login/login.module#LoginModule","children":[{"kind":"module","children":[],"module":"LoginModule"}]},{"path":"error","component":"ErrorComponent"},{"path":"**","component":"ErrorComponent"}],"kind":"module"}]}