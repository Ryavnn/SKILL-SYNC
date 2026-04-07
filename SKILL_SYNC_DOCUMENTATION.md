# SkillSync: Advanced IT Freelance Marketplace Technical Documentation

## 1. Introduction
### System Name
**SkillSync**

### Purpose of the System
SkillSync is a high-performance, modular web platform designed to bridge the gap between specialized IT freelancers and clients. Unlike traditional marketplaces, SkillSync leverages AI to analyze project requirements and match them with the most suitable verified talent, while incorporating a unique peer-to-peer referral system.

### Target Users
*   **IT Freelancers**: Developers, architects, and technical specialists looking for high-quality projects.
*   **Clients/Businesses**: Companies or individuals seeking verified technical expertise.
*   **Administrators**: Platform operators who manage verification, disputes, and system health.

### Core Problem it Solves
The system addresses the fragmentation in the technical freelance market by providing:
1.  **Verification Trust**: Ensuring freelancers have the skills they claim.
2.  **Effortless Discovery**: Using AI to replace manual searching with intelligent matching.
3.  **Project Continuity**: Enabling freelancers to refer peers when they are unavailable, ensuring client projects keep moving.

---

## 2. System Overview
### High-Level Architecture
SkillSync is built using a **Layered Service-Oriented Architecture (SOA)**, separating the presentation, business logic, and data storage layers to ensure scalability and maintainability.

*   **Frontend**: A modern React-based application (Next.js/Vite) providing role-specific dashboards.
*   **Backend**: A Python (Flask)-powered RESTful API gateway coordinating multiple domain-driven services.
*   **Database**: PostgreSQL for robust relational data management.
*   **AI Engine**: Integrated Gemini API for natural language skill extraction and matching.
*   **Payments**: Integrated M-Pesa API for secure local and international transactions via Escrow.

### Technologies Used
| Component | Technology |
| :--- | :--- |
| **Frontend** | React, TailwindCSS, Vite/Next.js, Axios, React Query |
| **Backend** | Python, Flask, Flask-SQLAlchemy, Marshmallow |
| **Auth** | JWT (JSON Web Tokens), Bcrypt hashing |
| **Database** | PostgreSQL |
| **AI** | Gemini API (Generative AI) |
| **Payments** | M-Pesa STK Push / Callback Integration |
| **DevOps** | Environment variables, Modular Service structure |

---

## 3. System Architecture
### Pattern: MVC + Layered SOA
The backend follows a strict modular structure:
*   **Routes**: Defensive entry points for HTTP requests.
*   **Controllers**: Traffic controllers that validate input and format responses.
*   **Services**: The core business logic layer.
*   **Repositories / Models**: The data access layer (ORM).

### Architecture Diagram (Simplified)
```text
[ Client Browser ] <--- HTTP/REST ---> [ Flask API Gateway ]
                                                |
        +---------------------------------------+---------------------------------------+
        |                    |                  |                   |                   |
[ Auth Service ]    [ Project Service ] [ AI Match Engine ] [ Referral Engine ] [ Payment Engine ]
        |                    |                  |                   |                   |
        +---------------------------------------+---------------------------------------+
                                                |
                                      [ PostgreSQL Database ]
```

### Request-Response Lifecycle
1.  **Client Request**: Frontend sends a JSON request with a JWT in the `Authorization` header.
2.  **Middleware**: Backend verifies the JWT and checks role-based permissions.
3.  **Controller**: Extracts data, validates it using **Marshmallow Schemas**, and passes it to the Service.
4.  **Service**: Executes business logic (e.g., matching a project to freelancers via the AI engine).
5.  **Repository**: Interacts with the **PostgreSQL** database via SQLAlchemy.
6.  **Response**: The system returns a structured JSON response (e.g., `{"status": "success", "data": {...}}`).

---

## 4. User Roles & Permissions
| Role | Description | Permissions |
| :--- | :--- | :--- |
| **Client** | Project owners seeking talent. | Create projects, fund escrow, review proposals, manage contracts, release payments. |
| **Freelancer** | Technical service providers. | Create/Verify profiles, submit proposals, refer peers to projects, manage deliverables. |
| **Admin** | Platform overseers. | Verify freelancer credentials, manage users, resolve disputes, view platform analytics. |

---

## 5. Authentication & Authorization Flow
### Registration Process
Users register by providing their name, email, password, and selected role. Passwords are hashed using **Bcrypt** before storage.
### Login Process
1.  User posts credentials to `/api/auth/login`.
2.  Backend validates against DB.
3.  On success, a **JWT** is generated containing the user's `id` and `role`.
4.  Frontend stores the token (securely) for subsequent requests.
### Protected Routes
Protected routes are wrapped with `@jwt_required()`. Role-based access control (RBAC) ensures a Freelancer cannot access Client payment release endpoints.

---

## 6. Core Features & Modules

### 1. AI Matching System
*   **Purpose**: Automatically finds the best freelancers for a project description.
*   **Backend Endpoints**: `GET /api/projects/<id>/matches`
*   **Flow**:
    1.  Client posts a project with a text description.
    2.  AI Service sends the description to the LLM (Gemini).
    3.  LLM extracts specific technical skill tags.
    4.  System runs a **Weighted Matching Algorithm** against the freelancer pool.

### 2. Peer Referral Engine
*   **Purpose**: Allows freelancers to skip a project but refer it to a trusted peer.
*   **Flow**:
    1.  Freelancer declines an invitation.
    2.  System prompts for a peer referral (based on their personal trusted network).
    3.  Client receives a "Referred by [Name]" notification.

### 3. Payment & Escrow (M-Pesa)
*   **Purpose**: Securely handles project funds.
*   **Endpoints**: `/api/payments/mpesa/stk-push`, `/api/payments/mpesa/callback`
*   **Mechanism**:
    1.  Client initiates funding.
    2.  **STK Push** is sent to the client's phone.
    3.  **Callback** confirms payment.
    4.  Funds are held in **Escrow** until the client approves the milestone.

---

## 7. User Flows (Step-by-Step)

### A. Posting a Project & Finding Talent
1.  **Client** navigates to "Post Project" and enters details.
2.  **Frontend** sends POST to `/api/projects/`.
3.  **Backend** creates the project and triggers the **AI Match Engine**.
4.  **Client** views the "AI Matches" tab to see freelancers ranked by score.
5.  **Client** clicks "Invite" on a freelancer's profile.

### B. Payment Flow (Escrow)
1.  **Client** clicks "Fund Escrow" on an active contract.
2.  **Frontend** sends request with phone number to `/api/payments/mpesa/stk-push`.
3.  **M-Pesa** sends a prompt to the user's mobile device; user enters PIN.
4.  **M-Pesa API** sends a callback to SkillSync's `/api/payments/mpesa/callback`.
5.  **Backend** updates Payment status to `completed` and unlocks the project milestone.

---

## 8. API Documentation (Key Endpoints)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | None |
| `POST` | `/api/auth/login` | Log in and receive JWT | None |
| `POST` | `/api/projects/` | Create a new project | Client |
| `GET` | `/api/projects/<id>/matches` | Get AI-recommended freelancers | Client |
| `POST` | `/api/proposals/` | Submit a proposal for a project | Freelancer |
| `POST` | `/api/payments/mpesa/stk-push` | Initiate mobile payment | Client |
| `POST` | `/api/referrals/` | Refer a peer to a project | Freelancer |

---

## 9. Database Design
### Core Tables
*   **`users`**: Central registry for all accounts.
*   **`freelancer_profiles`**: Extended data for freelancers (bio, rate, verification status).
*   **`skills`**: Master list of technical skills.
*   **`projects`**: Project metadata and requirements.
*   **`contracts`**: Binding agreements between client and freelancer.
*   **`milestones`**: Break-down of work within a contract.
*   **`payments`**: Audit trail for M-Pesa transactions.

### Relationships
*   `User` (1) <-> (1) `FreelancerProfile`
*   `Project` (1) <-> (n) `Proposal`
*   `Contract` (1) <-> (n) `Milestone`
*   `Freelancer` (n) <-> (n) `Skill` (via junction table)

---

## 10. Frontend Structure
The frontend is built with a **component-driven** approach:
*   **`/pages`**: Top-level route components (Dashboard, Marketplace, Profile).
*   **`/components`**: Reusable UI elements (Buttons, Cards, Modals, Forms).
*   **`/services`**: A centralized **Axios wrapper** for all API communication.
*   **`/hooks`**: Custom React hooks for managing state and fetching data (React Query).

---

## 11. Backend Structure
The Flask project structure is highly organized:
```text
backend/
├── app/            # App factory and DB config
├── routes/         # HTTP Route definitions
├── controllers/    # Request handling logic
├── services/       # Core business workflows
├── models/         # SQLAlchemy DB models
├── repositories/   # Abstracted DB queries
├── schemas/        # Marshmallow validation
└── utils/          # Helper functions (Crypto, Time)
```

---

## 12. Key Algorithms / Logic
### AI Ranking Algorithm
The Score is calculated out of 1.0 (100%):
1.  **Skills (50%)**: Intersection of project skills vs. freelancer skills.
2.  **Experience (20%)**: Match between project difficulty and freelancer level (Junior/Mid/Senior).
3.  **Verification (20%)**: Heavy boost for verified credentials.
4.  **Keywords (10%)**: Natural language overlap in bio/description.

---

## 13. Error Handling & Edge Cases
*   **Backend**: Returns structured errors: `{"status": "error", "message": "Reason..."}`.
*   **Payment Failures**: Handles M-Pesa timeouts and insufficent balance via the callback listener.
*   **Unmatched Projects**: If no freelancers appear, the system allows the client to manually invite via Marketplace.

---

## 14. Security Considerations
*   **JWT Security**: Tokens are short-lived.
*   **SQL Injection**: Prevented by using the **SQLAlchemy ORM**.
*   **Data Protection**: Credentials and documents are stored in private paths or encrypted.
*   **Rate Limiting**: (Planned) To prevent brute-force attacks on login.

---

## 15. Current Limitations
*   **AI Speed**: Matching can take 1-2 seconds depending on LLM latency.
*   **Mock Verification**: Some credential verification flows require manual admin approval in the current build.
*   **Escrow Release**: Currently manual approval by client; automated release logic scheduled for post-v1.

---

## 16. Future Improvements
*   **Microservices**: Splitting the AI engine into an independent service.
*   **Real-time Messaging**: Upgrading from polling to **WebSockets**.
*   **Blockchain Verification**: Using decentralized IDs (DIDs) for skill verification.
*   **Mobile App**: Deploying dedicated iOS/Android clients using React Native.

---

## 17. User Guide: How to Use SkillSync

### 17.1 For Clients (Project Owners)

#### **Step 1: Posting a Project**
1.  Navigate to the **"Post Project"** page from your dashboard.
2.  **Title**: Enter a concise project name (e.g., "React Native E-commerce App").
3.  **Description**: Provide a detailed description. *Tip: Our AI works best when you mention specific deliverables and technical stacks.*
4.  **Budget & Timeline**: Set your minimum and maximum KSh budget and the expected completion date.
5.  **Skills**: Select relevant tags (e.g., "TypeScript", "Node.js").
6.  Click **"Submit & Find Matches"**.

#### **Step 2: Reviewing AI Matches**
1.  After posting, you will be redirected to the **"Matching Results"** page.
2.  Review the list of freelancers ranked by their **Match Score**.
3.  Click **"View Profile"** to see their bio, portfolio links, and verification status.
4.  Click **"Invite"** to notify a freelancer about your project.

#### **Step 3: Funding Escrow & Payments**
1.  Once a freelancer accepts and a contract is created, go to the **"Payments"** tab.
2.  Select **"Fund Escrow"** next to the active project.
3.  Enter your **M-Pesa Phone Number** (format: 07xxxxxxxx) and click **"Initiate Payment"**.
4.  Authenticate the transaction on your mobile device when prompted for your PIN.
5.  **Releasing Funds**: After the freelancer submits a milestone, review the work and click **"Approve & Release"** to transfer funds from Escrow to the freelancer.

---

### 17.2 For Freelancers (Technical Talent)

#### **Step 1: Professional Profile Setup**
1.  Go to **"Create Profile"** (or "Edit Profile" from the sidebar).
2.  **Bio**: Write a keyword-rich summary of your technical expertise.
3.  **Experience Level**: Select from Junior, Mid-Level, Senior, or Expert. This significantly impacts your AI match score.
4.  **Portfolio**: Add direct links to your **GitHub**, **LinkedIn**, or personal portfolio site.
5.  **Skills**: Select all technologies you are proficient in.

#### **Step 2: Skill Verification**
1.  Navigate to the **"Verification"** tab.
2.  Upload proofs of your skills (e.g., certifications, degree, or reference letters).
3.  Once uploaded, an Admin will review your documents. A verified badge (✅) increases your Match Score by **20%**.

#### **Step 3: Managing Project Invitations**
1.  View incoming requests in the **"Invitations"** tab.
2.  **Accept**: If interested, click accept to start the contract negotiation.
3.  **Refer a Peer**: If you are unavailable or the tech stack isn't a perfect fit, click **"Refer Peer"**. Select a trusted freelancer from your network to recommend them to the client.

---

### 17.3 For Administrators

#### **Step 1: Verifying Credentials**
1.  Access the **"Admin Dashboard"** and navigate to **"Verification Queue"**.
2.  Review pending documents uploaded by freelancers.
3.  Click **"Verify"** to award the verified badge or **"Reject"** with a reason if the evidence is insufficient.

#### **Step 2: Monitoring Analytics**
1.  Use the **"Analytics"** page to monitor:
    *   Total successful M-Pesa transactions.
    *   Active project volume.
    *   Average AI matching accuracy.
    *   User growth metrics for both Clients and Freelancers.
