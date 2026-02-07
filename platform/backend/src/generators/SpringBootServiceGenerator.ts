import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

interface ServiceConfig {
  name: string;
  domain: string;
  port: number;
  entities: EntityConfig[];
}

interface EntityConfig {
  name: string;
  fields: FieldConfig[];
  relationships?: RelationshipConfig[];
}

interface FieldConfig {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  annotations?: string[];
}

interface RelationshipConfig {
  type: 'OneToMany' | 'ManyToOne' | 'ManyToMany' | 'OneToOne';
  targetEntity: string;
}

export class SpringBootServiceGenerator {

  async generateService(basePath: string, config: ServiceConfig): Promise<void> {
    logger.info(`Generating Spring Boot service: ${config.name}`, { basePath, domain: config.domain, port: config.port });

    const servicePath = path.join(basePath, config.name);
    const srcPath = path.join(servicePath, 'src/main/java/com/eurobank', config.domain);
    const resourcesPath = path.join(servicePath, 'src/main/resources');
    const testPath = path.join(servicePath, 'src/test/java/com/eurobank', config.domain);

    logger.info(`Paths created`, { servicePath, srcPath, resourcesPath });

    // Create directory structure
    await fs.ensureDir(path.join(srcPath, 'entity'));
    await fs.ensureDir(path.join(srcPath, 'repository'));
    await fs.ensureDir(path.join(srcPath, 'service'));
    await fs.ensureDir(path.join(srcPath, 'controller'));
    await fs.ensureDir(path.join(srcPath, 'dto'));
    await fs.ensureDir(path.join(srcPath, 'exception'));
    await fs.ensureDir(path.join(srcPath, 'config'));
    await fs.ensureDir(resourcesPath);
    await fs.ensureDir(testPath);

    // Generate files
    await this.generatePom(servicePath, config);
    await this.generateApplication(srcPath, config);
    await this.generateApplicationYml(resourcesPath, config);
    await this.generateDockerfile(servicePath, config);

    // Generate for each entity
    for (const entity of config.entities) {
      await this.generateEntity(srcPath, entity, config.domain);
      await this.generateRepository(srcPath, entity, config.domain);
      await this.generateEntityService(srcPath, entity, config.domain);
      await this.generateController(srcPath, entity, config.domain);
      await this.generateDTO(srcPath, entity, config.domain);
    }

    // Generate common files
    await this.generateExceptionHandler(srcPath, config.domain);
    await this.generateCorsConfig(srcPath, config.domain);
    await this.generateSecurityConfig(srcPath, config.domain);

    logger.info(`Service ${config.name} generated successfully`);
  }

  private async generatePom(servicePath: string, config: ServiceConfig): Promise<void> {
    const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.2</version>
        <relativePath/>
    </parent>

    <groupId>com.eurobank</groupId>
    <artifactId>${config.name}</artifactId>
    <version>1.0.0</version>
    <name>${config.name}</name>
    <description>${config.domain} microservice for EuroBank</description>

    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2023.0.0</spring-cloud.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- OpenAPI Documentation -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <finalName>${config.name}</finalName>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;

    await fs.writeFile(path.join(servicePath, 'pom.xml'), pomXml);
  }

  private async generateApplication(srcPath: string, config: ServiceConfig): Promise<void> {
    const className = config.name.split('-').map(s =>
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join('');

    const appClass = `package com.eurobank.${config.domain};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ${className}Application {
    public static void main(String[] args) {
        SpringApplication.run(${className}Application.class, args);
    }
}`;

    await fs.writeFile(path.join(srcPath, `${className}Application.java`), appClass);
  }

  private async generateApplicationYml(resourcesPath: string, config: ServiceConfig): Promise<void> {
    const yml = `spring:
  application:
    name: ${config.name}
  datasource:
    url: jdbc:postgresql://\${DB_HOST:localhost}:\${DB_PORT:${5431 + config.port - 8080}}/\${DB_NAME:${config.domain}_db}
    username: \${DB_USER:eurobank}
    password: \${DB_PASSWORD:eurobank123}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

server:
  port: \${PORT:${config.port}}

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always

logging:
  level:
    com.eurobank: INFO
    org.springframework: WARN
    org.hibernate: WARN`;

    await fs.writeFile(path.join(resourcesPath, 'application.yml'), yml);
  }

  private async generateEntity(srcPath: string, entity: EntityConfig, domain: string): Promise<void> {
    const fieldsCode = entity.fields.map(f => {
      const annotations = [];
      if (f.required) annotations.push('@NotNull');
      if (f.unique) annotations.push('@Column(unique = true)');

      return `    ${annotations.join('\n    ')}
    private ${f.type} ${f.name};`;
    }).join('\n\n');

    const entityClass = `package com.eurobank.${domain}.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "${entity.name.toLowerCase()}s")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ${entity.name} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

${fieldsCode}

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}`;

    await fs.writeFile(
      path.join(srcPath, 'entity', `${entity.name}.java`),
      entityClass
    );
  }

  private async generateRepository(srcPath: string, entity: EntityConfig, domain: string): Promise<void> {
    const repoClass = `package com.eurobank.${domain}.repository;

import com.eurobank.${domain}.entity.${entity.name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ${entity.name}Repository extends JpaRepository<${entity.name}, Long> {
    // Add custom query methods here
}`;

    await fs.writeFile(
      path.join(srcPath, 'repository', `${entity.name}Repository.java`),
      repoClass
    );
  }

  private async generateEntityService(srcPath: string, entity: EntityConfig, domain: string): Promise<void> {
    const serviceClass = `package com.eurobank.${domain}.service;

import com.eurobank.${domain}.entity.${entity.name};
import com.eurobank.${domain}.repository.${entity.name}Repository;
import com.eurobank.${domain}.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ${entity.name}Service {

    private final ${entity.name}Repository repository;

    public List<${entity.name}> findAll() {
        log.info("Finding all ${entity.name}s");
        return repository.findAll();
    }

    public ${entity.name} findById(Long id) {
        log.info("Finding ${entity.name} by id: {}", id);
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("${entity.name} not found with id: " + id));
    }

    public ${entity.name} create(${entity.name} entity) {
        log.info("Creating new ${entity.name}");
        return repository.save(entity);
    }

    public ${entity.name} update(Long id, ${entity.name} entity) {
        log.info("Updating ${entity.name} with id: {}", id);
        ${entity.name} existing = findById(id);
        // Update fields here
        return repository.save(existing);
    }

    public void delete(Long id) {
        log.info("Deleting ${entity.name} with id: {}", id);
        ${entity.name} entity = findById(id);
        repository.delete(entity);
    }
}`;

    await fs.writeFile(
      path.join(srcPath, 'service', `${entity.name}Service.java`),
      serviceClass
    );
  }

  private async generateController(srcPath: string, entity: EntityConfig, domain: string): Promise<void> {
    const controllerClass = `package com.eurobank.${domain}.controller;

import com.eurobank.${domain}.entity.${entity.name};
import com.eurobank.${domain}.service.${entity.name}Service;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/${entity.name.toLowerCase()}s")
@RequiredArgsConstructor
@Tag(name = "${entity.name}", description = "${entity.name} management APIs")
@CrossOrigin(origins = "*")
public class ${entity.name}Controller {

    private final ${entity.name}Service service;

    @GetMapping
    @Operation(summary = "Get all ${entity.name}s")
    public ResponseEntity<List<${entity.name}>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get ${entity.name} by ID")
    public ResponseEntity<${entity.name}> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create new ${entity.name}")
    public ResponseEntity<${entity.name}> create(@Valid @RequestBody ${entity.name} entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(entity));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update ${entity.name}")
    public ResponseEntity<${entity.name}> update(@PathVariable Long id, @Valid @RequestBody ${entity.name} entity) {
        return ResponseEntity.ok(service.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete ${entity.name}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}`;

    await fs.writeFile(
      path.join(srcPath, 'controller', `${entity.name}Controller.java`),
      controllerClass
    );
  }

  private async generateDTO(srcPath: string, entity: EntityConfig, domain: string): Promise<void> {
    const fieldsCode = entity.fields.map(f =>
      `    private ${f.type} ${f.name};`
    ).join('\n');

    const dtoClass = `package com.eurobank.${domain}.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ${entity.name}DTO {
${fieldsCode}
}`;

    await fs.writeFile(
      path.join(srcPath, 'dto', `${entity.name}DTO.java`),
      dtoClass
    );
  }

  private async generateExceptionHandler(srcPath: string, domain: string): Promise<void> {
    const exceptionClass = `package com.eurobank.${domain}.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}`;

    const handlerClass = `package com.eurobank.${domain}.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("message", "Internal server error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}`;

    await fs.writeFile(
      path.join(srcPath, 'exception', 'ResourceNotFoundException.java'),
      exceptionClass
    );
    await fs.writeFile(
      path.join(srcPath, 'exception', 'GlobalExceptionHandler.java'),
      handlerClass
    );
  }

  private async generateCorsConfig(srcPath: string, domain: string): Promise<void> {
    const configClass = `package com.eurobank.${domain}.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}`;

    await fs.writeFile(
      path.join(srcPath, 'config', 'CorsConfig.java'),
      configClass
    );
  }

  private async generateSecurityConfig(srcPath: string, domain: string): Promise<void> {
    const configClass = `package com.eurobank.${domain}.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**", "/swagger-ui/**", "/api-docs/**", "/actuator/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}`;

    await fs.writeFile(
      path.join(srcPath, 'config', 'SecurityConfig.java'),
      configClass
    );
  }

  private async generateDockerfile(servicePath: string, config: ServiceConfig): Promise<void> {
    const dockerfile = `FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/${config.name}.jar app.jar
EXPOSE ${config.port}
ENTRYPOINT ["java", "-jar", "app.jar"]`;

    await fs.writeFile(path.join(servicePath, 'Dockerfile'), dockerfile);
  }
}

export default new SpringBootServiceGenerator();
