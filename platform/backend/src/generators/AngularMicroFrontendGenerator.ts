import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

interface MicroFrontendConfig {
  name: string;
  port: number;
  isHost?: boolean;
  routes?: RouteConfig[];
  components?: ComponentConfig[];
}

interface RouteConfig {
  path: string;
  component: string;
}

interface ComponentConfig {
  name: string;
  template: string;
  hasForm?: boolean;
  styles?: string;
}

export class AngularMicroFrontendGenerator {

  async generateMicroFrontend(basePath: string, config: MicroFrontendConfig): Promise<void> {
    logger.info(`Generating Angular micro-frontend: ${config.name}`);

    const mfePath = path.join(basePath, config.name);
    const srcPath = path.join(mfePath, 'src');
    const appPath = path.join(srcPath, 'app');

    // Create directory structure
    await fs.ensureDir(appPath);
    await fs.ensureDir(path.join(appPath, 'components'));
    await fs.ensureDir(path.join(appPath, 'services'));
    await fs.ensureDir(path.join(srcPath, 'assets'));

    // Generate core files
    await this.generatePackageJson(mfePath, config);
    await this.generateTsConfig(mfePath);
    await this.generateAngularJson(mfePath, config);
    await this.generateWebpackConfig(mfePath, config);
    await this.generateIndexHtml(srcPath, config);
    await this.generateMainTs(srcPath);
    await this.generateStylesCss(srcPath);

    // Generate app files
    await this.generateAppComponent(appPath, config);
    await this.generateAppModule(appPath, config);
    await this.generateAppRoutes(appPath, config);

    // Generate services
    await this.generateApiService(appPath);
    if (config.isHost) {
      await this.generateAuthService(appPath);
    }

    // Generate components
    if (config.components && config.components.length > 0) {
      logger.info(`Generating ${config.components.length} components for ${config.name}`);
      for (const component of config.components) {
        logger.info(`  - Generating component: ${component.name}`);
        await this.generateComponent(appPath, component);
      }
    } else {
      logger.warn(`No components to generate for ${config.name}`);
    }

    // Generate Dockerfile
    await this.generateDockerfile(mfePath);
    await this.generateNginxConfig(mfePath);

    logger.info(`Micro-frontend ${config.name} generated successfully`);
  }

  private async generatePackageJson(mfePath: string, config: MicroFrontendConfig): Promise<void> {
    const packageJson = {
      name: config.name,
      version: '1.0.0',
      scripts: {
        ng: 'ng',
        start: `ng serve --port ${config.port}`,
        build: 'ng build',
        watch: 'ng build --watch',
        test: 'ng test',
        lint: 'ng lint'
      },
      private: true,
      dependencies: {
        '@angular/animations': '^18.0.0',
        '@angular/common': '^18.0.0',
        '@angular/compiler': '^18.0.0',
        '@angular/core': '^18.0.0',
        '@angular/forms': '^18.0.0',
        '@angular/platform-browser': '^18.0.0',
        '@angular/platform-browser-dynamic': '^18.0.0',
        '@angular/router': '^18.0.0',
        'rxjs': '~7.8.0',
        'tslib': '^2.3.0',
        'zone.js': '~0.14.3'
      },
      devDependencies: {
        '@angular-devkit/build-angular': '^18.0.0',
        '@angular/cli': '^18.0.0',
        '@angular/compiler-cli': '^18.0.0',
        '@types/node': '^20.0.0',
        'typescript': '~5.4.0',
        '@module-federation/enhanced': '^0.2.0'
      }
    };

    await fs.writeJson(path.join(mfePath, 'package.json'), packageJson, { spaces: 2 });
  }

  private async generateTsConfig(mfePath: string): Promise<void> {
    const tsConfig = {
      compileOnSave: false,
      compilerOptions: {
        outDir: './dist/out-tsc',
        forceConsistentCasingInFileNames: true,
        strict: true,
        noImplicitOverride: true,
        noPropertyAccessFromIndexSignature: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        skipLibCheck: true,
        esModuleInterop: true,
        sourceMap: true,
        declaration: false,
        experimentalDecorators: true,
        moduleResolution: 'node',
        importHelpers: true,
        target: 'ES2022',
        module: 'ES2022',
        useDefineForClassFields: false,
        lib: ['ES2022', 'dom']
      },
      angularCompilerOptions: {
        enableI18nLegacyMessageIdFormat: false,
        strictInjectionParameters: true,
        strictInputAccessModifiers: true,
        strictTemplates: true
      }
    };

    await fs.writeJson(path.join(mfePath, 'tsconfig.json'), tsConfig, { spaces: 2 });
  }

  private async generateAngularJson(mfePath: string, config: MicroFrontendConfig): Promise<void> {
    const angularJson = {
      $schema: './node_modules/@angular/cli/lib/config/schema.json',
      version: 1,
      newProjectRoot: 'projects',
      projects: {
        [config.name]: {
          projectType: 'application',
          root: '',
          sourceRoot: 'src',
          prefix: 'app',
          architect: {
            build: {
              builder: '@angular-devkit/build-angular:browser',
              options: {
                outputPath: `dist/${config.name}`,
                index: 'src/index.html',
                main: 'src/main.ts',
                tsConfig: 'tsconfig.json',
                assets: ['src/assets'],
                styles: ['src/styles.css'],
                scripts: []
              }
            },
            serve: {
              builder: '@angular-devkit/build-angular:dev-server',
              options: {
                port: config.port
              }
            }
          }
        }
      }
    };

    await fs.writeJson(path.join(mfePath, 'angular.json'), angularJson, { spaces: 2 });
  }

  private async generateWebpackConfig(mfePath: string, config: MicroFrontendConfig): Promise<void> {
    const webpackConfig = `const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(path.join(__dirname, 'tsconfig.json'));

module.exports = {
  output: {
    uniqueName: "${config.name}",
    publicPath: "auto"
  },
  optimization: {
    runtimeChunk: false
  },
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
    }
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "${config.name}",
      filename: "remoteEntry.js",
      ${config.isHost ? `remotes: {
        "auth-mfe": "http://localhost:4201/remoteEntry.js",
        "dashboard-mfe": "http://localhost:4202/remoteEntry.js",
        "transfers-mfe": "http://localhost:4203/remoteEntry.js",
        "cards-mfe": "http://localhost:4204/remoteEntry.js",
      },` : `exposes: {
        './Module': './src/app/app.module.ts',
      },`}
      shared: {
        "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        ...sharedMappings.getDescriptors()
      }
    }),
    sharedMappings.getPlugin()
  ],
};`;

    await fs.writeFile(path.join(mfePath, 'webpack.config.js'), webpackConfig);
  }

  private async generateIndexHtml(srcPath: string, config: MicroFrontendConfig): Promise<void> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${config.name}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>`;

    await fs.writeFile(path.join(srcPath, 'index.html'), html);
  }

  private async generateMainTs(srcPath: string): Promise<void> {
    const mainTs = `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));`;

    await fs.writeFile(path.join(srcPath, 'main.ts'), mainTs);
  }

  private async generateStylesCss(srcPath: string): Promise<void> {
    const styles = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}`;

    await fs.writeFile(path.join(srcPath, 'styles.css'), styles);
  }

  private async generateAppComponent(appPath: string, config: MicroFrontendConfig): Promise<void> {
    const template = config.isHost ? `
<div class="app-container">
  <router-outlet></router-outlet>
</div>` : `
<div class="mfe-container">
  <h2>{{title}}</h2>
  <router-outlet></router-outlet>
</div>`;

    const styles = config.isHost ? `
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #1e40af;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-menu a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.nav-menu a:hover, .nav-menu a.active {
  background: rgba(255,255,255,0.2);
}

.app-content {
  flex: 1;
  padding: 2rem;
}` : `
.mfe-container {
  padding: 20px;
}`;

    const componentTs = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '${config.name}';
}`;

    await fs.writeFile(path.join(appPath, 'app.component.ts'), componentTs);
    await fs.writeFile(path.join(appPath, 'app.component.html'), template);
    await fs.writeFile(path.join(appPath, 'app.component.css'), styles);
  }

  private async generateAppModule(appPath: string, config: MicroFrontendConfig): Promise<void> {
    // Import all components
    const componentImports = (config.components || [])
      .map((comp: any) => {
        const componentPath = comp.name.toLowerCase();
        const componentName = comp.name + 'Component';
        return `import { ${componentName} } from './components/${componentPath}/${componentPath}.component';`;
      }).join('\n');

    const componentDeclarations = (config.components || [])
      .map((comp: any) => `    ${comp.name}Component`)
      .join(',\n');

    const moduleTs = `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
${componentImports}

@NgModule({
  declarations: [
    AppComponent${componentDeclarations ? ',\n' + componentDeclarations : ''}
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`;

    await fs.writeFile(path.join(appPath, 'app.module.ts'), moduleTs);
  }

  private async generateAppRoutes(appPath: string, config: MicroFrontendConfig): Promise<void> {
    let routesTs = '';

    if (config.isHost) {
      // Host shell: check if we have local components or remotes
      const componentImports = (config.routes || [])
        .filter((route: any) => route.component && !route.remote)
        .map((route: any) => {
          const componentName = route.component;
          const componentPath = componentName.replace('Component', '').toLowerCase();
          return `import { ${componentName} } from './components/${componentPath}/${componentPath}.component';`;
        }).join('\n');

      const localRoutes = (config.routes || [])
        .filter((route: any) => route.component && !route.remote)
        .map((route: any) =>
          `  { path: '${route.path.replace(/^\//, '')}', component: ${route.component} }`
        );

      const remoteRoutes = (config.routes || [])
        .filter((route: any) => route.remote)
        .map((route: any) => {
          return `  {
    path: '${route.path.replace(/^\//, '')}',
    loadChildren: () => import('${route.remote}/Module').then(m => m.RemoteEntryModule)
  }`;
        });

      const allRoutes = [...localRoutes, ...remoteRoutes].join(',\n');
      const defaultPath = localRoutes.length > 0 ?
        (config.routes || [])[0].path.replace(/^\//, '') : 'home';

      routesTs = `import { Routes } from '@angular/router';
${componentImports}

export const routes: Routes = [
  { path: '', redirectTo: '/${defaultPath}', pathMatch: 'full' },
${allRoutes || '  { path: \'home\', component: AppComponent }'},
  { path: '**', redirectTo: '/${defaultPath}' }
];`;
    } else {
      // Regular MFE or Shell with local components: define local routes
      const componentImports = (config.routes || [])
        .filter((route: any) => route.component && !route.remote)
        .map((route: any) => {
          const componentName = route.component;
          const componentPath = componentName.replace('Component', '').toLowerCase();
          return `import { ${componentName} } from './components/${componentPath}/${componentPath}.component';`;
        }).join('\n');

      const componentRoutes = (config.routes || [])
        .filter((route: any) => route.component && !route.remote)
        .map((route: any) =>
          `  { path: '${route.path.replace(/^\//, '')}', component: ${route.component} }`
        ).join(',\n');

      const defaultPath = config.routes && config.routes.length > 0 ?
        config.routes[0].path.replace(/^\//, '') : 'home';

      routesTs = `import { Routes } from '@angular/router';
${componentImports}

export const routes: Routes = [
  { path: '', redirectTo: '/${defaultPath}', pathMatch: 'full' },
${componentRoutes || '  { path: \'home\', component: AppComponent }'}
];`;
    }

    await fs.writeFile(path.join(appPath, 'app.routes.ts'), routesTs);
  }

  private async generateApiService(appPath: string): Promise<void> {
    const serviceTs = `import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(\`\${this.apiUrl}\${endpoint}\`, {
      headers: this.getHeaders()
    });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(\`\${this.apiUrl}\${endpoint}\`, data, {
      headers: this.getHeaders()
    });
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(\`\${this.apiUrl}\${endpoint}\`, data, {
      headers: this.getHeaders()
    });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(\`\${this.apiUrl}\${endpoint}\`, {
      headers: this.getHeaders()
    });
  }
}`;

    await fs.writeFile(path.join(appPath, 'services', 'api.service.ts'), serviceTs);
  }

  private async generateAuthService(appPath: string): Promise<void> {
    const serviceTs = `import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<any>(null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): void {
    // Implement login logic
    const user = { username, token: 'dummy-token' };
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }
}`;

    await fs.writeFile(path.join(appPath, 'services', 'auth.service.ts'), serviceTs);
  }

  private async generateComponent(appPath: string, component: ComponentConfig): Promise<void> {
    const componentDir = path.join(appPath, 'components', component.name.toLowerCase());
    await fs.ensureDir(componentDir);

    const componentTs = `import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-${component.name.toLowerCase()}',
  templateUrl: './${component.name.toLowerCase()}.component.html',
  styleUrls: ['./${component.name.toLowerCase()}.component.css']
})
export class ${component.name}Component implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
}`;

    const componentHtml = component.template || `<div class="${component.name.toLowerCase()}-container">
  <h2>${component.name}</h2>
  <p>${component.name} component works!</p>
</div>`;

    const componentCss = component.styles || `/* ${component.name} component styles */
.${component.name.toLowerCase()}-container {
  padding: 20px;
}`;

    await fs.writeFile(path.join(componentDir, `${component.name.toLowerCase()}.component.ts`), componentTs);
    await fs.writeFile(path.join(componentDir, `${component.name.toLowerCase()}.component.html`), componentHtml);
    await fs.writeFile(path.join(componentDir, `${component.name.toLowerCase()}.component.css`), componentCss);
  }

  private async generateDockerfile(mfePath: string): Promise<void> {
    const dockerfile = `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/* /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

    await fs.writeFile(path.join(mfePath, 'Dockerfile'), dockerfile);
  }

  private async generateNginxConfig(mfePath: string): Promise<void> {
    const nginxConf = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api-gateway:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`;

    await fs.writeFile(path.join(mfePath, 'nginx.conf'), nginxConf);
  }
}

export default new AngularMicroFrontendGenerator();
