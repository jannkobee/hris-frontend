# Frontend coding baseline

Apply these conventions to every new or edited frontend feature.

- Reuse the existing Vue 3 Composition API, TypeScript field definitions,
  BaseContainer navigation, shared form/table components, and Material Design
  icons before creating one-off alternatives.
- Put a module view under `src/views/Modules/` and keep API calls in the
  established API/service layer rather than embedding HTTP details in views.
- Navigation must declare both the permission and `planFeature` when a module
  is subscription-gated. Never use plan names (Basic/Enterprise) as RBAC
  permissions.
- Use tenant-scoped settings and existing route names/query conventions;
  preserve URLs and public component contracts unless a breaking change is
  explicitly intended.
- Provide loading, empty, error, and permission-denied states for data views.
  Run the production build after changes.
