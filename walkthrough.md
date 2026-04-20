# E-Commerce Microservices Platform Walkthrough

## 🏆 Project Accomplishments

We have successfully built a full-stack, cloud-native E-Commerce platform using a **Microservices Architecture**. 

Here is what was accomplished:

1. **Back-end Microservices (Node.js/Express/MongoDB)**
   Created 15 independent, scalable backend services:
   - `user-service`, `authentication-service`, `product-service`, `search-service`
   - `inventory-service`, `cart-service`, `wishlist-service`, `order-service`
   - `payment-service`, `invoice-service`, `shipping-service`, `review-rating-service`
   - `recommendation-service`, `admin-service`, and an `api-gateway`.
   
   *Each service features its own [Dockerfile](file:///c:/Users/91901/OneDrive/Desktop/E-Commerce/ecommerce-microservices/frontend-ui/Dockerfile), independent `MongoDB` database setup, [package.json](file:///c:/Users/91901/OneDrive/Desktop/E-Commerce/ecommerce-microservices/frontend-ui/package.json), and API routes.*

2. **Frontend Applications (React + TailwindCSS)**
   Built a stunning, premium frontend UI (`frontend-ui`) utilizing modern glassmorphism design, vibrant gradients, and fluid micro-animations.
   - **Key Pages**: Home, Products Listing, Product Details, Cart, Wishlist, Order History, Admin Dashboard, and a Login Modal.
   - **State**: Handled via custom React Contexts (`AuthContext`, `CartContext`) interacting dynamically with the `api-gateway`.

3. **DevOps & Containerization (Docker + Kubernetes)**
   - Created a comprehensive [docker-compose.yml](file:///c:/Users/91901/OneDrive/Desktop/E-Commerce/ecommerce-microservices/docker-compose.yml) to orchestrate 16 containers (15 Node instances + 1 MongoDB replica).
   - Designed complete Kubernetes YAML manifests ([deployments.yaml](file:///c:/Users/91901/OneDrive/Desktop/E-Commerce/ecommerce-microservices/kubernetes/deployments/all-deployments.yaml), [services.yaml](file:///c:/Users/91901/OneDrive/Desktop/E-Commerce/ecommerce-microservices/kubernetes/services/all-services.yaml), [shopverse-config.yaml](file:///c:/Users/91901/OneDrive/Desktop/E-Commerce/ecommerce-microservices/kubernetes/configmaps/shopverse-config.yaml)).
   - Configured **ClusterIP** for secure internal microservice communication and **NodePort** to expose the frontend safely to the public.

## 🚀 How to Run It

### Option A: Via Docker Compose
```bash
cd ecommerce-microservices
docker-compose up --build
```
- Frontend: `http://localhost:80`
- API Gateway: `http://localhost:3000`

### Option B: Via Kubernetes (Minikube)
```bash
cd ecommerce-microservices
kubectl apply -f kubernetes/configmaps/shopverse-config.yaml
kubectl apply -f kubernetes/deployments/all-deployments.yaml
kubectl apply -f kubernetes/services/all-services.yaml
minikube service frontend-ui
```

## 🔒 Default Credentials
- **Admin Email:** `admin@example.com`
- **Password:** `123`

## 🎨 Visual Identity
The platform was styled using a custom `TailwindCSS` theme loaded with:
- Dark mode primary `bg-[#0f0f1a]` with bright pink/purple typography gradients.
- Glassmorphism effect (`backdrop-blur-xl`, `bg-white/5`).
- Fluid `animate-slide-up`, `animate-fade-in`, and scalable animations.





ArgoCD + Email Alerts — Walkthrough
Summary
Implemented ArgoCD continuous deployment and email alerting for the Clahan Store e-commerce microservices platform. Three new manifest files were created inside ecommerce-microservices/argocd/.

Files Created
1. argocd/application.yaml
Defines a single ArgoCD Application named clahanstore-microservices.
Watches the ecommerce-microservices/kubernetes directory on the main branch of the GitHub repo.
Uses directory.recurse: true to pick up all sub-directories (deployments, services, configmaps, hpa, ingress).
Auto-sync enabled with prune: true and selfHeal: true — any manual drift in the cluster is corrected automatically.
Notification annotations subscribe to on-sync-succeeded, on-sync-failed, and on-health-degraded triggers, sending emails to aknagasai2104@gmail.com.
2. argocd/notifications-secret.yaml
Kubernetes Secret storing Gmail SMTP credentials (email-username and email-password) used by argocd-notifications.
3. argocd/notifications-configmap.yaml
Configures the Gmail SMTP service (host: smtp.gmail.com, port: 465).
Defines 3 email templates:
app-sync-succeeded — ✅ success notification with revision info.
app-sync-failed — ❌ failure notification with error message.
app-health-degraded — ⚠️ health warning.
Defines 3 triggers that map ArgoCD application state changes to the corresponding templates.
How to Deploy
bash
# 1. Make sure ArgoCD is installed in the cluster
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
# 2. Apply the notifications secret & configmap
kubectl apply -f ecommerce-microservices/argocd/notifications-secret.yaml
kubectl apply -f ecommerce-microservices/argocd/notifications-configmap.yaml
# 3. Apply the ArgoCD Application
kubectl apply -f ecommerce-microservices/argocd/application.yaml
# 4. Verify
kubectl get applications -n argocd
What Was Tested
YAML syntax is valid for all three manifests.
Annotation keys follow the notifications.argoproj.io/subscribe.<trigger>.<service> convention.
Template variables ({{.app.metadata.name}}, etc.) use the correct ArgoCD notification engine syntax.
