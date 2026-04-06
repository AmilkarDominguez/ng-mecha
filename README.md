# TraceSys

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Project Structure

```bash
src/app/
│
├── core/                        # Singleton services, guards, interceptors (lo que se carga una vez)
│   ├── auth/
│   │   ├── guards/              # auth.guard.ts, public.guard.ts
│   │   ├── interceptors/        # jwt.interceptor.ts, error.interceptor.ts
│   │   └── services/            # auth.service.ts
│   └── models/                  # Interfaces globales (user.model.ts)
│
├── shared/                      # Componentes, pipes y directives reutilizables
│   ├── components/              # Botones, inputs, tablas genéricas
│   ├── directives/
│   └── pipes/
│
├── layouts/                     # Estructuras visuales (esqueletos)
│   ├── admin-layout/            # Sidebar + Navbar + Content
│   └── auth-layout/             # Centrado para Login/Register
│
├── features/                    # Módulos lógicos del negocio
│   ├── auth/
│   │   ├── login/               # login.component.ts (Standalone)
│   │   └── register/
│   │
│   ├── dashboard/               # Página principal del panel
│   │   ├── components/          # Componentes específicos del dashboard (stats-card, chart)
│   │   └── dashboard.component.ts
│   │
│   └── users/                   # Ejemplo de otra funcionalidad
│       ├── user-list/
│       └── user-detail/
│
└── app.routes.ts                # Definición de rutas (usando lazy loading)
```
