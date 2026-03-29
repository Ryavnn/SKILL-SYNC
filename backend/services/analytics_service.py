from app import db
from repositories.admin_repository import AdminRepository
from models.analytics_summary import AnalyticsSummary

class AnalyticsService:
    """Service for platform-wide data aggregation and insights."""

    def __init__(self):
        self.repo = AdminRepository()

    def update_analytics(self):
        """Forces an aggregation of all platform data and updates the AnalyticsSummary table."""
        stats = self.repo.get_platform_stats()
        revenue = self.repo.get_revenue_stats()
        
        # Calculate dispute rate
        dispute_rate = 0.0
        if stats["total_contracts"] > 0:
            dispute_rate = round((stats["open_disputes"] / stats["total_contracts"]) * 100, 2)
            
        summary = AnalyticsSummary.query.get(1)
        if not summary:
            summary = AnalyticsSummary(id=1)
            db.session.add(summary)
            
        summary.total_users = stats["total_users"]
        summary.total_projects = stats["total_projects"]
        summary.dispute_rate = dispute_rate
        summary.total_revenue = revenue["total_payouts"] # We'll consider payouts to freelancers as platform 'revenue' going through the system, or adjust as needed
        summary.total_volume = revenue["total_volume"]
        summary.in_escrow = revenue["in_escrow"]
        
        db.session.commit()
        return summary

    def get_dashboard_overview(self):
        """Fetches the pre-calculated dashboard overview from AnalyticsSummary, or calculates if missing."""
        summary = AnalyticsSummary.query.get(1)
        if not summary:
            summary = self.update_analytics()
            
        # Add dynamic live stats that are lightweight (like active users caching could go here)
        stats = self.repo.get_platform_stats()
        
        data = {
            "total_users": summary.total_users,
            "active_users": stats["active_users"], # Keeping this live as it changes frequently
            "total_projects": summary.total_projects,
            "total_contracts": stats["total_contracts"], # Keeping live for now, or move to summary
            "total_referrals": stats["total_referrals"],
            "open_disputes": stats["open_disputes"], # Very important to keep live
            "dispute_rate": summary.dispute_rate,
            "total_volume": summary.total_volume,
            "total_payouts": summary.total_revenue,
            "in_escrow": summary.in_escrow
        }

        return {"data": data, "status": 200}

