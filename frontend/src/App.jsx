import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

// Freelancer pages
import FreelancerDashboard from './pages/freelancer/Dashboard'
import FreelancerProfile from './pages/freelancer/Profile'
import FreelancerCreateProfile from './pages/freelancer/CreateProfile'
import FreelancerProfileView from './pages/freelancer/ProfileView'
import FreelancerProjects from './pages/freelancer/Projects'
import FreelancerBrowseProjects from './pages/freelancer/BrowseProjects'
import FreelancerProjectView from './pages/freelancer/ProjectView'
import FreelancerReferrals from './pages/freelancer/Referrals'
import FreelancerEarnings from './pages/freelancer/Earnings'
import FreelancerMessages from './pages/freelancer/Messages'
import FreelancerInvitations from './pages/freelancer/Invitations'

// Client pages
import ClientDashboard from './pages/client/Dashboard'
import ClientPostProject from './pages/client/PostProject'
import ClientMyProjects from './pages/client/MyProjects'
import ClientFindFreelancers from './pages/client/FindFreelancers'
import ClientMatchingResults from './pages/client/MatchingResults'
import ClientContracts from './pages/client/Contracts'
import ClientPayments from './pages/client/Payments'
import ClientMessages from './pages/client/Messages'
import ClientProjectView from './pages/client/ProjectView'
import ClientCreateContract from './pages/client/CreateContract'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminVerification from './pages/admin/Verification'
import AdminDisputes from './pages/admin/Disputes'
import AdminAnalytics from './pages/admin/Analytics'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'
import PublicLayout from './layouts/PublicLayout'

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <div className="bg-mesh" />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<ClientFindFreelancers />} />
        </Route>

        {/* Freelancer Routes */}
        <Route
          path="/freelancer/*"
          element={<DashboardLayout role="freelancer" />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FreelancerDashboard />} />
          <Route path="profile" element={<FreelancerProfile />} />
          <Route path="create-profile" element={<FreelancerCreateProfile />} />
          <Route path="profile/:id" element={<FreelancerProfileView />} />
          <Route path="projects" element={<FreelancerProjects />} />
          <Route path="projects/:id" element={<FreelancerProjectView />} />
          <Route path="marketplace-projects/:id" element={<FreelancerProjectView />} />
          <Route path="browse-projects" element={<FreelancerBrowseProjects />} />
          <Route path="invitations" element={<FreelancerInvitations />} />
          <Route path="referrals" element={<FreelancerReferrals />} />
          <Route path="earnings" element={<FreelancerEarnings />} />
          <Route path="messages" element={<FreelancerMessages />} />
        </Route>

        {/* Client Routes */}
        <Route
          path="/client/*"
          element={<DashboardLayout role="client" />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="projects" element={<ClientMyProjects />} />
          <Route path="projects/:id" element={<ClientProjectView />} />
          <Route path="post-project" element={<ClientPostProject />} />
          <Route path="freelancers" element={<ClientFindFreelancers />} />
          <Route path="freelancer/:id" element={<FreelancerProfileView />} />
          <Route path="matching-results" element={<ClientMatchingResults />} />
          <Route path="contracts" element={<ClientContracts />} />
          <Route path="contracts/create" element={<ClientCreateContract />} />
          <Route path="payments" element={<ClientPayments />} />
          <Route path="messages" element={<ClientMessages />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={<DashboardLayout role="admin" />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
