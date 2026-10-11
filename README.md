# La Libertad Avanza · Almirante Brown (Web Oficial)

Plataforma oficial y red territorial de **La Libertad Avanza Almirante Brown**, coordinada por el Concejal y Jefe de Bloque **Juan Pedro Aquino**.

Desarrollada con **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Node.js** y **PostgreSQL**, completamente dockerizada y lista para producción en una **VM de Oracle Cloud Infrastructure (OCI)** con gestión de dominio y SSL a través de **Cloudflare** (`llabrown.com.ar`).

---

## 🏛️ Arquitectura del Sistema

```
[ Usuario en Internet / Redes ]
             │
             ▼ (HTTPS / DNS / WAF)
      [ CLOUDFLARE ]
      llabrown.com.ar
             │
             ▼ (Cloudflare Tunnel o Proxy HTTP)
[ VM Oracle Cloud (Ubuntu / Oracle Linux) ]
  ┌─────────────────────────────────────────────────────────┐
  │ DOCKER COMPOSE                                          │
  │                                                         │
  │  ┌──────────────────────┐     ┌───────────────────────┐ │
  │  │   llabrown-web       │────▶│   llabrown-postgres   │ │
  │  │   Next.js Standalone │     │   PostgreSQL 16       │ │
  │  │   (Puerto 3000)      │     │   (Puerto 5432)       │ │
  │  └──────────────────────┘     └───────────────────────┘ │
  │             ▲                              │            │
  │             │                              ▼            │
  │     [ /api/proyectos ]             [ Volumen Persistente│
  │     [ /api/visitas   ]               postgres_data ]    │
  │     [ /admin         ]                                  │
  └─────────────────────────────────────────────────────────┘
```

---

## 🚀 Funcionalidades Principales

### 1. Portal Público para Vecinos (`/`)
- **Hero & Identidad**: Lema **#Tu voz construye**, estadísticas del partido (12 Localidades, 8 Concejales, 4 Consejeros Escolares, 11 Circuitos Electorales).
- **Recorrido Interactivo (#TuVozConstruye)**: Experiencia visual interactiva localidad por localidad con modo automático/historia. Finaliza con la placa oficial de **Coordinación: Juan Pedro Aquino** y botones directos para compartir en WhatsApp o copiar texto para redes sociales.
- **Mapa Electoral Oficial (Justicia Electoral PBA)**: Cartografía vectorial de los 11 circuitos electorales de Almirante Brown (`0017` a `0022B`), conmutador de circuitos y localidades, y panel lateral con referente y proyectos vinculados.
- **Proyectos Legislativos HCD**: Proyectos de ordenanza presentados en el Concejo Deliberante, con filtros temáticos y persistencia en PostgreSQL.
- **Territorio & Recorridas**: Galería fotográfica con visor lightbox y reporte de visitas en los barrios.
- **Equipo de Bloque**: Concejales y Consejeros Escolares.
- **Sede Central y Contacto**: Sede Humberto Primo 990 (Burzaco), mapa interactivo, formulario Formspree y WhatsApp flotante.

### 2. Portal de Administración para Concejales (`/admin`)
- **Acceso Protegido**: Clave de acceso para concejales (`lla2025` o `brown2026`).
- **Gestión de Proyectos HCD**: Alta y baja de proyectos de ordenanza directamente en la base de datos PostgreSQL.
- **Gestión de Visitas Territoriales**: Carga de nuevas recorridas barriales con fotos, concejales y temas tratados.
- **Generador de Placas para Redes**: Editor para redactar mensajes barriales y generar la placa oficial de *#Tu voz construye* lista para Instagram y WhatsApp.

---

## 🐳 Despliegue con Docker y Docker Compose

### Requisitos en la VM de Oracle Cloud:
- Docker Engine y Docker Compose instalados.
- Git clonado con el repositorio.

### Paso 1: Configurar Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
Edita `.env` si deseas cambiar las contraseñas predeterminadas:
```env
PORT_BINDING=3000
POSTGRES_USER=lla_user
POSTGRES_PASSWORD=tu_password_segura_aqui
POSTGRES_DB=llabrown
DATABASE_URL=postgresql://lla_user:tu_password_segura_aqui@db:5432/llabrown
```

### Paso 2: Iniciar los Contenedores
```bash
docker compose up -d --build
```

Esto levantará automáticamente:
1. `llabrown-postgres`: Servidor PostgreSQL 16 con volumen persistente `postgres_data` y script `init-db.sql` precargado con los datos de Brown.
2. `llabrown-web`: Aplicación Next.js standalone compilada en contenedor seguro con usuario sin privilegios root.

### Paso 3: Verificar el Estado
```bash
docker compose ps
docker compose logs -f web
```
Para verificar la salud del sistema:
```bash
curl http://localhost:3000/api/health
```
Respuesta esperada: `{"status":"ok","database":"connected",...}`

---

## ☁️ Conexión con Oracle Cloud y Cloudflare

### Opción A (Recomendada): Cloudflare Tunnel (Sin abrir puertos en Oracle)
Esta es la opción más segura y moderna recomendada para Oracle Cloud:
1. En tu panel de **Cloudflare**, ve a **Zero Trust** > **Networks** > **Tunnels**.
2. Crea un túnel llamado `llabrown-tunnel`.
3. Cloudflare te dará un comando de instalación para Linux (ej: `curl -L --output cloudflared.deb ... && sudo dpkg -i ...`).
4. En la configuración del túnel en Cloudflare, añade un **Public Hostname**:
   - **Subdomain / Domain**: `llabrown.com.ar` (y `www.llabrown.com.ar`)
   - **Service Type**: `HTTP`
   - **URL**: `localhost:3000`
5. ¡Listo! Cloudflare enruta automáticamente el tráfico con SSL universal gratis, protección DDoS y CDN sin necesidad de tocar `iptables` ni abrir puertos en la VM.

### Opción B: Proxy Directo con Nube Naranja de Cloudflare
1. En el panel de **Oracle Cloud Infrastructure (OCI)**:
   - Ve a tu VCN > Security Lists de la subred pública.
   - Agrega Ingress Rules para el puerto `80` y `443` desde `0.0.0.0/0`.
2. En la VM de Oracle Cloud, abre el firewall del sistema operativo (Ubuntu bloquea puertos por defecto en iptables):
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
3. En `.env`, configura:
   ```env
   PORT_BINDING=80
   ```
   Y reinicia con `docker compose up -d`.
4. En **Cloudflare DNS**:
   - Registro `A`: `@` -> `IP_PUBLICA_DE_ORACLE` (Nube Naranja activa)
   - Registro `CNAME`: `www` -> `llabrown.com.ar` (Nube Naranja activa)
   - En **SSL/TLS** de Cloudflare, selecciona el modo **Flexible** o **Full**.

---

## 🛠️ Comandos Útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Detener los contenedores sin borrar datos
docker compose down

# Reiniciar la aplicación tras cambios de código
docker compose build web && docker compose up -d web

# Acceder a la consola de PostgreSQL
docker compose exec db psql -U lla_user -d llabrown

# Hacer backup de la base de datos
docker compose exec db pg_dump -U lla_user llabrown > backup_$(date +%F).sql
```
