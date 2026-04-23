# 🚀 Next.js Automatic Deployment Guide (Vercel + GitHub)

This guide outlines the professional DevOps setup for a production-ready Next.js application, ensuring high performance, security, and scalability.

---

## 1. GitHub Integration

### Connect Repository to Vercel
1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2.  **Import Project**: Click **"Add New"** > **"Project"**.
3.  **Select Repository**: Choose your GitHub repository from the list.
4.  **Configure Project**:
    *   **Framework Preset**: Select **"Next.js"**.
    *   **Root Directory**: Leave as `./` (unless your app is in a subdirectory).
    *   **Build & Output Settings**:
        *   **Build Command**: `next build` (auto-detected).
        *   **Output Directory**: `.next` (auto-detected).
        *   **Install Command**: `npm install` (auto-detected).

### Auto-Deployment Workflow
*   **Production**: Every push to the `main` branch triggers a production deployment.
*   **Previews**: Every push to any other branch or Pull Request triggers a **Preview Deployment**.
*   **Instant Rollbacks**: If a production deployment fails, you can instantly rollback to a previous successful deployment in the Vercel dashboard.

---

## 2. Environment Variables Setup

Vercel provides a secure way to manage secrets. **Never hardcode API keys.**

### Configuration Steps
1.  Go to your project in Vercel > **Settings** > **Environment Variables**.
2.  Add the following variables:
    *   `OPENAI_API_KEY`: Your OpenAI secret key.
    *   `GITHUB_TOKEN`: Your GitHub Personal Access Token.
    *   `DATABASE_URL`: Your database connection string.
3.  **Environment Scoping**:
    *   Assign variables to **Production**, **Preview**, and **Development** environments as needed.
    *   Use different database URLs for Production and Preview to avoid data corruption.

---

## 3. Domain & DNS Setup

### Default Domain
*   Vercel automatically assigns a domain like `project-name.vercel.app`.

### Custom Domain
1.  Go to **Settings** > **Domains**.
2.  Enter your domain (e.g., `example.com`).
3.  **DNS Configuration**:
    *   **A Record**: Point `@` to `76.76.21.21`.
    *   **CNAME Record**: Point `www` to `cname.vercel-dns.com`.
4.  Vercel will automatically provision an **SSL Certificate** (Let's Encrypt).

---

## 4. Dynamic Routing & API Routes

### Dynamic Routing (`/[username]`)
*   Next.js handles this natively via the `app/[username]/page.tsx` file structure.
*   **Optimization**: Use `generateStaticParams` for static generation of known paths to improve performance.

### API Routes (`/api/*`)
*   Files in `app/api/` or `pages/api/` are deployed as **Serverless Functions**.
*   **Performance**: Keep API functions small and focused. Use edge runtime (`export const runtime = 'edge'`) for low-latency global responses.

---

## 5. Performance Optimization

### Image Optimization
*   Use the `next/image` component for automatic resizing, lazy loading, and WebP conversion.
    ```tsx
    import Image from 'next/image';
    <Image src="/hero.png" width={800} height={400} alt="Hero" priority />
    ```

### Caching
*   **ISR (Incremental Static Regeneration)**: Update static content after deployment without a full rebuild.
    ```ts
    export const revalidate = 3600; // Revalidate every hour
    ```

### Bundle Minimization
*   Next.js automatically minifies JS/CSS and performs tree-shaking.
*   Use `next-bundle-analyzer` to identify large dependencies.

---

## 6. Error Handling & Logging

### Build Failures
*   Vercel provides detailed build logs in the **"Deployments"** tab.
*   Integrate with **Sentry** or **LogRocket** for real-time error tracking.

### Runtime Errors
*   Use **Error Boundaries** in React to catch component-level crashes.
*   Provide a `global-error.tsx` file in the `app` directory for top-level fallback UI.

---

## 7. Best Practices for Scaling

1.  **Edge Functions**: Use the Vercel Edge Network for logic that needs to run close to the user.
2.  **Database Connection Pooling**: Use tools like **Prisma Accelerate** or **Supabase** to handle high concurrent database connections.
3.  **CDN Caching**: Leverage Vercel's global CDN for static assets and cached API responses.
4.  **CI/CD Pipeline**: Use GitHub Actions for additional testing (linting, unit tests, E2E) before Vercel starts the deployment.

---

## 🚀 Rollback Strategy
If a production deployment is unstable:
1.  Go to the **"Deployments"** tab.
2.  Find the last successful deployment.
3.  Click the three dots (...) and select **"Promote to Production"**.
4.  The rollback is instant and does not require a rebuild.
